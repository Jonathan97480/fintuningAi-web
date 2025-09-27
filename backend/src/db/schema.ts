import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  roles: text("roles", { mode: "json" }).<string[]>(),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sqlCURRENT_TIMESTAMP),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  payload: blob("payload", { mode: "json" }).<Record<string, unknown>>(),
  progress: real("progress"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sqlCURRENT_TIMESTAMP),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sqlCURRENT_TIMESTAMP),
});

export const jobEvents = sqliteTable("job_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id").references(() => jobs.id).notNull(),
  level: text("level").default("info"),
  message: text("message").notNull(),
  data: blob("data", { mode: "json" }).<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sqlCURRENT_TIMESTAMP),
});

export const hfModels = sqliteTable("hf_models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  task: text("task").notNull(),
  license: text("license"),
  quantization: blob("quantization", { mode: "json" }).<string[]>(),
  paramsBillion: real("params_billion"),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
    .notNull()
    .default(sqlCURRENT_TIMESTAMP),
});

export const datasetPresets = sqliteTable("dataset_presets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  filters: blob("filters", { mode: "json" }).<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sqlCURRENT_TIMESTAMP),
});
