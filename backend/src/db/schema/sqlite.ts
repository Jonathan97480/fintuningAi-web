import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  roles: blob("roles", { mode: "json" }).$type<string[]>().notNull(),
  displayName: text("display_name"),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const apiTokens = sqliteTable("api_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  label: text("label"),
  hash: text("hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const datasets = sqliteTable("datasets", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  hfId: text("hf_id"),
  name: text("name").notNull(),
  description: text("description"),
  storagePath: text("storage_path"),
  meta: blob("meta", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  payload: blob("payload", { mode: "json" }).$type<Record<string, unknown>>(),
  progress: real("progress"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const jobEvents = sqliteTable("job_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  level: text("level").default("info"),
  message: text("message").notNull(),
  data: blob("data", { mode: "json" }).$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const jobArtifacts = sqliteTable("job_artifacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  kind: text("kind").notNull(),
  path: text("path").notNull(),
  sizeBytes: integer("size_bytes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const hfModels = sqliteTable("hf_models", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  task: text("task").notNull(),
  license: text("license"),
  quantization: blob("quantization", { mode: "json" }).$type<string[]>(),
  paramsBillion: real("params_billion"),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const datasetPresets = sqliteTable("dataset_presets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: blob("filters", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
