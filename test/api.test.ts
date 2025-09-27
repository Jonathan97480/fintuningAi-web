import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import { healthRoutes } from '../backend/src/routes/health'
// import { jobRoutes } from '../backend/src/routes/jobs' // Commented out for now due to dependencies

describe('API Routes', () => {
    let app: any

    beforeAll(async () => {
        app = Fastify()

        // Register routes
        await app.register(healthRoutes)
        // await app.register(jobRoutes) // Commented out for now

        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    describe('Health Routes', () => {
        it('should return health status', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/health'
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.body)
            expect(body).toHaveProperty('status', 'ok')
            expect(body).toHaveProperty('timestamp')
            expect(typeof body.timestamp).toBe('string')
        })
    })

    // TODO: Add job routes tests once database and service dependencies are mocked
    /*
    describe('Jobs Routes', () => {
        // ... job route tests commented out for now
    })

    describe('Error Handling', () => {
        // ... error handling tests commented out for now
    })
    */
})