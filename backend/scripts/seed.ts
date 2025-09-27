import { nanoid } from "nanoid";
import { db } from "../src/db/client";
import { users, apiTokens, projects, jobs } from "../src/db/schema";
import { randomUUID } from "crypto";

async function seed() {
  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    email: "admin@example.com",
    roles: ["admin"],
    displayName: "Admin",
    passwordHash: "dev-placeholder",
  });

  await db.insert(apiTokens).values({
    id: nanoid(),
    userId,
    label: "dev-token",
    hash: "hash-placeholder",
  });

  const projectId = nanoid();
  await db.insert(projects).values({
    id: projectId,
    ownerId: userId,
    name: "Demo Project",
    description: "Projet de demonstration pour la persistence",
  });

  await db.insert(jobs).values({
    id: randomUUID(),
    projectId,
    userId,
    type: "fine-tune",
    status: "completed",
    progress: 100,
    payload: {
      outputName: "demo-job",
      baseModelId: "Qwen/Qwen2.5-Coder-3B-Instruct",
      datasetId: "demo-dataset",
    },
  });
}

seed()
  .then(() => {
    console.log("Seed executed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
