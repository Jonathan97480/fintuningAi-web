import { Worker, Job } from "bullmq";
import { spawn } from "child_process";
import { env } from "../config/env";
import { db } from "../db/client";
import { jobs, jobEvents } from "../db/schema";
import { eq } from "drizzle-orm";
import { JobStatus } from "shared";
import path from "path";

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

async function processFineTune(jobId: string, payload: any) {
  await updateJobStatus(jobId, "running", 5);
  await appendEvent(jobId, "Démarrage du job de fine-tuning");

  return new Promise<void>((resolve, reject) => {
    // Chemin vers le worker Python
    const workerPath = path.join(process.cwd(), "workers", "python", "src");

    // Lancer le worker Python
    const pythonProcess = spawn("python", ["-m", "fintuning_workers.cli", "fine-tune", "--config", "-", "--output-dir", `./artifacts/jobs/${jobId}`], {
      cwd: workerPath,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONPATH: workerPath,
      }
    });

    // Envoyer la configuration via stdin
    const config = JSON.stringify(payload);
    pythonProcess.stdin.write(config);
    pythonProcess.stdin.end();

    let progress = 10;

    // Gérer la sortie standard
    pythonProcess.stdout.on("data", async (data) => {
      const output = data.toString().trim();
      console.log(`[Job ${jobId}] ${output}`);

      // Analyser la sortie pour estimer la progression
      if (output.includes("Téléchargement du modèle")) {
        progress = 20;
        await appendEvent(jobId, "Téléchargement du modèle...");
      } else if (output.includes("Chargement du modèle")) {
        progress = 30;
        await appendEvent(jobId, "Chargement du modèle...");
      } else if (output.includes("Démarrage de l'entraînement")) {
        progress = 40;
        await appendEvent(jobId, "Entraînement en cours...");
      } else if (output.includes("Modèle fine-tuné sauvegardé")) {
        progress = 90;
        await appendEvent(jobId, "Sauvegarde du modèle...");
      }

      await updateJobStatus(jobId, "running", progress);
      await appendEvent(jobId, output);
    });

    // Gérer les erreurs
    pythonProcess.stderr.on("data", async (data) => {
      const error = data.toString().trim();
      console.error(`[Job ${jobId} Error] ${error}`);
      await appendEvent(jobId, `Erreur: ${error}`, "error");
    });

    // Gérer la fin du processus
    pythonProcess.on("close", async (code) => {
      if (code === 0) {
        await updateJobStatus(jobId, "completed", 100);
        await appendEvent(jobId, "Job terminé avec succès");
        resolve();
      } else {
        const errorMsg = `Processus Python terminé avec le code ${code}`;
        await appendEvent(jobId, errorMsg, "error");
        await updateJobStatus(jobId, "failed");
        reject(new Error(errorMsg));
      }
    });

    pythonProcess.on("error", async (error) => {
      const errorMsg = `Erreur lors du lancement du processus Python: ${error.message}`;
      await appendEvent(jobId, errorMsg, "error");
      await updateJobStatus(jobId, "failed");
      reject(error);
    });
  });
}

async function processDataset(jobId: string, payload: any) {
  await updateJobStatus(jobId, "running", 5);
  await appendEvent(jobId, "Démarrage de la génération du dataset");

  return new Promise<void>((resolve, reject) => {
    const workerPath = path.join(process.cwd(), "workers", "python", "src");

    // Préparer les arguments
    const args = ["-m", "fintuning_workers.cli", "dataset"];

    if (payload.repo) {
      args.push("--repo", payload.repo);
    }
    if (payload.dataset) {
      args.push("--dataset", payload.dataset);
    }
    if (payload.maxExamples) {
      args.push("--max-examples", payload.maxExamples.toString());
    }
    args.push("--out", `./artifacts/jobs/${jobId}/dataset`);

    // Lancer le worker Python
    const pythonProcess = spawn("python", args, {
      cwd: workerPath,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONPATH: workerPath,
      }
    });

    let progress = 10;

    // Gérer la sortie standard
    pythonProcess.stdout.on("data", async (data) => {
      const output = data.toString().trim();
      console.log(`[Dataset Job ${jobId}] ${output}`);

      // Analyser la sortie pour estimer la progression
      if (output.includes("Clonage du repo")) {
        progress = 30;
        await appendEvent(jobId, "Clonage du dépôt...");
      } else if (output.includes("collecte")) {
        progress = 50;
        await appendEvent(jobId, "Collecte des fichiers...");
      } else if (output.includes("Dataset généré")) {
        progress = 90;
        await appendEvent(jobId, "Finalisation du dataset...");
      }

      await updateJobStatus(jobId, "running", progress);
      await appendEvent(jobId, output);
    });

    // Gérer les erreurs
    pythonProcess.stderr.on("data", async (data) => {
      const error = data.toString().trim();
      console.error(`[Dataset Job ${jobId} Error] ${error}`);
      await appendEvent(jobId, `Erreur: ${error}`, "error");
    });

    // Gérer la fin du processus
    pythonProcess.on("close", async (code) => {
      if (code === 0) {
        await updateJobStatus(jobId, "completed", 100);
        await appendEvent(jobId, "Dataset généré avec succès");
        resolve();
      } else {
        const errorMsg = `Processus Python terminé avec le code ${code}`;
        await appendEvent(jobId, errorMsg, "error");
        await updateJobStatus(jobId, "failed");
        reject(new Error(errorMsg));
      }
    });

    pythonProcess.on("error", async (error) => {
      const errorMsg = `Erreur lors du lancement du processus Python: ${error.message}`;
      await appendEvent(jobId, errorMsg, "error");
      await updateJobStatus(jobId, "failed");
      reject(error);
    });
  });
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
          await processFineTune(jobId, job.data);
          break;
        case "dataset":
          await processDataset(jobId, job.data);
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

// Worker pour les fine-tuning jobs
const fineTuneWorker = new Worker(
  "fine-tune-queue",
  async (job) => {
    if (!job.id) {
      throw new Error("Job ID is required");
    }
    const jobId = job.id as string;
    try {
      await processFineTune(jobId, job.data);
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

// Worker pour les dataset jobs
const datasetWorker = new Worker(
  "dataset-queue",
  async (job) => {
    if (!job.id) {
      throw new Error("Job ID is required");
    }
    const jobId = job.id as string;
    try {
      await processDataset(jobId, job.data);
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

worker.on("ready", () => console.log("Worker général prêt"));
fineTuneWorker.on("ready", () => console.log("Worker fine-tuning prêt"));
datasetWorker.on("ready", () => console.log("Worker dataset prêt"));

worker.on("failed", async (job, err) => {
  if (!job) return;
  if (!job.id) return;
  await appendEvent(job.id, `Job en échec: ${(err as Error).message}`, "error");
});

fineTuneWorker.on("failed", async (job, err) => {
  if (!job) return;
  if (!job.id) return;
  await appendEvent(job.id, `Fine-tuning job en échec: ${(err as Error).message}`, "error");
});

datasetWorker.on("failed", async (job, err) => {
  if (!job) return;
  if (!job.id) return;
  await appendEvent(job.id, `Dataset job en échec: ${(err as Error).message}`, "error");
});
