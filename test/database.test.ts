import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from '../backend/src/db/schema/sqlite'

describe('Database Operations', () => {
    let db: ReturnType<typeof drizzle>
    let sqlite: Database.Database

    beforeAll(() => {
        // Create in-memory SQLite database for testing
        sqlite = new Database(':memory:')
        db = drizzle(sqlite, { schema })

        // Create tables using Drizzle migration SQL
        const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text NOT NULL UNIQUE,
        "roles" blob NOT NULL,
        "display_name" text,
        "password_hash" text,
        "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "projects" (
        "id" text PRIMARY KEY NOT NULL,
        "owner_id" text,
        "name" text NOT NULL,
        "description" text,
        "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" text PRIMARY KEY NOT NULL,
        "project_id" text,
        "user_id" text,
        "type" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "payload" blob,
        "progress" real,
        "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        "updated_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS "job_events" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "job_id" text NOT NULL,
        "level" text DEFAULT 'info',
        "message" text NOT NULL,
        "data" blob DEFAULT '{}',
        "created_at" integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
        FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE
      );
    `
        sqlite.exec(createTablesSQL)
    })

    afterAll(() => {
        sqlite.close()
    })

    describe('Users Table', () => {
        it('should create and retrieve a user', async () => {
            const userData = {
                id: 'test-user-1',
                email: 'test@example.com',
                roles: ['user'],
                displayName: 'Test User'
            }

            // Insert user
            const result = await db.insert(schema.users).values(userData).returning()
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject(userData)

            // Retrieve user
            const user = await db.select().from(schema.users).where(eq(schema.users.id, userData.id))
            expect(user).toHaveLength(1)
            expect(user[0]).toMatchObject(userData)
        })

        it('should update a user', async () => {
            const userId = 'test-user-2'
            const initialData = {
                id: userId,
                email: 'test2@example.com',
                roles: ['user'],
                displayName: 'Test User 2'
            }

            // Insert user
            await db.insert(schema.users).values(initialData)

            // Update user
            const updatedData = { displayName: 'Updated Test User 2' }
            const updateResult = await db
                .update(schema.users)
                .set(updatedData)
                .where(eq(schema.users.id, userId))
                .returning()

            expect(updateResult).toHaveLength(1)
            expect(updateResult[0].displayName).toBe(updatedData.displayName)

            // Verify update
            const user = await db.select().from(schema.users).where(eq(schema.users.id, userId))
            expect(user[0].displayName).toBe(updatedData.displayName)
        })

        it('should delete a user', async () => {
            const userId = 'test-user-3'
            const userData = {
                id: userId,
                email: 'test3@example.com',
                roles: ['user'],
                displayName: 'Test User 3'
            }

            // Insert user
            await db.insert(schema.users).values(userData)

            // Delete user
            const deleteResult = await db
                .delete(schema.users)
                .where(eq(schema.users.id, userId))
                .returning()

            expect(deleteResult).toHaveLength(1)

            // Verify deletion
            const user = await db.select().from(schema.users).where(eq(schema.users.id, userId))
            expect(user).toHaveLength(0)
        })
    })

    describe('Projects Table', () => {
        beforeAll(async () => {
            // Create a test user for foreign key
            await db.insert(schema.users).values({
                id: 'project-test-user',
                email: 'project-test@example.com',
                roles: ['user'],
                displayName: 'Project Test User'
            })
        })

        it('should create and retrieve a project', async () => {
            const projectData = {
                id: 'test-project-1',
                name: 'Test Project',
                description: 'A test project',
                ownerId: 'project-test-user'
            }

            // Insert project
            const result = await db.insert(schema.projects).values(projectData).returning()
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject(projectData)

            // Retrieve project
            const project = await db.select().from(schema.projects).where(eq(schema.projects.id, projectData.id))
            expect(project).toHaveLength(1)
            expect(project[0]).toMatchObject(projectData)
        })
    })

    describe('Jobs Table', () => {
        it('should create and retrieve a job', async () => {
            const jobData = {
                id: 'test-job-1',
                type: 'fine-tune',
                payload: {
                    outputName: 'test-job',
                    baseModelId: 'test-model',
                    datasetId: 'test-dataset',
                    numExamples: 100,
                    maxSteps: 50,
                    quantizations: ['fp16']
                },
                status: 'waiting',
                progress: 0
            }

            // Insert job
            const result = await db.insert(schema.jobs).values(jobData).returning()
            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject(jobData)

            // Retrieve job
            const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, jobData.id))
            expect(job).toHaveLength(1)
            expect(job[0]).toMatchObject(jobData)
        })

        it('should update job status and progress', async () => {
            const jobId = 'test-job-2'
            const initialData = {
                id: jobId,
                type: 'fine-tune',
                payload: { test: 'data' },
                status: 'waiting',
                progress: 0
            }

            // Insert job
            await db.insert(schema.jobs).values(initialData)

            // Update job
            const updates = { status: 'running', progress: 50 }
            const updateResult = await db
                .update(schema.jobs)
                .set(updates)
                .where(eq(schema.jobs.id, jobId))
                .returning()

            expect(updateResult).toHaveLength(1)
            expect(updateResult[0].status).toBe(updates.status)
            expect(updateResult[0].progress).toBe(updates.progress)
        })
    })
})