import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { db } from "../db/client";
import { jobs, jobEvents } from "../db/schema";
import { eq } from "drizzle-orm";
import { sleep } from "../utils/sleep";
import { JobStatus } from "shared";

async function updateJobStatus(jobId: string, status: JobStatus, progress = 0) {
  await (db as any)
    .update(jobs)
    .set({ status, progress, updatedAt: new Date() })
    .where(eq(jobs.id, jobId))
    .execute();
}

async function appendEvent(jobId: string, message: string, level: string = "info") {
  await (db as any).insert(jobEvents).values({ jobId, message, level });
}

async function processFineTune(jobId: string) {
  await updateJobStatus(jobId, "running", 5);
  await appendEvent(jobId, "Job démarré");

  const steps = [25, 50, 75, 100];
  for (const pct of steps) {
    await sleep(500);
    await updateJobStatus(jobId, pct === 100 ? "completed" : "running", pct);
    await appendEvent(jobId, `Progression ${pct}%`);
  }
}

const worker = new Worker(
  "jobs",
  async (job) => {
    if (!job.id) {
      throw new Error("Job ID is required");
    }
    const jobId = job.id as string;
    try {
      switch (job.name) {
        case "fine-tune":
          await processFineTune(jobId);
          break;
        default:
          await appendEvent(jobId, "Job type non supporté", "warn");
          await updateJobStatus(jobId, "failed");
      }
    } catch (error) {
      await appendEvent(jobId, (error as Error).message, "error");
      await updateJobStatus(jobId, "failed");
      throw error;
    }
  },
  {
    connection: { url: env.REDIS_URL },
  }
);

worker.on("ready", () => console.log("Worker prêt"));
worker.on("failed", async (job, err) => {
  if (!job) return;
  if (!job.id) return;
  await appendEvent(job.id, `Job en échec: ${(err as Error).message}`, "error");
});
