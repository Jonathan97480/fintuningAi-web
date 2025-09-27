import { describe, it, expect, vi } from 'vitest'
import { FineTuneJobSchema, DatasetJobSchema, JobStatusEnum } from '../../../shared/src/index'

describe('Shared Schemas', () => {
    describe('JobStatusEnum', () => {
        it('should validate all job status values', () => {
            const validStatuses = ['pending', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled']

            validStatuses.forEach(status => {
                const result = JobStatusEnum.safeParse(status)
                expect(result.success).toBe(true)
                expect(result.data).toBe(status)
            })
        })

        it('should reject invalid status values', () => {
            const invalidStatuses = ['unknown', 'processing', '', null, undefined]

            invalidStatuses.forEach(status => {
                const result = JobStatusEnum.safeParse(status)
                expect(result.success).toBe(false)
            })
        })
    })

    describe('FineTuneJobSchema', () => {
        it('should validate a complete fine-tune job payload', () => {
            const validJob = {
                outputName: 'my-fine-tuned-model',
                baseModelId: 'gpt-2',
                datasetId: 'my-dataset',
                numExamples: 1000,
                maxSteps: 100,
                quantizations: ['fp16', 'int8']
            }

            const result = FineTuneJobSchema.safeParse(validJob)
            expect(result.success).toBe(true)
            expect(result.data).toEqual(validJob)
        })

        it('should provide default values for optional fields', () => {
            const minimalJob = {
                outputName: 'my-model',
                baseModelId: 'gpt-2',
                datasetId: 'my-dataset',
                numExamples: 1000,
                maxSteps: 100
            }

            const result = FineTuneJobSchema.safeParse(minimalJob)
            expect(result.success).toBe(true)
            expect(result.data.quantizations).toEqual(['fp16'])
        })

        it('should reject invalid output names', () => {
            const invalidJob = {
                outputName: 'ab', // Too short
                baseModelId: 'gpt-2',
                datasetId: 'my-dataset',
                numExamples: 1000,
                maxSteps: 100
            }

            const result = FineTuneJobSchema.safeParse(invalidJob)
            expect(result.success).toBe(false)
        })

        it('should reject invalid numExamples', () => {
            const invalidJob = {
                outputName: 'my-model',
                baseModelId: 'gpt-2',
                datasetId: 'my-dataset',
                numExamples: -1, // Invalid negative number
                maxSteps: 100
            }

            const result = FineTuneJobSchema.safeParse(invalidJob)
            expect(result.success).toBe(false)
        })

        it('should reject invalid maxSteps', () => {
            const invalidJob = {
                outputName: 'my-model',
                baseModelId: 'gpt-2',
                datasetId: 'my-dataset',
                numExamples: 1000,
                maxSteps: 0 // Invalid zero
            }

            const result = FineTuneJobSchema.safeParse(invalidJob)
            expect(result.success).toBe(false)
        })
    })

    describe('DatasetJobSchema', () => {
        it('should validate a complete dataset job payload', () => {
            const validJob = {
                repo: 'https://huggingface.co/datasets/my-dataset',
                dataset: 'my-dataset',
                maxExamples: 1000,
                outputName: 'processed-dataset'
            }

            const result = DatasetJobSchema.safeParse(validJob)
            expect(result.success).toBe(true)
            expect(result.data).toEqual(validJob)
        })

        it('should provide default values for optional fields', () => {
            const minimalJob = {
                outputName: 'my-dataset'
            }

            const result = DatasetJobSchema.safeParse(minimalJob)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.maxExamples).toBe(1000)
            }
        })

        it('should reject invalid output names', () => {
            const invalidJob = {
                outputName: 'ab' // Too short
            }

            const result = DatasetJobSchema.safeParse(invalidJob)
            expect(result.success).toBe(false)
        })

        it('should reject invalid repo URLs', () => {
            const invalidJob = {
                repo: 'not-a-url',
                outputName: 'my-dataset'
            }

            const result = DatasetJobSchema.safeParse(invalidJob)
            expect(result.success).toBe(false)
        })

        it('should reject invalid maxExamples', () => {
            const invalidJob = {
                outputName: 'my-dataset',
                maxExamples: -1 // Invalid negative number
            }

            const result = DatasetJobSchema.safeParse(invalidJob)
            expect(result.success).toBe(false)
        })
    })
})