import { config } from \"dotenv\";
import { z } from \"zod\";

config({ path: process.env.NODE_ENV === \"test\" ? \".env.test\" : \".env\" });

const EnvSchema = z.object({
  PORT: z.string().default(\"4000\"),
  HOST: z.string().default(\"0.0.0.0\"),
  JWT_SECRET: z.string().min(32, \"JWT_SECRET must be at least 32 characters\"),
  REDIS_URL: z.string().default(\"redis://localhost:6379\"),
  HF_SERVICE_TOKEN: z.string().optional(),
  DB_PATH: z.string().default(\"../artifacts/fintuning.db\"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(\"Invalid environment configuration:\", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
