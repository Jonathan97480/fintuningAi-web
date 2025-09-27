import { env } from "../../config/env";
import * as sqliteSchema from "./sqlite";
import * as mysqlSchema from "./mysql";

const useMysql = env.DB_DIALECT === "mysql";

export const schema = useMysql ? mysqlSchema : sqliteSchema;

export const users = schema.users;
export const apiTokens = schema.apiTokens;
export const projects = schema.projects;
export const datasets = schema.datasets;
export const jobs = schema.jobs;
export const jobEvents = schema.jobEvents;
export const jobArtifacts = schema.jobArtifacts;
export const hfModels = schema.hfModels;
export const datasetPresets = schema.datasetPresets;

export const currentSchema = schema;
export { mysqlSchema };

