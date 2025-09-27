import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const datasetCreateSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    hfId: z.string().optional(),
    projectId: z.string().optional(),
});

const datasetUpdateSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    hfId: z.string().optional(),
});

export async function datasetRoutes(app: FastifyInstance) {
    // GET /datasets - List all datasets
    app.get("/datasets", async (request, reply) => {
        const allDatasets = await db.select().from(schema.datasets).limit(100);
        return {
            success: true,
            data: allDatasets,
            meta: {
                timestamp: new Date().toISOString(),
                count: allDatasets.length,
            },
        };
    });

    // POST /datasets - Create new dataset
    app.post("/datasets", async (request, reply) => {
        const parsed = datasetCreateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid dataset data",
                    details: parsed.error.flatten(),
                },
                meta: { timestamp: new Date().toISOString() },
            });
        }

        const datasetId = nanoid();
        await db.insert(schema.datasets).values({
            id: datasetId,
            name: parsed.data.name,
            description: parsed.data.description,
            hfId: parsed.data.hfId,
            projectId: parsed.data.projectId,
        });

        return reply.status(201).send({
            success: true,
            data: { id: datasetId, ...parsed.data },
            meta: { timestamp: new Date().toISOString() },
        });
    });

    // GET /datasets/:id - Get dataset by ID
    app.get("/datasets/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        const [dataset] = await db
            .select()
            .from(schema.datasets)
            .where(eq(schema.datasets.id, id));

        if (!dataset) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Dataset not found",
                },
                meta: { timestamp: new Date().toISOString() },
            });
        }

        return {
            success: true,
            data: dataset,
            meta: { timestamp: new Date().toISOString() },
        };
    });

    // PUT /datasets/:id - Update dataset
    app.put("/datasets/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        const parsed = datasetUpdateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid dataset update data",
                    details: parsed.error.flatten(),
                },
                meta: { timestamp: new Date().toISOString() },
            });
        }

        // Check if dataset exists
        const [existingDataset] = await db
            .select()
            .from(schema.datasets)
            .where(eq(schema.datasets.id, id));

        if (!existingDataset) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Dataset not found",
                },
                meta: { timestamp: new Date().toISOString() },
            });
        }

        // Update dataset
        await db
            .update(schema.datasets)
            .set({
                ...parsed.data,
            })
            .where(eq(schema.datasets.id, id));

        // Return updated dataset
        const [updatedDataset] = await db
            .select()
            .from(schema.datasets)
            .where(eq(schema.datasets.id, id));

        return {
            success: true,
            data: updatedDataset,
            meta: { timestamp: new Date().toISOString() },
        };
    });

    // DELETE /datasets/:id - Delete dataset
    app.delete("/datasets/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        // Check if dataset exists
        const [existingDataset] = await db
            .select()
            .from(schema.datasets)
            .where(eq(schema.datasets.id, id));

        if (!existingDataset) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Dataset not found",
                },
                meta: { timestamp: new Date().toISOString() },
            });
        }

        // Delete dataset
        await db.delete(schema.datasets).where(eq(schema.datasets.id, id));

        return {
            success: true,
            data: { message: "Dataset deleted successfully" },
            meta: { timestamp: new Date().toISOString() },
        };
    });
}