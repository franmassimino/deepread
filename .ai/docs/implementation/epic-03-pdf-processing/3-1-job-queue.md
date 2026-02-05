# Story 3.1: Job Queue System

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to implement a job queue system for PDF processing,
So that uploads can be processed in the background without blocking the UI.

## Acceptance Criteria

1. **Given** BullMQ is configured
   **When** I create the job queue infrastructure
   **Then** a ProcessingJob model exists in the database schema

2. **And** ProcessingJob includes: id, bookId, type, status, progress, error, createdAt, completedAt

3. **And** job types include: UPLOAD, EXTRACT, AI, CONVERT

4. **And** job statuses include: PENDING, ACTIVE, COMPLETED, FAILED

5. **And** I can create a job record when a book is uploaded

6. **And** jobs are added to the BullMQ queue

7. **And** I can query job status by jobId

8. **And** the database migration runs successfully

## Tasks / Subtasks

- [ ] Task 1: Extend Prisma Schema with ProcessingJob Model (AC: #1, #2, #3, #4)
  - [ ] 1.1 Define JobType enum: UPLOAD, EXTRACT, AI, CONVERT
  - [ ] 1.2 Define JobStatus enum: PENDING, ACTIVE, COMPLETED, FAILED
  - [ ] 1.3 Create ProcessingJob model with fields:
    - id: String @id @default(uuid())
    - bookId: String (foreign key to Book)
    - type: JobType
    - status: JobStatus @default(PENDING)
    - progress: Int @default(0) (0-100)
    - error: String? (optional error message)
    - createdAt: DateTime @default(now())
    - completedAt: DateTime? (optional)
  - [ ] 1.4 Add relation from Book to ProcessingJob (one-to-many)
  - [ ] 1.5 Add cascade delete (deleting Book deletes its ProcessingJobs)
  - [ ] 1.6 Add index on bookId for efficient queries

- [ ] Task 2: Create JobService for Queue Operations (AC: #5, #6, #7)
  - [ ] 2.1 Create lib/services/job-service.ts
  - [ ] 2.2 Initialize BullMQ queue connection (reuse existing Redis setup from Story 1.3)
  - [ ] 2.3 Implement createJob(bookId, type, data) method:
    - Creates ProcessingJob record in DB
    - Adds job to BullMQ queue
    - Returns job ID
  - [ ] 2.4 Implement getJobStatus(jobId) method:
    - Queries ProcessingJob from database
    - Returns full job details
  - [ ] 2.5 Implement updateJobProgress(jobId, progress) method
  - [ ] 2.6 Implement completeJob(jobId, result?) method
  - [ ] 2.7 Implement failJob(jobId, error) method
  - [ ] 2.8 Implement getJobsByBook(bookId) method for retrieving all jobs for a book

- [ ] Task 3: Create Worker Infrastructure (AC: #6)
  - [ ] 3.1 Create lib/workers/pdf-processing-worker.ts
  - [ ] 3.2 Set up BullMQ worker with concurrency limit (configurable, default 3)
  - [ ] 3.3 Implement job processor that:
    - Updates job status to ACTIVE when processing starts
    - Calls appropriate handler based on job type
    - Updates progress during processing
    - Marks job as COMPLETED or FAILED on finish
  - [ ] 3.4 Add error handling with retry logic (exponential backoff, max 3 retries)
  - [ ] 3.5 Ensure worker runs server-side only (not in browser)

- [ ] Task 4: Integrate with Upload Flow (AC: #5)
  - [ ] 4.1 Modify /api/upload endpoint to create UPLOAD job after saving PDF
  - [ ] 4.2 Update upload-store to track jobId instead of simulating processing
  - [ ] 4.3 Replace simulateProcessing() with real job status polling
  - [ ] 4.4 Update BookUploadItem to show real processing progress from job queue

- [ ] Task 5: Create Job Status API Endpoint (AC: #7)
  - [ ] 5.1 Create GET /api/jobs/[id] endpoint
  - [ ] 5.2 Return job details: status, progress, error, timestamps
  - [ ] 5.3 Handle 404 for non-existent jobs
  - [ ] 5.4 Add proper TypeScript types for API response

- [ ] Task 6: Run Database Migration (AC: #8)
  - [ ] 6.1 Generate Prisma migration: npx prisma migrate dev --name add_processing_job
  - [ ] 6.2 Verify migration applies cleanly
  - [ ] 6.3 Update Prisma client types
  - [ ] 6.4 Test database operations with new model

- [ ] Task 7: Unit Tests
  - [ ] 7.1 Test: ProcessingJob model creation
  - [ ] 7.2 Test: JobService.createJob adds job to queue
  - [ ] 7.3 Test: JobService.getJobStatus returns correct data
  - [ ] 7.4 Test: Worker updates status through lifecycle
  - [ ] 7.5 Test: Failed jobs are retried up to 3 times
  - [ ] 7.6 Test: Cascading delete removes jobs when book is deleted
  - [ ] 7.7 Test: Progress updates are persisted correctly

## Dev Notes

### Existing Code Analysis

**Prisma Schema** ([prisma/schema.prisma](prisma/schema.prisma))
- ✅ Already has Book, Chapter, ReadingProgress models
- ✅ Already has BookStatus enum (PROCESSING, READY, ERROR)
- ❌ **Missing:** ProcessingJob model (to be added in this story)
- ❌ **Missing:** JobType and JobStatus enums (to be added)

Current schema for reference:
```prisma
model Book {
  id                  String             @id @default(uuid())
  // ... other fields
  chapters            Chapter[]
  readingProgress     ReadingProgress[]
  // TODO: Add processingJobs relation
}
```

**BullMQ Setup** (from Story 1.3 - should be done)
- Redis should already be configured
- BullMQ should already be installed (`bullmq`, `ioredis`)
- Need to verify: queue initialization code exists

**Upload Store** ([lib/stores/upload-store.tsx](lib/stores/upload-store.tsx))
- ✅ Has upload progress tracking
- ✅ Has status management (uploading, processing, ready, error)
- ❌ Currently uses `simulateProcessing()` (lines 271-331)
- ❌ Needs to be replaced with real job queue integration

### Implementation Strategy

**1. Database Schema Extension**

Add to prisma/schema.prisma:
```prisma
enum JobType {
  UPLOAD
  EXTRACT
  AI
  CONVERT
}

enum JobStatus {
  PENDING
  ACTIVE
  COMPLETED
  FAILED
}

model ProcessingJob {
  id          String     @id @default(uuid())
  bookId      String
  type        JobType
  status      JobStatus  @default(PENDING)
  progress    Int        @default(0)
  error       String?
  createdAt   DateTime   @default(now())
  completedAt DateTime?

  book        Book       @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId])
}
```

Update Book model:
```prisma
model Book {
  // ... existing fields
  chapters        Chapter[]
  readingProgress ReadingProgress[]
  processingJobs  ProcessingJob[]  // Add this relation
}
```

**2. JobService Architecture**

```typescript
// lib/services/job-service.ts
import { Queue } from 'bullmq';
import { prisma } from '@/lib/prisma';

const pdfQueue = new Queue('pdf-processing', {
  connection: redisConnection, // from existing config
});

export class JobService {
  static async createJob(bookId: string, type: JobType, data?: any) {
    // 1. Create DB record
    const job = await prisma.processingJob.create({
      data: { bookId, type, status: JobStatus.PENDING }
    });
    
    // 2. Add to BullMQ
    await pdfQueue.add(type, { jobId: job.id, bookId, ...data });
    
    return job;
  }
  
  // ... other methods
}
```

**3. Worker Setup**

```typescript
// lib/workers/pdf-processing-worker.ts
import { Worker } from 'bullmq';

export const pdfWorker = new Worker('pdf-processing', async (job) => {
  const { jobId, bookId, type } = job.data;
  
  // Update status to ACTIVE
  await JobService.updateJobStatus(jobId, JobStatus.ACTIVE);
  
  try {
    switch (type) {
      case 'UPLOAD':
        // Handle upload completion
        break;
      case 'EXTRACT':
        // PDF text extraction (Story 3.2)
        break;
      // ... other types
    }
    
    await JobService.completeJob(jobId);
  } catch (error) {
    await JobService.failJob(jobId, error.message);
    throw error; // Trigger BullMQ retry
  }
}, {
  connection: redisConnection,
  concurrency: 3,
});
```

**4. Integration with Upload Flow**

Replace simulateProcessing in upload-store.tsx:
```typescript
// Instead of simulateProcessing:
// 1. Call JobService.createJob(bookId, 'UPLOAD')
// 2. Poll job status via GET /api/jobs/[id]
// 3. Update progress from job.progress
// 4. When COMPLETED, mark book as ready
```

### Technical Notes

- **Queue Name:** `pdf-processing` (single queue for all PDF-related jobs)
- **Job Types:** UPLOAD (file saved), EXTRACT (text extraction), AI (Mastra metadata), CONVERT (HTML generation)
- **Concurrency:** 3 jobs max (as per NFR5.2)
- **Retries:** 3 attempts with exponential backoff for transient failures
- **Worker Lifecycle:** 
  - PENDING → ACTIVE (when worker picks up job)
  - ACTIVE → COMPLETED (on success)
  - ACTIVE → FAILED (on error, after retries exhausted)
- **Progress Tracking:** 0-100 integer, updated by worker during processing

### Architecture Compliance

- **Database:** PostgreSQL via Prisma (existing)
- **Queue:** BullMQ + Redis (Story 1.3 already configured)
- **TypeScript:** Strict mode throughout
- **File Structure:** 
  - Services in `lib/services/`
  - Workers in `lib/workers/`
  - API routes in `app/api/` (App Router)
- **State Management:** Zustand for UI state, Prisma for persistence, BullMQ for queue
- **Error Handling:** BullMQ handles retries, JobService tracks error messages

### Dependencies

**Required (should already be installed from Story 1.3):**
- `bullmq`
- `ioredis`
- `@prisma/client`

**Prisma Commands:**
```bash
npx prisma migrate dev --name add_processing_job
npx prisma generate
```

## Dev Agent Record

### Agent Model Used

[To be filled by Dev Agent]

### Debug Log References

[To be filled by Dev Agent]

### Completion Notes List

[To be filled by Dev Agent]

### File List

**Expected Modified Files:**
- prisma/schema.prisma (add ProcessingJob model, enums, relation)
- lib/stores/upload-store.tsx (replace simulateProcessing with real job tracking)
- app/api/upload/route.ts (create job after upload)
- app/api/books/route.ts (if job creation needed)

**Expected Created Files:**
- lib/services/job-service.ts (JobService class)
- lib/workers/pdf-processing-worker.ts (BullMQ worker)
- app/api/jobs/[id]/route.ts (job status endpoint)
- tests/unit/job-service.test.ts
- tests/unit/pdf-worker.test.ts

**Expected Deleted Files:**
- None (simulateProcessing will be deprecated but kept temporarily for reference)

## Change Log

- 2026-02-03: Story created - job queue system infrastructure for PDF processing pipeline
