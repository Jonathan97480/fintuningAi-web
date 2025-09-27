import { FastifyInstance } from \"fastify\";
import { FineTuneJobSchema } from \"shared\";
import { jobQueue } from \"../services/jobQueue\";

export async function jobRoutes(app: FastifyInstance) {
  app.post(\"/jobs/fine-tune\", async (request, reply) => {
    const parsed = FineTuneJobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors });
    }

    const userId = request.user?.id ?? \"anonymous\";

    const job = await jobQueue.add(\"fine-tune\", {
      ...parsed.data,
      userId,
    });

    return reply.status(202).send({ jobId: job.id });
  });
}
