import { FastifyInstance } from "fastify";
import { DatasetSearchPresetSchema } from "shared";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq } from "drizzle-orm";

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
  app.get("/hf/models", async (request, reply) => {
    const parsed = modelQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ errors: z.treeifyError(parsed.error) });
    }

    const { page, pageSize } = parsed.data;
    const offset = (page - 1) * pageSize;

    const models = await (db as any)
      .select()
      .from(schema.hfModels)
      .limit(pageSize)
      .offset(offset);

    const results = models.length
      ? models.map((model: typeof schema.hfModels.$inferSelect) => ({
        id: model.id,
        name: model.name,
        task: model.task,
        license: model.license ?? "--",
        quantization: model.quantization ?? [],
        updatedAt: new Date(model.lastSeenAt ?? Date.now()).toISOString(),
      }))
      : Array.from({ length: pageSize }).map((_, index) => ({
        id: `model-${page}-${index}`,
        name: `Demo HF Model ${page}-${index}`,
        task: parsed.data.task ?? "text-generation",
        license: parsed.data.license ?? "apache-2.0",
        quantization: ["fp16", "nf4"],
        updatedAt: new Date().toISOString(),
      }));

    return {
      page,
      pageSize,
      total: models.length ? models.length + offset : 200,
      results,
    };
  });

  app.get("/hf/datasets/search", async (request, reply) => {
    const parsed = datasetQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ errors: z.treeifyError(parsed.error) });
    }

    const results = Array.from({ length: 10 }).map((_, index) => ({
      id: `dataset-${index}`,
      name: `Dataset demo ${index}`,
      locked: index % 3 === 0 && !request.user?.id,
      size: 4096 * (index + 1),
      description: "Resultat de recherche factice en attendant l'intégration Hugging Face.",
    }));

    return {
      query: parsed.data,
      results,
    };
  });

  app.get("/hf/datasets/presets", async (request) => {
    if (!request.user?.id) return [];
    return (db as any)
      .select()
      .from(schema.datasetPresets)
      .where(eq(schema.datasetPresets.userId, request.user.id));
  });

  app.post("/hf/datasets/presets", async (request, reply) => {
    const parsed = DatasetSearchPresetSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ errors: z.treeifyError(parsed.error) });
    }

    const insertResult = await (db as any)
      .insert(schema.datasetPresets)
      .values({
        userId: request.user?.id ?? null,
        name: parsed.data.name,
        filters: parsed.data.filters,
      })
      .returning({ id: schema.datasetPresets.id });

    return reply.status(201).send({ presetId: insertResult[0]?.id ?? null, ...parsed.data });
  });
}
