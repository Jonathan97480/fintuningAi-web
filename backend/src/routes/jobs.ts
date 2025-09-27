import { FastifyInstance } from \"fastify\";
import { FineTuneJobSchema } from \"shared\";
import { jobQueue } from \"../services/jobQueue\";
import { db } from \"../db/client\";
import { jobs, jobEvents } from \"../db/schema\";
import { eq, desc } from \"drizzle-orm\";
import { randomUUID } from \"crypto\";

export async function jobRoutes(app: FastifyInstance) {
  app.get(\"/jobs\", async () => {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(50);
  });

  app.get(\"/jobs/:jobId\", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const [row] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!row) {
      return reply.status(404).send({ message: \"Job introuvable\" });
    }
    return row;
  });

  app.get(\"/jobs/:jobId/events\", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const rows = await db
      .select()
      .from(jobEvents)
      .where(eq(jobEvents.jobId, jobId))
      .orderBy(desc(jobEvents.id))
      .limit(100);
    return rows;
  });

  app.post(\"/jobs/fine-tune\", async (request, reply) => {
    const parsed = FineTuneJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors });
    }

    const userId = request.user?.id ?? \"anonymous\";
    const jobId = randomUUID();

    await db.insert(jobs).values({
      id: jobId,
      userId,
      type: \"fine-tune\",
      status: \"pending\",
      payload: parsed.data,
    });

    await jobQueue.add(
      \"fine-tune\",
      {
        ...parsed.data,
        userId,
      },
      { jobId }
    );

    return reply.status(202).send({ jobId });
  });
}
