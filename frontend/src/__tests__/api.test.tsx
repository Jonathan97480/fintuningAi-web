import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
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

describe('API Integration Tests', () => {
    describe('Health API', () => {
        it('should fetch health status successfully', async () => {
            const { result } = renderHook(() => api.useGetHealthQuery(), { wrapper })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual({
                status: 'ok',
                timestamp: expect.any(String),
            })
        })
    })

    describe('Models API', () => {
        it('should fetch models list successfully', async () => {
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

        it('should fetch models with task filter', async () => {
            const { result } = renderHook(
                () => api.useListModelsQuery({ task: 'conversational' }),
                { wrapper }
            )

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data?.results).toHaveLength(2)
        })
    })

    describe('Projects API', () => {
        it('should fetch projects list successfully', async () => {
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

        it('should create a project successfully', async () => {
            const { result } = renderHook(() => api.useCreateProjectMutation(), { wrapper })

            const [createProject] = result.current

            act(() => {
                createProject({
                    name: 'New Test Project',
                    description: 'A new test project',
                })
            })

            await waitFor(() => {
                expect(result.current[1].isSuccess).toBe(true)
            })

            expect(result.current[1].data).toEqual({
                id: 'new-project-id',
                ownerId: 'user-1',
                name: 'New Test Project',
                description: 'A new test project',
                createdAt: expect.any(String),
            })
        })
    })

    describe('Jobs API', () => {
        it('should fetch jobs list successfully', async () => {
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

        it('should fetch a specific job successfully', async () => {
            const { result } = renderHook(() => api.useGetJobQuery('job-1'), { wrapper })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual({
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

        it('should fetch job events successfully', async () => {
            const { result } = renderHook(() => api.useListJobEventsQuery('job-1'), { wrapper })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toHaveLength(2)
            expect(result.current.data?.[0]).toEqual({
                id: 1,
                jobId: 'job-1',
                level: 'info',
                message: 'Job started',
                data: {},
                createdAt: expect.any(String),
            })
        })

        it('should create a fine-tune job successfully', async () => {
            const { result } = renderHook(() => api.useCreateFineTuneJobMutation(), { wrapper })

            const [createJob] = result.current

            const jobInput = {
                outputName: 'test-fine-tune',
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'dataset-1',
                numExamples: 100,
                maxSteps: 50,
                quantizations: ['fp16'],
            }

            act(() => {
                createJob(jobInput)
            })

            await waitFor(() => {
                expect(result.current[1].isSuccess).toBe(true)
            })

            expect(result.current[1].data).toEqual({
                jobId: 'new-job-id',
            })
        })
    })
})