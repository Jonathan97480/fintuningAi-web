import { mysqlTable, varchar, json, timestamp, int, double, text as mysqlText, bigint } from "drizzle-orm/mysql-core";

const timestampDefault = (name: string) => timestamp(name).defaultNow().notNull();

export const users = mysqlTable("users", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  roles: json("roles").$type<string[]>().notNull(),
  displayName: varchar("display_name", { length: 191 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  createdAt: timestampDefault("created_at"),
});

export const apiTokens = mysqlTable("api_tokens", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  userId: varchar("user_id", { length: 191 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 191 }),
  hash: varchar("hash", { length: 255 }).notNull(),
  createdAt: timestampDefault("created_at"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
});

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  ownerId: varchar("owner_id", { length: 191 }).references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 191 }).notNull(),
  description: mysqlText("description"),
  createdAt: timestampDefault("created_at"),
});

export const datasets = mysqlTable("datasets", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  projectId: varchar("project_id", { length: 191 }).references(() => projects.id, { onDelete: "cascade" }),
  hfId: varchar("hf_id", { length: 191 }),
  name: varchar("name", { length: 191 }).notNull(),
  description: mysqlText("description"),
  storagePath: varchar("storage_path", { length: 255 }),
  meta: json("meta").$type<Record<string, unknown>>(),
  createdAt: timestampDefault("created_at"),
});

export const jobs = mysqlTable("jobs", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  projectId: varchar("project_id", { length: 191 }).references(() => projects.id, { onDelete: "set null" }),
  userId: varchar("user_id", { length: 191 }).references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  payload: json("payload").$type<Record<string, unknown>>(),
  progress: double("progress"),
  createdAt: timestampDefault("created_at"),
  updatedAt: timestampDefault("updated_at"),
});

export const jobEvents = mysqlTable("job_events", {
  id: int("id").primaryKey().autoincrement(),
  jobId: varchar("job_id", { length: 191 }).notNull().references(() => jobs.id, { onDelete: "cascade" }),
  level: varchar("level", { length: 50 }).default("info"),
  message: mysqlText("message").notNull(),
  data: json("data").$type<Record<string, unknown>>().default({}),
  createdAt: timestampDefault("created_at"),
});

export const jobArtifacts = mysqlTable("job_artifacts", {
  id: int("id").primaryKey().autoincrement(),
  jobId: varchar("job_id", { length: 191 }).notNull().references(() => jobs.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 100 }).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  createdAt: timestampDefault("created_at"),
});

export const hfModels = mysqlTable("hf_models", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  name: varchar("name", { length: 191 }).notNull(),
  task: varchar("task", { length: 100 }).notNull(),
  license: varchar("license", { length: 100 }),
  quantization: json("quantization").$type<string[]>(),
  paramsBillion: double("params_billion"),
  lastSeenAt: timestampDefault("last_seen_at"),
});

export const datasetPresets = mysqlTable("dataset_presets", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 191 }).references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 191 }).notNull(),
  filters: json("filters").$type<Record<string, unknown>>(),
  createdAt: timestampDefault("created_at"),
});
