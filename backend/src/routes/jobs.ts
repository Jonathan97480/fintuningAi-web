import { FastifyInstance } from "fastify";
import { FineTuneJobSchema, JobRecordSchema, JobEventSchema } from "shared";
import { jobQueue } from "../services/jobQueue";
import { db, schema } from "../db/client";
import { desc, eq, gt, and } from "drizzle-orm";
import { randomUUID } from "crypto";

type JobRow = typeof schema.jobs.;
type JobEventRow = typeof schema.jobEvents.;

type SerializedEvent = ReturnType<typeof serializeEvent>;

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
    const rows = await db.select().from(schema.jobs).orderBy(desc(schema.jobs.createdAt)).limit(50);
    return rows.map(serializeJob);
  });

  app.get("/jobs/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const [row] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).limit(1);
    if (!row) {
      return reply.status(404).send({ message: "Job introuvable" });
    }
    return serializeJob(row);
  });

  app.get("/jobs/:jobId/events", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const rows = await db
      .select()
      .from(schema.jobEvents)
      .where(eq(schema.jobEvents.jobId, jobId))
      .orderBy(desc(schema.jobEvents.id))
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
      reply.raw.write(vent: \n);
      if (id != null) reply.raw.write(id: \n);
      reply.raw.write(data: \n\n);
    };

    const interval = setInterval(async () => {
      if (running || isClosed) return;
      running = true;
      try {
        const condition = lastId
          ? and(eq(schema.jobEvents.jobId, jobId), gt(schema.jobEvents.id, lastId))
          : eq(schema.jobEvents.jobId, jobId);

        const rows = await db
          .select()
          .from(schema.jobEvents)
          .where(condition)
          .orderBy(schema.jobEvents.id)
          .limit(25);

        rows.forEach((row) => {
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

    await db.insert(schema.jobs).values({
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
