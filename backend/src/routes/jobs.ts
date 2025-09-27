import { FastifyInstance } from \"fastify\";
import { eq } from \"drizzle-orm\";
import { randomUUID } from \"crypto\";
import { FineTuneJobSchema } from \"shared\";
import { jobQueue } from \"../services/jobQueue\";
import { db } from \"../db/client\";
import { jobs } from \"../db/schema\";

export async function jobRoutes(app: FastifyInstance) {
  app.get(\"/jobs\", async () => {
    const rows = await db.select().from(jobs).orderBy(jobs.createdAt).limit(50);
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
