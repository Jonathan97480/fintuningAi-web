import { FastifyInstance } from "fastify";
import { z } from "zod";
import { FineTuneJobSchema, JobRecordSchema, JobEventSchema } from "shared";
import { mysqlSchema } from "../db/schema"
import { jobQueue } from "../services/jobQueue";
import { db } from "../db/client";
import { jobs, jobEvents } from "../db/schema";

import { desc, eq, gt, and } from "drizzle-orm";
import { randomUUID } from "crypto";
export const schema = mysqlSchema

type JobRow = {
  id: string;
  userId: string;
  type: string;
  status: string;
  payload: unknown;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
  progress: number | null;
};
type JobEventRow = z.infer<typeof JobEventSchema>;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
};

const serializeJob = (row: JobRow) => {
  const payload = row.payload
    ? typeof row.payload === "string"
      ? JSON.parse(row.payload)
      : row.payload
    : null;

  return JobRecordSchema.parse({
    ...row,
    payload,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    progress: row.progress ?? 0,
  });
};

const serializeEvent = (row: JobEventRow) =>
  JobEventSchema.parse({
    ...row,
    createdAt: toIso(row.createdAt),
  });

export async function jobRoutes(app: FastifyInstance) {
  app.get("/jobs", async () => {
    const rows = await (db as any).select().from(jobs).orderBy(desc(jobs.createdAt)).limit(50);
    return rows.map(serializeJob);
  });

  app.get("/jobs/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const [row] = await (db as any).select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!row) {
      return reply.status(404).send({ message: "Job introuvable" });
    }
    return serializeJob(row);
  });

  app.get("/jobs/:jobId/events", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const rows = await (db as any)
      .select()
      .from(jobEvents)
      .where(eq(jobEvents.jobId, jobId))
      .orderBy(desc(jobEvents.id))
      .limit(100);
    return rows.map(serializeEvent);
  });

  app.get("/jobs/:jobId/events/stream", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    reply.raw.write("\n");

    let lastId = 0;
    let isClosed = false;
    let running = false;

    const sendEvent = (event: string, data: unknown, id?: number) => {
      reply.raw.write(`event: ${event}\n`);
      if (id != null) reply.raw.write(`id: ${id}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const interval = setInterval(async () => {
      if (running || isClosed) return;
      running = true;
      try {
        const condition = lastId
          ? and(eq(jobEvents.jobId, jobId), gt(jobEvents.id, lastId))
          : eq(jobEvents.jobId, jobId);

        const rows = await (db as any)
          .select()
          .from(jobEvents as any)
          .where(condition)
          .orderBy(jobEvents.id)
          .limit(25);

        rows.forEach((row: JobEventRow) => {
          lastId = row.id;
          const event = serializeEvent(row);
          sendEvent("job.event", event, event.id);
        });

        sendEvent("heartbeat", { ok: true });
      } catch (error) {
        sendEvent("error", { message: (error as Error).message });
      } finally {
        running = false;
      }
    }, 1000);

    request.raw.on("close", () => {
      isClosed = true;
      clearInterval(interval);
    });

    return reply.raw;
  });

  app.post("/jobs/fine-tune", async (request, reply) => {
    const parsed = FineTuneJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors });
    }

    const userId = request.user?.id ?? "anonymous";
    const jobId = randomUUID();

    await (db as any).insert(jobs).values({
      id: jobId,
      userId,
      type: "fine-tune",
      status: "pending",
      payload: parsed.data,
    });

    await jobQueue.add(
      "fine-tune",
      {
        ...parsed.data,
        userId,
      },
      { jobId }
    );

    return reply.status(202).send({ jobId });
  });
}
