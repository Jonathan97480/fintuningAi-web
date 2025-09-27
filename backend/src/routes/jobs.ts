import { FastifyInstance } from \"fastify\";
import { z } from \"zod\";
import { jobQueue } from \"../services/jobQueue\";

const createJobSchema = z.object({
  outputName: z.string().min(3),
  baseModelId: z.string(),
  datasetId: z.string(),
  numExamples: z.number().int().positive(),
  maxSteps: z.number().int().positive(),
  quantizations: z.array(z.string()).default([\"fp16\"]),
});

export async function jobRoutes(app: FastifyInstance) {
  app.post(\"/jobs/fine-tune\", async (request, reply) => {
    const parsed = createJobSchema.safeParse(request.body);
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
