import { Queue } from "bullmq";
import { env } from "../config/env";

export const jobQueue = new Queue("jobs", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const fineTuneQueue = new Queue("fine-tune-queue", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const datasetQueue = new Queue("dataset-queue", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
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

export type DatasetJobPayload = {
  repo?: string;
  dataset?: string;
  maxExamples: number;
  outputName: string;
  userId: string;
};
