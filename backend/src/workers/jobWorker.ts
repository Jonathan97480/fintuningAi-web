import { Worker, Job } from \"bullmq\";
import { env } from \"../config/env\";
import { db } from \"../db/client\";
import { jobs, jobEvents } from \"../db/schema\";
import { eq } from \"drizzle-orm\";
import { sleep } from \"../utils/sleep\";
import { JobStatus } from \"shared\";

async function updateJobStatus(jobId: string, status: JobStatus, progress = 0) {
  await db
    .update(jobs)
    .set({ status, progress, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

async function appendEvent(jobId: string, message: string, level: string = \"info\") {
  await db.insert(jobEvents).values({ jobId, message, level });
}

async function processFineTune(job: Job) {
  await updateJobStatus(job.id, \"running\", 5);
  await appendEvent(job.id, \"Job demarre\");

  const steps = [25, 50, 75, 100];
  for (const pct of steps) {
    await sleep(500);
    await updateJobStatus(job.id, pct === 100 ? \"completed\" : \"running\", pct);
    await appendEvent(job.id, Progression %);
  }
}

const worker = new Worker(
  \"jobs\",
  async (job) => {
    try {
      switch (job.name) {
        case \"fine-tune\":
          await processFineTune(job);
          break;
        default:
          await appendEvent(job.id, Job type  non supporte, \"warn\");
          await updateJobStatus(job.id, \"failed\");
      }
    } catch (error) {
      await appendEvent(job.id, (error as Error).message, \"error\");
      await updateJobStatus(job.id, \"failed\");
      throw error;
    }
  },
  {
    connection: { url: env.REDIS_URL },
  }
);

worker.on(\"ready\", () => console.log(\"Worker pret\"));
worker.on(\"failed\", async (job, err) => {
  if (!job) return;
  await appendEvent(job.id, Job en echec: , \"error\");
});
