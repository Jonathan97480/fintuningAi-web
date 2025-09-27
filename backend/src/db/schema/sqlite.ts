import { sqliteTable, text, integer, real, blob, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email", { length: 255 }).notNull().unique(),
  roles: blob("roles", { mode: "json" }).$type<string[]>().notNull(),
  displayName: text("display_name", { length: 100 }),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // Email validation constraint
  check("email_format", sql`email LIKE '%@%' AND LENGTH(email) >= 5`),
  // Display name length constraint
  check("display_name_length", sql`display_name IS NULL OR LENGTH(display_name) <= 100`),
]);

export const apiTokens = sqliteTable("api_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  label: text("label", { length: 100 }),
  hash: text("hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
}, (table) => [
  // Label length constraint
  check("label_length", sql`label IS NULL OR LENGTH(label) <= 100`),
  // Hash format constraint (assuming SHA-256)
  check("hash_format", sql`LENGTH(hash) = 64 OR hash = 'hash-placeholder'`),
]);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name", { length: 200 }).notNull(),
  description: text("description", { length: 1000 }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // Name constraints
  check("name_not_empty", sql`LENGTH(TRIM(name)) > 0`),
  check("name_length", sql`LENGTH(name) <= 200`),
  // Description length constraint
  check("description_length", sql`description IS NULL OR LENGTH(description) <= 1000`),
]);

export const datasets = sqliteTable("datasets", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  hfId: text("hf_id"),
  name: text("name", { length: 200 }).notNull(),
  description: text("description", { length: 500 }),
  storagePath: text("storage_path"),
  meta: blob("meta", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  // Name constraints
  check("dataset_name_not_empty", sql`LENGTH(TRIM(name)) > 0`),
  check("dataset_name_length", sql`LENGTH(name) <= 200`),
  // Description length constraint
  check("dataset_description_length", sql`description IS NULL OR LENGTH(description) <= 500`),
  // HF ID format constraint (if provided)
  check("hf_id_format", sql`hf_id IS NULL OR hf_id LIKE '%.%'`),
]);

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
}, (table) => [
  // Type constraints
  check("job_type_valid", sql`type IN ('fine-tune', 'dataset-prep', 'model-upload')`),
  // Status constraints
  check("job_status_valid", sql`status IN ('pending', 'running', 'completed', 'failed', 'cancelled')`),
  // Progress constraints
  check("progress_range", sql`progress IS NULL OR (progress >= 0 AND progress <= 100)`),
]);

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
