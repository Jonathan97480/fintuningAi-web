import { Queue } from \"bullmq\";
import { env } from \"../config/env\";

export const jobQueue = new Queue(\"jobs\", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export type FineTuneJobPayload = {
  outputName: string;
  baseModelId: string;
  datasetId: string;
  numExamples: number;
  maxSteps: number;
  quantizations: string[];
  userId: string;
};
