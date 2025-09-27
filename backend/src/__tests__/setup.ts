import { vi } from 'vitest'

// Mock environment configuration globally before any other imports
vi.mock('../config/env', () => ({
    env: {
        JWT_SECRET: 'test-jwt-secret',
        REDIS_URL: 'redis://localhost:6379',
        DATABASE_URL: ':memory:',
        PORT: 3001,
        HOST: 'localhost',
        NODE_ENV: 'test'
    }
}))

// Mock database client globally
vi.mock('../db/client', () => ({
    db: {
        delete: vi.fn(() => ({ execute: vi.fn() })),
        insert: vi.fn(() => ({ values: vi.fn(() => ({ execute: vi.fn() })) })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                    limit: vi.fn(() => [])
                })),
                where: vi.fn(() => ({
                    limit: vi.fn(() => [])
                }))
            }))
        }))
    }
}))

// Mock BullMQ Queue globally
vi.mock('bullmq', () => ({
    Queue: vi.fn().mockImplementation((name, options) => ({
        name,
        opts: options,
        add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
        getJobs: vi.fn().mockResolvedValue([]),
        close: vi.fn()
    }))
}))

// Mock jobQueue service
vi.mock('../services/jobQueue', () => ({
    fineTuneQueue: {
        add: vi.fn().mockResolvedValue({ id: 'test-fine-tune-job-id' }),
        getJobs: vi.fn().mockResolvedValue([]),
        close: vi.fn()
    },
    datasetQueue: {
        add: vi.fn().mockResolvedValue({ id: 'test-dataset-job-id' }),
        getJobs: vi.fn().mockResolvedValue([]),
        close: vi.fn()
    }
}))

// Mock child_process globally
vi.mock('child_process', async () => {
    const actual = await vi.importActual('child_process')
    return {
        ...actual,
        spawn: vi.fn()
    }
})

// Mock ioredis globally
vi.mock('ioredis', () => ({
    default: vi.fn().mockImplementation(() => ({}))
}))