import { env } from "../../config/env";
import * as sqliteSchema from "./sqlite";
import * as mysqlSchema from "./mysql";

const useMysql = env.DB_DIALECT === "mysql";

const schema = useMysql ? mysqlSchema : sqliteSchema;

export const users = schema.users as typeof sqliteSchema.users;
export const apiTokens = schema.apiTokens as typeof sqliteSchema.apiTokens;
export const projects = schema.projects as typeof sqliteSchema.projects;
export const datasets = schema.datasets as typeof sqliteSchema.datasets;
export const jobs = schema.jobs as typeof sqliteSchema.jobs;
export const jobEvents = schema.jobEvents as typeof sqliteSchema.jobEvents;
export const jobArtifacts = schema.jobArtifacts as typeof sqliteSchema.jobArtifacts;
export const hfModels = schema.hfModels as typeof sqliteSchema.hfModels;
export const datasetPresets = schema.datasetPresets as typeof sqliteSchema.datasetPresets;

export const currentSchema = schema;
