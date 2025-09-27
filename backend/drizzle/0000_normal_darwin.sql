-- Add projects, datasets, and related tables
CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "roles" blob NOT NULL,
    "display_name" text,
    "password_hash" text,
    "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE TABLE IF NOT EXISTS "api_tokens" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL,
    "label" text,
    "hash" text NOT NULL,
    "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    "last_used_at" integer,
    "expires_at" integer,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" text PRIMARY KEY NOT NULL,
    "owner_id" text,
    "name" text NOT NULL,
    "description" text,
    "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "datasets" (
    "id" text PRIMARY KEY NOT NULL,
    "project_id" text,
    "hf_id" text,
    "name" text NOT NULL,
    "description" text,
    "storage_path" text,
    "meta" blob,
    "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

ALTER TABLE "jobs" ADD COLUMN "project_id" text REFERENCES "projects"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "job_artifacts" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "job_id" text NOT NULL,
    "kind" text NOT NULL,
    "path" text NOT NULL,
    "size_bytes" integer,
    "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "hf_models" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "task" text NOT NULL,
    "license" text,
    "quantization" blob,
    "params_billion" real,
    "last_seen_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE TABLE IF NOT EXISTS "dataset_presets" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" text,
    "name" text NOT NULL,
    "filters" blob,
    "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
