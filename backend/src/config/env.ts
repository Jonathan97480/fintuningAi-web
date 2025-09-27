import { config } from "dotenv";
import { z } from "zod";

config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

const EnvSchema = z
  .object({
    PORT: z.string().default("4000"),
    HOST: z.string().default("0.0.0.0"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    HF_SERVICE_TOKEN: z.string().optional(),
    DB_DIALECT: z.enum(["sqlite", "mysql"]).default("sqlite"),
    DB_PATH: z.string().default("../artifacts/fintuning.db"),
    MYSQL_HOST: z.string().optional(),
    MYSQL_PORT: z.coerce.number().optional(),
    MYSQL_USER: z.string().optional(),
    MYSQL_PASSWORD: z.string().optional(),
    MYSQL_DATABASE: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.DB_DIALECT === "mysql") {
      const required = [
        ["MYSQL_HOST", data.MYSQL_HOST],
        ["MYSQL_USER", data.MYSQL_USER],
        ["MYSQL_PASSWORD", data.MYSQL_PASSWORD],
        ["MYSQL_DATABASE", data.MYSQL_DATABASE],
      ] as const;
      required.forEach(([key, value]) => {
        if (!value) {
          ctx.addIssue({
            path: [key],
            code: z.ZodIssueCode.custom,
            message: `${key} is required when DB_DIALECT=mysql`,
          });
        }
      });
    }
  });

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
