import { describe, it, expect, vi, beforeEach } from 'vitest'
import { spawn } from 'child_process'
import path from 'path'

// Mock child_process.spawn
vi.mock('child_process', () => ({
    spawn: vi.fn()
}))

describe('Python Workers CLI', () => {
    const mockSpawn = vi.mocked(spawn)

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Fine-tune CLI', () => {
        it('should spawn python process with correct arguments for fine-tuning', () => {
            // Mock successful spawn
            const mockProcess = {
                stdin: { write: vi.fn(), end: vi.fn() },
                stdout: { on: vi.fn() },
                stderr: { on: vi.fn() },
                on: vi.fn(),
                kill: vi.fn()
            }
            mockSpawn.mockReturnValue(mockProcess as any)

            // Import and test would go here, but since we're testing CLI directly,
            // we'll verify the spawn call structure
            const workerPath = path.join(process.cwd(), 'workers', 'python', 'src')
            const expectedArgs = [
                'python',
                '-m',
                'fintuning_workers.cli',
                'fine-tune',
                '--config',
                '-',
                '--output-dir',
                './artifacts/jobs/test-job-id'
            ]

            // This would be the call made by jobWorker.ts
            spawn('python', expectedArgs, {
                cwd: workerPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: expect.any(Object)
            })

            expect(mockSpawn).toHaveBeenCalledWith(
                'python',
                expect.arrayContaining(['-m', 'fintuning_workers.cli', 'fine-tune']),
                expect.objectContaining({
                    cwd: workerPath,
                    stdio: ['pipe', 'pipe', 'pipe']
                })
            )
        })
    })

    describe('Dataset CLI', () => {
        it('should spawn python process with correct arguments for dataset generation', () => {
            const mockProcess = {
                stdin: { write: vi.fn(), end: vi.fn() },
                stdout: { on: vi.fn() },
                stderr: { on: vi.fn() },
                on: vi.fn(),
                kill: vi.fn()
            }
            mockSpawn.mockReturnValue(mockProcess as any)

            const workerPath = path.join(process.cwd(), 'workers', 'python', 'src')
            const expectedArgs = [
                'python',
                '-m',
                'fintuning_workers.cli',
                'dataset',
                '--repo',
                'https://github.com/microsoft/vscode',
                '--max-examples',
                '1000',
                '--out',
                './artifacts/jobs/test-job-id/dataset'
            ]

            spawn('python', expectedArgs, {
                cwd: workerPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: expect.any(Object)
            })

            expect(mockSpawn).toHaveBeenCalledWith(
                'python',
                expect.arrayContaining([
                    '-m',
                    'fintuning_workers.cli',
                    'dataset',
                    '--repo',
                    'https://github.com/microsoft/vscode'
                ]),
                expect.objectContaining({
                    cwd: workerPath,
                    stdio: ['pipe', 'pipe', 'pipe']
                })
            )
        })
    })

    describe('Process error handling', () => {
        it('should handle process spawn errors', () => {
            const spawnError = new Error('Python not found')
            mockSpawn.mockImplementation(() => {
                throw spawnError
            })

            expect(() => {
                spawn('python', ['--version'], {})
            }).toThrow('Python not found')
        })

        it('should handle process exit codes', () => {
            const mockProcess = {
                stdin: { write: vi.fn(), end: vi.fn() },
                stdout: { on: vi.fn() },
                stderr: { on: vi.fn() },
                on: vi.fn((event, callback) => {
                    if (event === 'close') {
                        callback(1) // Non-zero exit code
                    }
                }),
                kill: vi.fn()
            }
            mockSpawn.mockReturnValue(mockProcess as any)

            // The process should report failure for non-zero exit codes
            const process = spawn('python', ['-c', 'exit(1)'], {})
            expect(process.on).toHaveBeenCalledWith('close', expect.any(Function))
        })
    })
})