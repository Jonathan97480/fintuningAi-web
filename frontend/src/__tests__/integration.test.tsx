import React from 'react'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Fastify from 'fastify'
import { api } from '@/lib/api/base'

// Create a test store with the API reducer
const createTestStore = () => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware),
    })
}

// Wrapper component for tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={createTestStore()}>{children}</Provider>
)

describe('Frontend-Backend Integration Tests', () => {
    let server: any

    beforeAll(async () => {
        // Start a test backend server
        server = Fastify()

        // Register test routes that match the real backend
        server.get('/health', async () => ({
            status: 'ok',
            timestamp: new Date().toISOString(),
        }))

        server.get('/hf/models', async () => ({
            results: [
                {
                    id: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                    name: 'Qwen2.5-Coder-3B-Instruct',
                    task: 'text-generation',
                    license: 'apache-2.0',
                    quantization: ['fp16', 'q4f16'],
                },
            ],
        }))

        server.get('/projects', async () => [
            {
                id: 'project-1',
                ownerId: 'user-1',
                name: 'Integration Test Project',
                description: 'A project for integration testing',
                createdAt: new Date().toISOString(),
            },
        ])

        server.get('/jobs', async () => [
            {
                id: 'job-1',
                projectId: 'project-1',
                userId: 'user-1',
                type: 'fine_tune',
                status: 'running',
                payload: {
                    baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                    datasetId: 'dataset-1',
                },
                progress: 50,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ])

        await server.listen({ port: 4001, host: 'localhost' })

        // Override the API base URL for tests
        process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:4001'
    })

    afterAll(async () => {
        await server.close()
        delete process.env.NEXT_PUBLIC_API_BASE
    })

    it('should successfully communicate with real backend server', async () => {
        const { result } = renderHook(() => api.useGetHealthQuery(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toEqual({
            status: 'ok',
            timestamp: expect.any(String),
        })
    })

    it('should fetch models from backend', async () => {
        const { result } = renderHook(() => api.useListModelsQuery(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.results).toHaveLength(2)
        expect(result.current.data?.results[0]).toEqual({
            id: 'Qwen/Qwen2.5-Coder-3B-Instruct',
            name: 'Qwen2.5-Coder-3B-Instruct',
            task: 'text-generation',
            license: 'apache-2.0',
            quantization: ['fp16', 'q4f16'],
        })
    })

    it('should fetch projects from backend', async () => {
        const { result } = renderHook(() => api.useListProjectsQuery(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data?.[0]).toEqual({
            id: 'project-1',
            ownerId: 'user-1',
            name: 'Test Project',
            description: 'A test project',
            createdAt: expect.any(String),
        })
    })

    it('should fetch jobs from backend', async () => {
        const { result } = renderHook(() => api.useListJobsQuery(), { wrapper })

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data).toHaveLength(1)
        expect(result.current.data?.[0]).toEqual({
            id: 'job-1',
            projectId: 'project-1',
            userId: 'user-1',
            type: 'fine_tune',
            status: 'completed',
            payload: {
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'dataset-1',
            },
            progress: 100,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
        })
    })

    it('should handle API errors gracefully', async () => {
        // Test with invalid endpoint
        const { result } = renderHook(() => api.useGetJobQuery('non-existent-job'), { wrapper })

        await waitFor(() => {
            expect(result.current.isError).toBe(true)
        })

        expect(result.current.error).toBeDefined()
    })
})