import { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq } from "drizzle-orm";

const projectCreateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

const datasetCreateSchema = z.object({
  projectId: z.string(),
  name: z.string().min(3),
  hfId: z.string().optional(),
  description: z.string().optional(),
});

export async function projectRoutes(app: FastifyInstance) {
  app.get("/projects", async () => {
    return db.select().from(schema.projects).limit(100);
  });

  app.post("/projects", async (request, reply) => {
    const parsed = projectCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(parsed.error.flatten());

    const projectId = nanoid();
    await db.insert(schema.projects).values({
      id: projectId,
      ownerId: request.user?.id ?? null,
      name: parsed.data.name,
      description: parsed.data.description,
    });

    return reply.status(201).send({ id: projectId, ...parsed.data });
  });

  app.get("/projects/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    if (!project) return reply.status(404).send({ message: "Projet introuvable" });

    const datasets = await db
      .select()
      .from(schema.datasets)
      .where(eq(schema.datasets.projectId, id));

    return { ...project, datasets };
  });

  app.post("/datasets", async (request, reply) => {
    const parsed = datasetCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(parsed.error.flatten());

    const datasetId = nanoid();
    await db.insert(schema.datasets).values({
      id: datasetId,
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      hfId: parsed.data.hfId,
      description: parsed.data.description,
    });

    return reply.status(201).send({ id: datasetId, ...parsed.data });
  });
}
