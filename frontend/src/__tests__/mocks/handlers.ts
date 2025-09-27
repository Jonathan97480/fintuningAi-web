import { http, HttpResponse } from 'msw'

export const handlers = [
    // Health endpoint
    http.get('http://localhost:4000/health', () => {
        return HttpResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
        })
    }),

    // Models endpoint
    http.get('http://localhost:4000/hf/models', () => {
        return HttpResponse.json({
            results: [
                {
                    id: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                    name: 'Qwen2.5-Coder-3B-Instruct',
                    task: 'text-generation',
                    license: 'apache-2.0',
                    quantization: ['fp16', 'q4f16'],
                },
                {
                    id: 'microsoft/DialoGPT-medium',
                    name: 'DialoGPT-medium',
                    task: 'conversational',
                    license: 'mit',
                    quantization: ['fp16'],
                },
            ],
        })
    }),

    // Projects endpoints
    http.get('http://localhost:4000/projects', () => {
        return HttpResponse.json([
            {
                id: 'project-1',
                ownerId: 'user-1',
                name: 'Test Project',
                description: 'A test project',
                createdAt: new Date().toISOString(),
            },
        ])
    }),

    http.post('http://localhost:4000/projects', async ({ request }) => {
        const body = await request.json() as { name: string; description?: string }
        return HttpResponse.json({
            id: 'new-project-id',
            ownerId: 'user-1',
            name: body.name,
            description: body.description,
            createdAt: new Date().toISOString(),
        })
    }),

    // Jobs endpoints
    http.get('http://localhost:4000/jobs', () => {
        return HttpResponse.json([
            {
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ])
    }),

    http.get('http://localhost:4000/jobs/:jobId', ({ params }) => {
        const { jobId } = params
        if (jobId === 'non-existent-job') {
            return new HttpResponse(null, { status: 404 })
        }
        return HttpResponse.json({
            id: jobId,
            projectId: 'project-1',
            userId: 'user-1',
            type: 'fine_tune',
            status: 'completed',
            payload: {
                baseModelId: 'Qwen/Qwen2.5-Coder-3B-Instruct',
                datasetId: 'dataset-1',
            },
            progress: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
    }),

    http.post('http://localhost:4000/jobs/fine-tune', async ({ request }) => {
        const body = await request.json() as any
        return HttpResponse.json({
            jobId: 'new-job-id',
        })
    }),

    // Job events endpoint
    http.get('http://localhost:4000/jobs/:jobId/events', ({ params }) => {
        const { jobId } = params
        return HttpResponse.json([
            {
                id: 1,
                jobId,
                level: 'info',
                message: 'Job started',
                data: {},
                createdAt: new Date().toISOString(),
            },
            {
                id: 2,
                jobId,
                level: 'info',
                message: 'Training completed',
                data: { accuracy: 0.95 },
                createdAt: new Date().toISOString(),
            },
        ])
    }),
]