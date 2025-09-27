import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";
import { env } from "../src/config/env";

async function runMigrations() {
    const dbPath = env.DB_PATH ?? "./artifacts/fintuning.db";
    const db = new Database(dbPath);

    // Enable foreign keys
    db.pragma("foreign_keys = ON");

    // Create migrations tracking table if it doesn't exist
    db.exec(`
    CREATE TABLE IF NOT EXISTS "_drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

    const migrationsDir = join(process.cwd(), "drizzle");

    try {
        // Get all migration files
        const migrationFiles = readdirSync(migrationsDir)
            .filter(file => file.endsWith(".sql"))
            .sort();

        console.log(`Found ${migrationFiles.length} migration files`);

        // Get already applied migrations
        const appliedMigrations = new Set(
            db.prepare("SELECT hash FROM _drizzle_migrations").all().map((row: any) => row.hash)
        );

        for (const file of migrationFiles) {
            const hash = file.replace(".sql", "");

            if (appliedMigrations.has(hash)) {
                console.log(`⏭️  Migration ${file} already applied, skipping`);
                continue;
            }

            const filePath = join(migrationsDir, file);
            const sql = readFileSync(filePath, "utf-8");

            console.log(`Running migration: ${file}`);

            // Split SQL into individual statements and execute them
            const statements = sql
                .split(";")
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

            db.exec("BEGIN TRANSACTION");

            try {
                for (const statement of statements) {
                    if (statement.trim()) {
                        db.exec(statement + ";");
                    }
                }

                // Mark migration as applied
                db.prepare("INSERT INTO _drizzle_migrations (hash) VALUES (?)").run(hash);

                db.exec("COMMIT");
                console.log(`✅ Migration ${file} completed`);
            } catch (error) {
                db.exec("ROLLBACK");
                throw error;
            }
        }

        console.log("🎉 All migrations completed successfully");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        db.close();
    }
}

runMigrations();