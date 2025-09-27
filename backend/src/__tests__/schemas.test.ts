import { describe, it, expect } from 'vitest'
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
            const validPayload = {
                outputName: 'my-fine-tuned-model',
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'my-dataset',
                numExamples: 1000,
                maxSteps: 500,
                quantizations: ['fp16', 'int8']
            }

            const result = FineTuneJobSchema.safeParse(validPayload)
            expect(result.success).toBe(true)
            expect(result.data).toEqual(validPayload)
        })

        it('should provide default quantizations', () => {
            const payloadWithoutQuantizations = {
                outputName: 'my-model',
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'my-dataset',
                numExamples: 1000,
                maxSteps: 500
            }

            const result = FineTuneJobSchema.safeParse(payloadWithoutQuantizations)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.quantizations).toEqual(['fp16'])
            }
        })

        it('should reject invalid outputName', () => {
            const invalidPayloads = [
                { outputName: 'ab' }, // Too short
                { outputName: '' }, // Empty
                { outputName: 'a'.repeat(100) } // Too long (assuming max length)
            ]

            invalidPayloads.forEach(payload => {
                const result = FineTuneJobSchema.safeParse(payload)
                expect(result.success).toBe(false)
            })
        })

        it('should reject invalid numExamples', () => {
            const invalidPayloads = [
                { outputName: 'test', baseModelId: 'model', datasetId: 'dataset', maxSteps: 500, numExamples: 0 },
                { outputName: 'test', baseModelId: 'model', datasetId: 'dataset', maxSteps: 500, numExamples: -1 }
            ]

            invalidPayloads.forEach(payload => {
                const result = FineTuneJobSchema.safeParse(payload)
                expect(result.success).toBe(false)
            })
        })
    })

    describe('DatasetJobSchema', () => {
        it('should validate a dataset job with repo URL', () => {
            const validPayload = {
                repo: 'https://github.com/microsoft/vscode',
                maxExamples: 1000,
                outputName: 'vscode-dataset'
            }

            const result = DatasetJobSchema.safeParse(validPayload)
            expect(result.success).toBe(true)
            expect(result.data).toEqual(validPayload)
        })

        it('should validate a dataset job with HF dataset', () => {
            const validPayload = {
                dataset: 'microsoft/DialoGPT-medium',
                maxExamples: 500,
                outputName: 'dialogpt-dataset'
            }

            const result = DatasetJobSchema.safeParse(validPayload)
            expect(result.success).toBe(true)
            expect(result.data).toEqual(validPayload)
        })

        it('should provide default maxExamples', () => {
            const payload = {
                repo: 'https://github.com/microsoft/vscode',
                outputName: 'vscode-dataset'
            }

            const result = DatasetJobSchema.safeParse(payload)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.maxExamples).toBe(1000)
            }
        })

        it('should reject invalid repo URL', () => {
            const invalidPayloads = [
                { repo: 'not-a-url', outputName: 'test' },
                { repo: 'ftp://example.com', outputName: 'test' },
                { repo: '', outputName: 'test' }
            ]

            invalidPayloads.forEach(payload => {
                const result = DatasetJobSchema.safeParse(payload)
                expect(result.success).toBe(false)
            })
        })

        it('should reject dataset job without repo or dataset', () => {
            const invalidPayload = {
                maxExamples: 1000,
                outputName: 'test-dataset'
            }

            const result = DatasetJobSchema.safeParse(invalidPayload)
            expect(result.success).toBe(false)
        })

        it('should accept dataset job with both repo and dataset', () => {
            const payload = {
                repo: 'https://github.com/microsoft/vscode',
                dataset: 'microsoft/DialoGPT-medium',
                maxExamples: 1000,
                outputName: 'combined-dataset'
            }

            const result = DatasetJobSchema.safeParse(payload)
            expect(result.success).toBe(true)
        })
    })
})