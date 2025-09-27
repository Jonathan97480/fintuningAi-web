import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { authPlugin } from "./plugins/auth";
import { healthRoutes } from "./routes/health";
import { jobRoutes } from "./routes/jobs";
import { hfRoutes } from "./routes/hf";
import { authRoutes } from "./routes/auth";
import { datasetRoutes } from "./routes/datasets";
import { projectRoutes } from "./routes/projects";

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      process.env.NODE_ENV !== "production"
        ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
        : undefined,
  },
});

app.register(cors, {
  origin: true,
  credentials: true,
});

app.register(authPlugin);
app.register(authRoutes);
app.register(healthRoutes);
app.register(jobRoutes);
app.register(hfRoutes);
app.register(projectRoutes);
app.register(datasetRoutes);

export async function start() {
  try {
    await app.listen({ port: Number(env.PORT), host: env.HOST });
    app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Auto-start server when run directly
if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts')) {
  start();
}
