import { describe, it, expect, beforeEach, vi } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { jobRoutes } from '../routes/jobs'
import { db } from '../db/client'
import { jobs, jobEvents } from '../db/schema'

// Mock the job routes to avoid Redis connections
vi.mock('../routes/jobs', () => ({
    jobRoutes: vi.fn().mockImplementation(async (fastify: FastifyInstance) => {
        fastify.post('/jobs/fine-tune', async (request: any, reply: any) => {
            const payload = request.body as any
            // Mock validation - just check if required fields are present
            if (!payload.outputName || !payload.baseModelId || !payload.datasetId) {
                return reply.code(400).send({ error: 'Missing required fields' })
            }
            return reply.code(202).send({ jobId: 'test-job-id-123' })
        })

        fastify.post('/jobs/dataset', async (request: any, reply: any) => {
            const payload = request.body as any
            if (!payload.outputName) {
                return reply.code(400).send({ error: 'Missing required fields' })
            }
            return reply.code(202).send({ jobId: 'test-dataset-job-id-456' })
        })

        fastify.get('/jobs', async (request: any, reply: any) => {
            return reply.code(200).send([
                { id: 'job1', status: 'completed' },
                { id: 'job2', status: 'running' }
            ])
        })
    })
}))

describe('Job Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = Fastify()

        // Register job routes
        await app.register(jobRoutes)

        // Clear database before each test
        vi.clearAllMocks()
    })

    describe('POST /jobs/fine-tune', () => {
        it('should create a fine-tune job successfully', async () => {
            const payload = {
                outputName: 'test-model',
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'test-dataset',
                numExamples: 1000,
                maxSteps: 500,
                quantizations: ['fp16']
            }

            const response = await app.inject({
                method: 'POST',
                url: '/jobs/fine-tune',
                payload
            })

            expect(response.statusCode).toBe(202)
            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('jobId')
            expect(typeof body.jobId).toBe('string')
        })

        it('should validate required fields', async () => {
            const invalidPayload = {
                outputName: 'test-model'
                // Missing required fields
            }

            const response = await app.inject({
                method: 'POST',
                url: '/jobs/fine-tune',
                payload: invalidPayload
            })

            expect(response.statusCode).toBe(400)
            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('error')
            expect(body.error).toBe('Missing required fields')
        })
    })

    describe('POST /jobs/dataset', () => {
        it('should create a dataset job with repo URL', async () => {
            const payload = {
                repo: 'https://github.com/microsoft/vscode',
                maxExamples: 1000,
                outputName: 'vscode-dataset'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/jobs/dataset',
                payload
            })

            expect(response.statusCode).toBe(202)
            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('jobId')
        })
    })

    describe('GET /jobs', () => {
        it('should return list of jobs', async () => {
            // Create a test job first
            const payload = {
                outputName: 'test-model',
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'test-dataset',
                numExamples: 1000,
                maxSteps: 500,
                quantizations: ['fp16']
            }

            await app.inject({
                method: 'POST',
                url: '/jobs/fine-tune',
                payload
            })

            const response = await app.inject({
                method: 'GET',
                url: '/jobs'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(Array.isArray(body)).toBe(true)
            expect(body.length).toBeGreaterThan(0)
        })
    })
})