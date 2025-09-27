import Database from \"better-sqlite3\";
import { drizzle } from \"drizzle-orm/better-sqlite3\";
import { env } from \"../config/env\";

const verbose = process.env.NODE_ENV !== \"production\" ? console.log : undefined;
const sqlite = new Database(env.DB_PATH, { verbose });

export const db = drizzle(sqlite);
