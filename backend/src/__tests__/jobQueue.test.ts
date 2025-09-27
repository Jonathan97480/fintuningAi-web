import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Queue } from 'bullmq'
import { fineTuneQueue, datasetQueue } from '../services/jobQueue'

describe('Job Queue Services', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('fineTuneQueue', () => {
        it('should be a BullMQ Queue instance', () => {
            expect(fineTuneQueue).toBeInstanceOf(Queue)
        })

        it('should have correct queue name', () => {
            expect((fineTuneQueue as any).name).toBe('fine-tune-queue')
        })

        it('should have retry configuration', () => {
            const options = (fineTuneQueue as any).opts
            expect(options.defaultJobOptions.attempts).toBe(3)
            expect(options.defaultJobOptions.backoff.type).toBe('exponential')
        })
    })

    describe('datasetQueue', () => {
        it('should be a BullMQ Queue instance', () => {
            expect(datasetQueue).toBeInstanceOf(Queue)
        })

        it('should have correct queue name', () => {
            expect((datasetQueue as any).name).toBe('dataset-queue')
        })

        it('should have different retry configuration than fine-tune', () => {
            const fineTuneOptions = (fineTuneQueue as any).opts
            const datasetOptions = (datasetQueue as any).opts

            expect(fineTuneOptions.defaultJobOptions.attempts).toBe(3)
            expect(datasetOptions.defaultJobOptions.attempts).toBe(2)
        })
    })
})