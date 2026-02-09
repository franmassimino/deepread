# Story 3.6: Real-Time Progress Updates (SSE)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see real-time progress updates while my PDF is processing,
So that I know the system is working and can estimate completion time.

## Acceptance Criteria

1. **Given** a PDF is being processed
   **When** I view the library or upload page
   **Then** I see a progress bar showing overall processing status

2. **And** progress updates automatically without page refresh

3. **And** progress shows specific stages: "Extracting text...", "Analyzing content...", "Converting..."

4. **And** progress percentage updates from 0% to 100%

5. **And** when processing completes, status changes to "Ready"

6. **And** if processing fails, I see an error message with details

7. **And** progress updates continue even if I navigate to other pages

8. **And** updates are delivered via Server-Sent Events (SSE)

## Tasks / Subtasks

- [x] Task 1: Create SSE Progress API Endpoint (AC: #1, #2, #8)
  - [x] 1.1 Create `GET /api/jobs/[jobId]/progress` SSE endpoint
  - [x] 1.2 Set proper SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - [x] 1.3 Poll database and BullMQ for progress updates every 500ms
  - [x] 1.4 Stream progress updates in SSE format: `data: { "progress": 50, "stage": "extracting" }\n\n`
  - [x] 1.5 Handle client disconnect gracefully (close subscription)
  - [x] 1.6 Send keep-alive comments every 30 seconds

- [x] Task 2: Create SSE Hook for Frontend (AC: #2, #4, #7)
  - [x] 2.1 Create `useJobProgress(jobId)` hook in `src/lib/hooks/use-job-progress.ts`
  - [x] 2.2 Connect to SSE endpoint using `EventSource` API
  - [x] 2.3 Parse incoming SSE messages and update local state
  - [x] 2.4 Handle connection errors with automatic reconnection (exponential backoff, max 5 attempts)
  - [x] 2.5 Clean up EventSource on unmount or jobId change
  - [x] 2.6 Export hook with return type including overallProgress
  - [x] 2.7 Create `useMultipleJobProgress(jobIds)` for tracking multiple jobs

- [x] Task 3: Integrate SSE with Upload Store (AC: #3, #4, #5, #6)
  - [x] 3.1 Modify `upload-store.tsx` to use SSE via EventSource
  - [x] 3.2 Replace polling-based progress tracking with SSE
  - [x] 3.3 Map job stages to user-friendly messages:
    - `PENDING` → "Waiting to start..."
    - `EXTRACT` with progress 0-33 → "Extracting text..."
    - `EXTRACT` with progress 34-66 → "Extracting tables and images..."
    - `EXTRACT` with progress 67-100 → "Finalizing extraction..."
    - `AI_METADATA` → "Analyzing content..."
    - `CONVERT` → "Converting to HTML..."
    - `COMPLETED` → "Ready!"
    - `FAILED` → "Error: {error message}"
  - [x] 3.4 Update progress bar with real-time percentage from SSE
  - [x] 3.5 Handle job completion: update book status and add to library
  - [x] 3.6 Handle job failure: show error message with retry option

- [x] Task 4: Update ProcessingJob Model for Progress Tracking (AC: #3, #4)
  - [x] 4.1 Add `stage` field to ProcessingJob model (current processing stage)
  - [x] 4.2 Add `message` field for human-readable status message
  - [x] 4.3 Update job processors to set stage and message during processing
  - [x] 4.4 Run migration via `prisma db push`

- [x] Task 5: Enhance Job Processors to Emit Progress Events (AC: #3, #4)
  - [x] 5.1 Update `extractProcessor` to update stage and message fields
  - [x] 5.2 Update `aiMetadataProcessor` to emit progress updates
  - [x] 5.3 Update `convertProcessor` to emit progress updates
  - [x] 5.4 Ensure progress flows through to SSE endpoint via database polling

- [x] Task 6: Handle Navigation Persistence (AC: #7)
  - [x] 6.1 Create global progress store using Zustand for cross-page state (`job-progress-store.ts`)
  - [x] 6.2 Store active job subscriptions in global store
  - [x] 6.3 Reconnect to SSE automatically when returning to app (via EventSource auto-reconnect)
  - [~] 6.4 Show mini progress indicator in header/navigation if jobs are active (deferred to future, will be implemented in Epic 5)

- [x] Task 7: Unit Tests
  - [x] 7.1 Test: SSE endpoint returns correct headers and format (`tests/unit/api/jobs/progress.test.ts`)
  - [x] 7.2 Test: Job stages utility functions (`tests/unit/utils/job-stages.test.ts`)
  - [x] 7.3 Test: Progress updates correctly map to stage messages (14 tests passing)
  - [~] 7.4-7.6: Additional hook tests (deferred due to EventSource mocking complexity)

## Dev Notes

### Architecture Context

**Epic 3 Goal:** Background PDF processing with real-time progress updates [Source: epics.md#Epic 3]

**Previous Story (3.5) Learnings:**
- BullMQ job chain is working with EXTRACT → AI_METADATA → CONVERT
- ProcessingJob model tracks job status and progress
- Workers are initialized via `initializeWorkers()` in queue.ts
- Jobs already support progress updates via `job.updateProgress()`

**Current Architecture:**
```
Upload Flow:
1. Client uploads PDF → POST /api/upload
2. Server saves PDF, creates Book + ProcessingJob records
3. Server queues EXTRACT job to BullMQ
4. Client polls GET /api/books/[bookId]/status (current implementation)
5. Workers process jobs and update progress
6. When COMPLETED, book appears in library
```

**New SSE Architecture:**
```
Upload Flow with SSE:
1-3. Same as above
4. Client connects to SSE: GET /api/jobs/[jobId]/progress
5. Server streams progress updates in real-time
6. UI updates instantly as progress changes
7. When COMPLETED/FAILED, close connection and update UI
```

### Existing Code Analysis

**Current Polling Implementation** ([src/app/api/books/[id]/status/route.ts](src/app/api/books/[id]/status/route.ts)):
```typescript
// Currently returns static status
return NextResponse.json({
  status: book.status,
  progress: calculateProgress(book.status), // Static: 0, 50, 100
});
```

**BullMQ Queue** ([src/lib/services/queue.ts](src/lib/services/queue.ts)):
```typescript
// Already supports progress updates
export async function getJobStatus(jobId: string) {
  return {
    progress: job.progress, // Real-time progress from BullMQ
    status: await job.getState(),
  };
}
```

**ProcessingJob Model** ([prisma/schema.prisma](prisma/schema.prisma)):
```prisma
model ProcessingJob {
  id            String     @id @default(uuid())
  bookId        String
  type          JobType    // EXTRACT, AI_METADATA, CONVERT
  status        JobStatus  @default(PENDING)
  progress      Int        @default(0)
  error         String?
  // TODO: Add 'stage' and 'message' fields
}
```

**Upload Store** ([src/lib/stores/upload-store.tsx](src/lib/stores/upload-store.tsx)):
```typescript
// Currently uses polling in simulateProcessing()
const pollStatus = async () => {
  const res = await fetch(`/api/books/${bookId}/status`);
  // Polls every 2 seconds
};
```

### Technical Requirements

**1. SSE Endpoint Implementation**

```typescript
// src/app/api/jobs/[jobId]/progress/route.ts
import { NextRequest } from 'next/server';
import { pdfQueue } from '@/lib/services/queue';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  
  // Set SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to BullMQ job events
      const unsubscribe = pdfQueue.on('progress', (job, progress) => {
        if (job.id === jobId) {
          controller.enqueue(
            `data: ${JSON.stringify({ progress, stage: job.data.stage })}\n\n`
          );
        }
      });
      
      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });
  
  return new Response(stream, { headers });
}
```

**2. useJobProgress Hook**

```typescript
// src/lib/hooks/use-job-progress.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface JobProgress {
  progress: number;
  stage: string;
  status: string;
  error?: string;
}

export function useJobProgress(jobId: string | null): JobProgress {
  const [progress, setProgress] = useState<JobProgress>({
    progress: 0,
    stage: 'pending',
    status: 'PENDING'
  });
  
  useEffect(() => {
    if (!jobId) return;
    
    const eventSource = new EventSource(`/api/jobs/${jobId}/progress`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    };
    
    eventSource.onerror = () => {
      // Auto-reconnect with exponential backoff
      eventSource.close();
    };
    
    return () => eventSource.close();
  }, [jobId]);
  
  return progress;
}
```

**3. Stage Mapping**

```typescript
// src/lib/utils/job-stages.ts
export function getStageMessage(type: JobType, progress: number, status: JobStatus): string {
  if (status === 'FAILED') return 'Processing failed';
  if (status === 'COMPLETED') return 'Ready!';
  
  switch (type) {
    case 'EXTRACT':
      if (progress < 33) return 'Extracting text...';
      if (progress < 67) return 'Extracting tables and images...';
      return 'Finalizing extraction...';
    case 'AI_METADATA':
      return 'Analyzing content...';
    case 'CONVERT':
      return 'Converting to HTML...';
    default:
      return 'Processing...';
  }
}
```

### Dependencies

**Already installed:**
- `bullmq` - Job queue with built-in progress events
- Next.js App Router - Supports streaming responses

**No new dependencies required** - SSE is native to browsers and Node.js

### File Structure

```
src/
├── app/api/jobs/[jobId]/
│   └── progress/
│       └── route.ts          # SSE endpoint (NEW)
├── lib/
│   ├── hooks/
│   │   └── use-job-progress.ts  # React hook for SSE (NEW)
│   ├── utils/
│   │   └── job-stages.ts     # Stage message mapping (NEW)
│   └── stores/
│       └── job-progress-store.ts  # Global progress state (NEW)
└── ...
```

### Testing Strategy

**SSE Endpoint Tests:**
- Verify SSE headers are correct
- Test event stream format
- Test client disconnect handling
- Test with mock BullMQ events

**Hook Tests:**
- Test EventSource connection
- Test message parsing
- Test reconnection logic
- Test cleanup on unmount

**Integration Tests:**
- End-to-end test with real job processing
- Test multiple concurrent connections
- Test navigation persistence

### Known Limitations (MVP Scope)

- SSE connections may drop on mobile/sleep - reconnection handles this
- Maximum concurrent SSE connections limited by browser (typically 6 per domain)
- For MVP, single job progress per page view is acceptable
- No server-side event persistence (if client disconnects, missed events are lost)

### References

- [Source: .ai/docs/planning/epics.md#Story 3.6] - Original story requirements
- [Source: .ai/docs/implementation/epic-03-pdf-processing/3-5-job-chain-orchestration.md] - Previous story (job chain setup)
- [Source: src/lib/services/queue.ts] - BullMQ queue configuration
- [Source: src/app/api/books/[id]/status/route.ts] - Current polling endpoint
- BullMQ progress events: https://docs.bullmq.io/guide/events
- MDN SSE: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## Dev Agent Record

### Agent Model Used

Kimi Code CLI - dev-story workflow execution

### Debug Log References

- Sprint status: .ai/docs/implementation/sprint-status.yaml
- Previous story: .ai/docs/implementation/epic-03-pdf-processing/3-5-job-chain-orchestration.md

### Completion Notes List

- Added `stage` and `message` fields to ProcessingJob model in Prisma schema
- Applied database changes using `prisma db push` (PostgreSQL)
- Created SSE endpoint at `GET /api/jobs/[jobId]/progress` with proper headers and streaming
- Implemented polling-based SSE (500ms interval) for reliable progress delivery
- Created `useJobProgress()` hook with automatic reconnection (exponential backoff, max 5 retries)
- Created `useMultipleJobProgress()` hook for tracking multiple concurrent jobs
- Created `job-stages.ts` utility for mapping job types/progress to human-readable messages
- Created `job-progress-store.ts` Zustand store for global job progress state across navigation
- Updated `upload-store.tsx` to use SSE instead of polling for real-time progress updates
- Updated `extract-job.ts` processor to set stage/message at each processing phase
- Updated `ai-metadata-job.ts` processor with progress tracking fields
- Updated `convert-job.ts` processor with progress tracking fields
- Updated `job-utils.ts` `updateProcessingJob()` to accept stage and message parameters
- Created comprehensive unit tests for SSE endpoint (5 tests passing)
- Created unit tests for job stages utility (14 tests passing)
- Fixed existing upload-store tests to work with EventSource mocking

### File List

**Modified Files:**
- prisma/schema.prisma - Added `stage` and `message` fields to ProcessingJob model
- src/lib/stores/upload-store.tsx - Replaced polling with SSE for progress tracking, removed duplicate comments
- src/lib/jobs/job-utils.ts - Updated `updateProcessingJob()` with stage/message params
- src/lib/jobs/extract-job.ts - Added stage/message updates at each phase
- src/lib/jobs/ai-metadata-job.ts - Added stage/message updates at each phase
- src/lib/jobs/convert-job.ts - Added stage/message updates at each phase
- tests/unit/upload-store.test.ts - Added EventSource mock for tests, fixed test expectations

**Created Files:**
- src/app/api/jobs/[jobId]/progress/route.ts - SSE endpoint for real-time progress
- src/lib/hooks/use-job-progress.ts - React hooks for SSE connection (useJobProgress, useMultipleJobProgress)
- src/lib/utils/job-stages.ts - Stage message mapping utilities
- src/lib/stores/job-progress-store.ts - Global Zustand store for job progress
- tests/unit/api/jobs/progress.test.ts - SSE endpoint tests (5 tests)
- tests/unit/utils/job-stages.test.ts - Job stages utility tests (14 tests)

**Database Changes:**
- Added `stage` String? column to ProcessingJob table
- Added `message` String? column to ProcessingJob table

**Test Results:**
- tests/unit/utils/job-stages.test.ts: 14/14 tests passing
- tests/unit/api/jobs/progress.test.ts: 5/5 tests passing
- tests/unit/upload-store.test.ts: 21/21 tests passing (fixed test expectations during code review)
- Total: 40/40 tests passing

**Code Review Fixes Applied (2026-02-09):**
- Fixed test expectations in upload-store.test.ts (progress calculation and status values)
- Fixed flaky test in retryUpload with fake timers
- Removed duplicate comments in upload-store.tsx
- Updated Task 6.4 description for clarity

## Change Log

- 2026-02-09: Story created - Real-time progress updates using Server-Sent Events
  - Analyzed previous story 3.5 implementation (BullMQ job chain)
  - Documented current polling-based status endpoint
  - Defined SSE architecture and integration points
  - Specified stage-to-message mapping requirements

- 2026-02-09: Story implementation completed
  - Added `stage` and `message` fields to ProcessingJob model
  - Created SSE endpoint at `/api/jobs/[jobId]/progress`
  - Created `useJobProgress()` hook with auto-reconnection
  - Created `job-stages.ts` utility for message mapping
  - Created `job-progress-store.ts` for global state
  - Updated upload-store to use SSE instead of polling
  - Updated all job processors (extract, ai-metadata, convert) with progress tracking
  - Created 19 new unit tests (all passing)
  - Fixed existing test mocks for EventSource compatibility
