import { FastifyInstance } from \"fastify\";
import { DatasetSearchPresetSchema } from \"shared\";
import { z } from \"zod\";

const modelQuerySchema = z.object({
  task: z.string().optional(),
  license: z.string().optional(),
  framework: z.string().optional(),
  quantization: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const datasetQuerySchema = z.object({
  q: z.string().optional(),
  task: z.string().optional(),
  language: z.array(z.string()).optional(),
  license: z.string().optional(),
  sizeMin: z.coerce.number().optional(),
  sizeMax: z.coerce.number().optional(),
  sort: z.string().optional(),
});

export async function hfRoutes(app: FastifyInstance) {
  app.get(\"/hf/models\", async (request, reply) => {
    const parsed = modelQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors });
    }

    const { page, pageSize } = parsed.data;
    const results = Array.from({ length: pageSize }).map((_, index) => ({
      id: model--,
      name: Demo HF Model -,
      task: parsed.data.task ?? \"text-generation\",
      license: parsed.data.license ?? \"apache-2.0\",
      quantization: [\"fp16\", \"nf4\"],
      updatedAt: new Date().toISOString(),
    }));

    return {
      page,
      pageSize,
      total: 200,
      results,
    };
  });

  app.get(\"/hf/datasets/search\", async (request, reply) => {
    const parsed = datasetQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors });
    }

    const results = Array.from({ length: 10 }).map((_, index) => ({
      id: dataset-,
      name: Dataset demo ,
      locked: index % 3 === 0 && !request.user?.id,
      size: 4096 * (index + 1),
      description: \"Resultat de recherche factice en attendant l'integration Hugging Face.\",
    }));

    return {
      query: parsed.data,
      results,
    };
  });

  app.post(\"/hf/datasets/presets\", async (request, reply) => {
    const parsed = DatasetSearchPresetSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors });
    }

    // TODO: persister en base SQLite.
    return reply.status(201).send({ presetId: \"demo\", ...parsed.data });
  });
}
