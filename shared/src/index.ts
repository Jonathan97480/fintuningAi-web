import { z } from "zod";

export const JobStatusEnum = z.enum([
  "pending",
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
]);
export type JobStatus = z.infer<typeof JobStatusEnum>;

export const FineTuneJobSchema = z.object({
  outputName: z.string().min(3),
  baseModelId: z.string(),
  datasetId: z.string(),
  numExamples: z.number().int().positive(),
  maxSteps: z.number().int().positive(),
  quantizations: z.array(z.string()).default(["fp16"]),
});

export type FineTuneJobInput = z.infer<typeof FineTuneJobSchema>;

export const DatasetJobSchema = z.object({
  repo: z.string().url().optional(),
  dataset: z.string().optional(),
  maxExamples: z.number().int().positive().default(1000),
  outputName: z.string().min(3),
});

export type DatasetJobInput = z.infer<typeof DatasetJobSchema>;

export const JobRecordSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  type: z.string(),
  status: JobStatusEnum,
  progress: z.number().nullable().optional(),
  payload: z.object({}).catchall(z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type JobRecord = z.infer<typeof JobRecordSchema>;

export const JobEventSchema = z.object({
  id: z.number(),
  jobId: z.string(),
  level: z.string(),
  message: z.string(),
  createdAt: z.string(),
});

export type JobEvent = z.infer<typeof JobEventSchema>;

export const ProjectRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type ProjectRecord = z.infer<typeof ProjectRecordSchema>;

export const DatasetRecordSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable().optional(),
  hfId: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  storagePath: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type DatasetRecord = z.infer<typeof DatasetRecordSchema>;

export const DatasetSearchPresetSchema = z.object({
  name: z.string().min(2),
  filters: z.object({
    task: z.string().optional(),
    language: z.array(z.string()).optional(),
    license: z.string().optional(),
    sizeRange: z.tuple([z.number(), z.number()]).optional(),
  }),
});

export * from "./utils";
