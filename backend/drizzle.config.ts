import { defineConfig } from "drizzle-kit";

const dialect = process.env.DB_DIALECT === "mysql" ? "mysql" : "sqlite";

export default defineConfig({
  schema:
    dialect === "mysql"
      ? "./src/db/schema/mysql.ts"
      : "./src/db/schema/sqlite.ts",
  out: "./drizzle",
  dialect,
  dbCredentials:
    dialect === "mysql"
      ? {
          host: process.env.MYSQL_HOST ?? "localhost",
          port: Number(process.env.MYSQL_PORT ?? 3306),
          user: process.env.MYSQL_USER ?? "root",
          password: process.env.MYSQL_PASSWORD ?? "",
          database: process.env.MYSQL_DATABASE ?? "fintuning",
        }
      : {
          url: process.env.DB_PATH ?? "./artifacts/fintuning.db",
        },
});
