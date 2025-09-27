# Phase 4 - Python Integration

## Status: In Progress 🔄

## Overview
Phase 4 bridges the Node.js backend with Python fine-tuning processes through job queue orchestration. This phase implements the core job management system that will allow users to launch, monitor, and manage AI model fine-tuning tasks through the web interface.

## Objectives
- Refactor existing Python scripts into reusable CLI modules
- Implement BullMQ job queue system for task orchestration
- Create Python worker processes with proper error handling and logging
- Integrate Hugging Face operations with token management and caching
- Build real-time job monitoring and progress streaming

## Deliverables

### ✅ Completed
- [ ] Python script refactoring into CLI modules
- [ ] BullMQ queue implementation
- [ ] Job runner service with Python process spawning
- [ ] Streaming stdout/stderr capture
- [ ] Hugging Face integration with token injection
- [ ] Job status tracking and metrics collection

### 🔄 In Progress
- [ ] Job queue management system
- [ ] Python worker implementation
- [ ] Real-time progress streaming
- [ ] Error handling and recovery mechanisms

### 📋 Planned
- [ ] Job cancellation support
- [ ] Resource usage monitoring
- [ ] Advanced retry strategies
- [ ] Multi-worker scaling

## Technical Implementation

### Job Queue Architecture
- **BullMQ Integration**: Redis-based job queue for reliable task processing
- **Queue Types**:
  - `fine-tune-queue`: Model fine-tuning jobs
  - `dataset-queue`: Dataset processing tasks
  - `hf-sync-queue`: Hugging Face synchronization
- **Job States**: waiting → active → completed/failed
- **Persistence**: Job metadata stored in SQLite, queue state in Redis

### Python Worker System
- **Process Management**: Child process spawning with proper cleanup
- **CLI Interface**: Standardized command-line interface for all Python operations
- **Output Streaming**: Real-time log capture and forwarding to frontend
- **Error Handling**: Structured error reporting with exit codes

### Hugging Face Integration
- **Token Management**: Secure injection of user HF tokens
- **Caching Strategy**: Local model/dataset caching to reduce API calls
- **Retry Logic**: Exponential backoff for API rate limits
- **Progress Tracking**: Download/upload progress reporting

## API Endpoints

### Job Management
```
POST /jobs
```
Create a new fine-tuning job
- **Request Body**: Job configuration (model, dataset, parameters)
- **Response**: Job ID and initial status
- **Queue**: Adds job to fine-tune-queue

```
GET /jobs
```
List all jobs with filtering and pagination
- **Query Params**: status, project_id, limit, offset
- **Response**: Array of job summaries

```
GET /jobs/:id
```
Get detailed job information
- **Response**: Complete job metadata, current status, logs

```
DELETE /jobs/:id
```
Cancel a running job
- **Action**: Sends cancellation signal to worker process

### Real-time Updates
```
GET /jobs/:id/stream
```
Server-sent events for live job progress
- **Events**: progress, log, status, completion
- **Format**: JSON event stream

## Python CLI Modules

### Fine-tuning Module
```bash
python -m fintuning_workers.jobs.fine_tune \
  --job-id <uuid> \
  --model <hf-model-id> \
  --dataset <hf-dataset-id> \
  --output-dir <path> \
  --hf-token <token>
```

### Dataset Processing Module
```bash
python -m fintuning_workers.jobs.dataset \
  --job-id <uuid> \
  --dataset <hf-dataset-id> \
  --output-path <path> \
  --hf-token <token>
```

## Error Handling

### Job Failures
- **Timeout Handling**: Jobs killed after configurable timeout
- **Resource Limits**: Memory/CPU monitoring with automatic termination
- **Network Issues**: Retry logic for transient HF API failures
- **Validation Errors**: Input validation before job execution

### Recovery Mechanisms
- **Job Restart**: Failed jobs can be manually restarted
- **Partial Results**: Preserve intermediate outputs on failure
- **Cleanup**: Automatic cleanup of temporary files and processes

## Monitoring and Observability

### Metrics Collection
- **Job Duration**: Start/end timestamps with duration calculation
- **Resource Usage**: Peak memory, CPU usage tracking
- **Success Rates**: Job completion statistics
- **Error Patterns**: Common failure modes and frequencies

### Logging Strategy
- **Structured Logs**: JSON-formatted logs with job context
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Aggregation**: Centralized log storage for analysis
- **Real-time Streaming**: Live log delivery to frontend

## Configuration

### Environment Variables
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Job Timeouts
JOB_TIMEOUT_MINUTES=120
JOB_MAX_MEMORY_MB=8192

# Python Environment
PYTHON_EXECUTABLE=python
WORKER_CONCURRENCY=2

# Hugging Face
HF_CACHE_DIR=./cache/huggingface
HF_HOME=./cache/huggingface
```

### Queue Configuration
```typescript
// BullMQ queue settings
const queueOptions = {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};
```

## Testing Strategy

### Unit Tests
- **Queue Operations**: Job creation, status updates, queue management
- **Worker Processes**: Process spawning, output capture, error handling
- **HF Integration**: Token injection, caching, retry logic

### Integration Tests
- **End-to-End Jobs**: Complete job lifecycle from creation to completion
- **Failure Scenarios**: Network failures, timeouts, invalid inputs
- **Concurrent Jobs**: Multiple jobs running simultaneously

### Performance Tests
- **Load Testing**: High job throughput simulation
- **Resource Usage**: Memory and CPU usage under load
- **Scalability**: Multi-worker performance characteristics

## Dependencies

### Backend Dependencies
```json
{
  "bullmq": "^4.0.0",
  "ioredis": "^5.3.0",
  "uuid": "^9.0.0"
}
```

### Python Dependencies
```txt
torch>=2.0.0
transformers>=4.30.0
datasets>=2.10.0
accelerate>=0.20.0
huggingface-hub>=0.15.0
```

## Next Steps (Phase 5)
- Frontend job monitoring interface
- Real-time progress visualization
- Advanced job configuration options
- Model comparison and evaluation tools