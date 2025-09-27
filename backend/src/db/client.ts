import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { env } from "../config/env";
import * as sqliteSchema from "./schema/sqlite";
import * as mysqlSchema from "./schema/mysql";
import { currentSchema } from "./schema";

const verbose = process.env.NODE_ENV !== "production" ? console.log : undefined;

let sqliteDb: Database.Database | undefined;
let mysqlPool: mysql.Pool | undefined;

// SQLite-specific client for type safety
export const sqliteClient = (() => {
  const db = new Database(env.DB_PATH, { verbose });
  return drizzleSqlite(db, { schema: sqliteSchema });
})();

// Use SQLite client by default (can be extended for MySQL later)
export const db = sqliteClient;

// Helper functions for date conversion
export const dateToUnix = (date: Date): number => Math.floor(date.getTime() / 1000);
export const unixToDate = (unix: number): Date => new Date(unix * 1000);

export type DbClient = typeof db;

export const schema = currentSchema;

export async function closeConnections() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = undefined;
  }
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = undefined;
  }
}
