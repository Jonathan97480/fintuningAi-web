import { z } from \"zod\";

export const JobStatusEnum = z.enum(["pending", "queued", "running", "paused", "completed", "failed", "cancelled"]);
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

export const DatasetSearchPresetSchema = z.object({
  name: z.string().min(2),
  filters: z.object({
    task: z.string().optional(),
    language: z.array(z.string()).optional(),
    license: z.string().optional(),
    sizeRange: z.tuple([z.number(), z.number()]).optional(),
  }),
});

export type DatasetSearchPreset = z.infer<typeof DatasetSearchPresetSchema>;
