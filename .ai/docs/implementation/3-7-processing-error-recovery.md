# Story 3.7: Processing Error Recovery

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to retry processing if a PDF fails,
So that temporary issues don't permanently block my book from being added.

## Acceptance Criteria

1. **Given** a PDF processing job has failed
   **When** I view the failed book in the library
   **Then** I see an error indicator with the failure reason

2. **And** a "Retry Processing" button is available on the book card

3. **And** clicking retry restarts the job chain from the failed step

4. **And** the book status changes back to PROCESSING

5. **And** progress tracking resumes normally

6. **And** if the retry succeeds, the book becomes READY

7. **And** if the retry fails again, I can retry up to 3 times total

8. **And** after 3 failures, I see a message indicating max retries exceeded

9. **And** I can delete the book and re-upload if needed

## Tasks / Subtasks

- [ ] Task 1: Add Error Tracking to Database Schema (AC: #1)
  - [ ] 1.1 Verify Book model has `errorMessage` field (should exist from Story 3.2)
  - [ ] 1.2 Verify ProcessingJob model has `retryCount` field (should exist from Story 3.5)
  - [ ] 1.3 Add migration if fields are missing
  - [ ] 1.4 Add field `lastFailedJobType: JobType?` to Book model to track which step failed
  - [ ] 1.5 Generate Prisma migration: `npx prisma migrate dev --name add_last_failed_job_type`

- [ ] Task 2: Enhance Library UI to Display Error State (AC: #1, #2)
  - [ ] 2.1 Modify `BookCard` in `src/components/screens/library.tsx`
  - [ ] 2.2 When `book.status === 'ERROR'`, display error indicator:
    - Red error badge (already exists in statusConfig)
    - Show error message below the book title
    - Display which job failed (EXTRACT, AI_METADATA, or CONVERT)
  - [ ] 2.3 Add "Retry Processing" button visible only when status is ERROR:
    - Use RefreshCw icon from lucide-react
    - Button text: "Retry Processing"
    - Style: Warning/action color (amber or blue)
    - Position: Below error message or in action button row
  - [ ] 2.4 Add tooltip/helper text showing retry count (e.g., "2 of 3 attempts")
  - [ ] 2.5 Disable retry button if retryCount >= 3
  - [ ] 2.6 Show message "Max retries reached. Please delete and re-upload" when retryCount >= 3

- [ ] Task 3: Implement Retry API Endpoint Enhancement (AC: #3, #4, #5)
  - [ ] 3.1 Review existing `/api/jobs/[jobId]/retry/route.ts` (created in Story 3.5)
  - [ ] 3.2 Enhance retry logic to restart from the failed step:
    - If EXTRACT failed: Restart EXTRACT job
    - If AI_METADATA failed: Restart AI_METADATA job (needs EXTRACT results)
    - If CONVERT failed: Restart CONVERT job (needs EXTRACT + AI_METADATA results)
  - [ ] 3.3 Update Book.lastFailedJobType when job fails (modify handleJobFailure in job-utils.ts)
  - [ ] 3.4 When retrying, fetch previous successful job results:
    - For AI_METADATA retry: Get completed EXTRACT job data
    - For CONVERT retry: Get completed EXTRACT + AI_METADATA job data
  - [ ] 3.5 Store intermediate job results in Redis or database to enable retry from failed step
  - [ ] 3.6 Add endpoint: POST `/api/books/[bookId]/retry` that:
    - Finds the failed ProcessingJob for the book
    - Calls the existing job retry logic
    - Returns success/error response

- [ ] Task 4: Create Retry Hook for Frontend (AC: #3, #4, #5, #6, #7)
  - [ ] 4.1 Create `src/lib/hooks/use-retry-processing.ts`
  - [ ] 4.2 Implement `retryProcessing(bookId: string)` function:
    - Calls POST `/api/books/[bookId]/retry`
    - Shows loading state during retry
    - Updates book status to PROCESSING on success
    - Shows error toast on failure
    - Refetches books list after retry initiated
  - [ ] 4.3 Return state: `{ retryProcessing, isRetrying, error }`
  - [ ] 4.4 Handle API errors gracefully with user-friendly messages

- [ ] Task 5: Integrate Retry Button with BookCard (AC: #2, #3, #4, #8)
  - [ ] 5.1 Import `useRetryProcessing` hook in library.tsx
  - [ ] 5.2 Add retry button click handler:
    - Call `retryProcessing(book.id)`
    - Show loading spinner while retrying
    - Update UI optimistically
  - [ ] 5.3 Show confirmation dialog before retry (optional but recommended)
  - [ ] 5.4 Display retry count and max retries (e.g., "Attempt 2 of 3")
  - [ ] 5.5 Disable button with tooltip when max retries reached

- [ ] Task 6: Store Job Results for Retry (AC: #3)
  - [ ] 6.1 Modify EXTRACT job processor (extract-job.ts):
    - Store extraction results in Redis with key: `job:result:${processingJobId}`
    - Set TTL: 24 hours (enough time for retries)
    - Store: { text, pageCount, tables, images }
  - [ ] 6.2 Modify AI_METADATA job processor (ai-metadata-job.ts):
    - Store AI results in Redis with key: `job:result:${processingJobId}`
    - Set TTL: 24 hours
    - Store: { summary, chapters, metadata }
  - [ ] 6.3 Update retry endpoint to fetch stored results:
    - Check Redis for previous job results
    - Pass results to retried job as job.data
  - [ ] 6.4 Add helper function in job-utils.ts:
    - `storeJobResult(jobId: string, result: unknown): Promise<void>`
    - `getJobResult<T>(jobId: string): Promise<T | null>`

- [ ] Task 7: Enhance BullMQ Retry Configuration (AC: #7)
  - [ ] 7.1 Review existing BullMQ retry config in `src/lib/services/queue.ts`
  - [ ] 7.2 Verify retry settings:
    - `attempts: 3` (automatic retries by BullMQ)
    - `backoff: { type: 'exponential', delay: 2000 }` (2s, 4s, 8s delays)
  - [ ] 7.3 Ensure retryCount in ProcessingJob tracks manual retries (not automatic BullMQ retries)
  - [ ] 7.4 Add job event listeners to track retry attempts:
    - Listen to `job.failed` event
    - Increment retryCount only for manual retries via API
  - [ ] 7.5 Document difference between:
    - Automatic retries (BullMQ): For transient failures (network, timeout)
    - Manual retries (User-initiated): After automatic retries exhausted

- [ ] Task 8: Update Job Failure Handling (AC: #1, #7)
  - [ ] 8.1 Modify `handleJobFailure` in `src/lib/jobs/job-utils.ts`:
    - Store which job type failed: `lastFailedJobType`
    - Include retry count in error context
    - Log detailed error for debugging
  - [ ] 8.2 When job fails after all automatic retries:
    - Update Book.status to ERROR
    - Update Book.errorMessage with user-friendly message
    - Update Book.lastFailedJobType
    - Keep ProcessingJob.status as FAILED
  - [ ] 8.3 Improve error messages for common failures:
    - EXTRACT failures: "Failed to extract text from PDF. File may be corrupted."
    - AI_METADATA failures: "AI processing failed. Please retry."
    - CONVERT failures: "Failed to convert content to readable format."

- [ ] Task 9: Add Retry Button to Processing Books (AC: #2, #8, #9)
  - [ ] 9.1 For books in ERROR state, show retry button in book card
  - [ ] 9.2 Display error details in expandable section (optional)
  - [ ] 9.3 Show retry count indicator (e.g., badge with "2/3")
  - [ ] 9.4 When max retries reached:
    - Show message: "Processing failed after 3 attempts"
    - Suggest: "Delete this book and try uploading again"
    - Provide delete button prominently
  - [ ] 9.5 Test retry flow end-to-end

- [ ] Task 10: Unit and Integration Tests (AC: #1-#9)
  - [ ] 10.1 Test: Book with ERROR status shows error indicator and retry button
  - [ ] 10.2 Test: Retry button calls API and updates book status
  - [ ] 10.3 Test: Retry count increments correctly
  - [ ] 10.4 Test: Retry button disabled when retryCount >= 3
  - [ ] 10.5 Test: Job results stored and retrieved from Redis
  - [ ] 10.6 Test: Retry restarts from correct failed step
  - [ ] 10.7 Test: Successful retry completes job chain
  - [ ] 10.8 Test: Failed retry after 3 attempts shows max retries message
  - [ ] 10.9 Test: Delete works for failed books
  - [ ] 10.10 Test: Error messages display correctly in UI

## Dev Notes

### Architecture Context

**Epic 3 Goal:** Background PDF processing with real-time progress updates and error recovery

**Current Job Chain (from Story 3.5):**
```
Upload → EXTRACT → AI_METADATA → CONVERT → READY
         (33%)     (66%)         (100%)
```

**Error Recovery Flow:**
```
Job Fails → ERROR status → User sees error in library
         → User clicks "Retry" → Job restarts from failed step
         → Success: READY | Failure: Increment retryCount
         → If retryCount >= 3: Show "Delete and re-upload" message
```

### Current Code Analysis

**Database Schema** (`prisma/schema.prisma`):
- ✅ Book model has `status: BookStatus` (PROCESSING, READY, ERROR)
- ✅ Book model has `errorMessage: String?` (added in Story 3.2)
- ✅ ProcessingJob model has `retryCount: Int @default(0)` (added in Story 3.5)
- ❌ **MISSING:** Book.lastFailedJobType to track which step failed

**Current Error Handling:**
```typescript
// From job-utils.ts (Story 3.5)
export async function handleJobFailure(
  jobId: string,
  bookId: string,
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Update job status
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: 'FAILED', error: errorMessage }
  });

  // Update book status to ERROR
  await prisma.book.update({
    where: { id: bookId },
    data: { status: 'ERROR', errorMessage }
  });
}
```

**Current Retry Endpoint** (`src/app/api/jobs/[jobId]/retry/route.ts`):
- ✅ Validates job is FAILED
- ✅ Checks retryCount < 3
- ✅ Re-queues job in BullMQ
- ✅ Increments retryCount
- ✅ Resets book status to PROCESSING
- ❌ **LIMITATION:** Doesn't fetch previous job results (restarts from scratch)
- ❌ **LIMITATION:** Requires jobId (not user-friendly - need bookId endpoint)

**BullMQ Configuration** (`src/lib/services/queue.ts`):
```typescript
defaultJobOptions: {
  attempts: 3,              // Automatic retries
  backoff: {
    type: 'exponential',
    delay: 2000,            // 2s, 4s, 8s
  },
}
```

**Library UI** (`src/components/screens/library.tsx`):
- ✅ BookCard component exists
- ✅ Shows status badge (ERROR badge already configured)
- ✅ Has delete functionality
- ❌ **MISSING:** Error message display
- ❌ **MISSING:** Retry button for ERROR state
- ❌ **MISSING:** Retry count indicator

### Implementation Strategy

**1. Enhance Database Schema**

Add to Book model in `prisma/schema.prisma`:
```prisma
model Book {
  // ... existing fields
  lastFailedJobType JobType?  // Track which job failed for targeted retry
}
```

**2. Store Job Results in Redis**

Create helper in `job-utils.ts`:
```typescript
import { redis } from '@/lib/services/redis';

export async function storeJobResult(
  jobId: string,
  result: unknown
): Promise<void> {
  const key = `job:result:${jobId}`;
  await redis.set(key, JSON.stringify(result), 'EX', 86400); // 24h TTL
}

export async function getJobResult<T>(jobId: string): Promise<T | null> {
  const key = `job:result:${jobId}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}
```

**3. Update Job Processors to Store Results**

```typescript
// In extract-job.ts
export async function extractProcessor(job: Job<ExtractJobData>) {
  // ... existing extraction logic

  const result = { text, pageCount, tables, images };

  // Store result for potential retry
  await storeJobResult(processingJobId, result);

  // Queue next job
  await createNextJob(bookId, 'AI_METADATA', result);
}
```

**4. Enhance Retry Endpoint**

Create book-based retry: `POST /api/books/[bookId]/retry`
```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  // Find latest failed job for this book
  const failedJob = await prisma.processingJob.findFirst({
    where: { bookId, status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
  });

  if (!failedJob) {
    return NextResponse.json({ error: 'No failed job found' }, { status: 404 });
  }

  // Check retry limit
  if (failedJob.retryCount >= 3) {
    return NextResponse.json(
      { error: 'Maximum retry attempts (3) exceeded' },
      { status: 400 }
    );
  }

  // Get previous job results if needed
  let jobData: Record<string, unknown> = {
    bookId,
    processingJobId: failedJob.id,
  };

  if (failedJob.type === 'AI_METADATA') {
    // Need EXTRACT results
    const extractJob = await prisma.processingJob.findFirst({
      where: { bookId, type: 'EXTRACT', status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    if (extractJob) {
      const extractResult = await getJobResult(extractJob.id);
      jobData.extractionResult = extractResult;
    }
  } else if (failedJob.type === 'CONVERT') {
    // Need both EXTRACT and AI_METADATA results
    // ... similar logic
  }

  // Update job and book status
  await prisma.processingJob.update({
    where: { id: failedJob.id },
    data: {
      status: 'PENDING',
      progress: 0,
      error: null,
      retryCount: { increment: 1 },
    },
  });

  await prisma.book.update({
    where: { id: bookId },
    data: { status: 'PROCESSING', errorMessage: null },
  });

  // Re-queue job
  await pdfQueue.add(failedJob.type, jobData);

  return NextResponse.json({ success: true, retryCount: failedJob.retryCount + 1 });
}
```

**5. Library UI Enhancements**

Update BookCard in `library.tsx`:
```typescript
function BookCard({ book, onDelete }: { book: BookFromAPI; onDelete: (id: string) => Promise<void> }) {
  const { retryProcessing, isRetrying } = useRetryProcessing();
  const [showRetryDialog, setShowRetryDialog] = useState(false);

  // ... existing code

  return (
    <Card>
      {/* ... book cover ... */}

      {/* Error State */}
      {book.status === 'ERROR' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Processing Failed
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {book.errorMessage || 'An error occurred during processing'}
              </p>

              {/* Retry Section */}
              {book.retryCount < 3 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    retryProcessing(book.id);
                  }}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Retry Processing ({book.retryCount}/3)
                </Button>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                    Max retries reached (3/3)
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Please delete and re-upload this book
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
```

**6. Create Retry Hook**

```typescript
// src/lib/hooks/use-retry-processing.ts
export function useRetryProcessing() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refetch } = useBooks();

  const retryProcessing = async (bookId: string) => {
    setIsRetrying(true);
    setError(null);

    try {
      const response = await fetch(`/api/books/${bookId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Retry failed');
      }

      toast.success('Processing retry initiated', {
        description: 'Your book is being processed again.',
      });

      // Refetch books to update UI
      setTimeout(() => refetch(), 500);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to retry';
      setError(errorMsg);
      toast.error('Retry failed', { description: errorMsg });
    } finally {
      setIsRetrying(false);
    }
  };

  return { retryProcessing, isRetrying, error };
}
```

### Technical Considerations

**Retry Types:**
1. **Automatic Retries (BullMQ):** 3 attempts with exponential backoff for transient failures
2. **Manual Retries (User-initiated):** Up to 3 manual retries via UI after automatic retries fail

**Total Possible Attempts:**
- Initial attempt: 1
- BullMQ automatic retries: 3
- User manual retries: 3
- **Maximum total:** 7 attempts (1 + 3 auto + 3 manual)

**Job Result Storage:**
- Store in Redis with 24-hour TTL
- Key pattern: `job:result:${processingJobId}`
- Enables retry from failed step without re-running completed steps
- Alternative: Store in ProcessingJob.result JSON field (if Redis unavailable)

**Error Messages:**
| Job Type | Error Message |
|----------|---------------|
| EXTRACT | "Failed to extract text from PDF. The file may be corrupted or password-protected." |
| AI_METADATA | "AI processing failed. Please retry or contact support if the issue persists." |
| CONVERT | "Failed to convert content to readable format. Please retry." |

**UI States:**
| Book Status | Retry Count | UI Display |
|-------------|-------------|------------|
| ERROR | 0 | Retry button (1st attempt) |
| ERROR | 1 | Retry button (2nd attempt) |
| ERROR | 2 | Retry button (3rd attempt) |
| ERROR | 3+ | "Max retries reached" message + Delete button |

### Integration with Existing Stories

**Story 3.5 (Job Chain Orchestration):**
- ✅ Uses existing job chain infrastructure
- ✅ Enhances handleJobFailure to track lastFailedJobType
- ✅ Leverages existing retry endpoint (adds book-based endpoint)

**Story 3.6 (Real-time Progress SSE):**
- ✅ Retry will automatically resume SSE progress updates
- ✅ Progress resets to 0 when retry starts
- ✅ Client reconnects to SSE stream for retried job

**Story 2.6 (Delete Book):**
- ✅ Failed books can be deleted
- ✅ Deletion triggers cascade delete of ProcessingJobs
- ✅ User can delete and re-upload if retries fail

### Dependencies

**Already Installed:**
- `bullmq` - Job queue with built-in retry logic
- `ioredis` - Redis client for job result storage
- `@prisma/client` - Database ORM

**No New Dependencies Required**

### File Structure

**Modified Files:**
- `prisma/schema.prisma` - Add Book.lastFailedJobType
- `src/lib/jobs/job-utils.ts` - Add storeJobResult, getJobResult, enhance handleJobFailure
- `src/lib/jobs/extract-job.ts` - Store extraction results
- `src/lib/jobs/ai-metadata-job.ts` - Store AI results
- `src/components/screens/library.tsx` - Add retry UI
- `src/lib/hooks/use-books.ts` - Expose retryCount in BookFromAPI

**Created Files:**
- `src/app/api/books/[bookId]/retry/route.ts` - Book-based retry endpoint
- `src/lib/hooks/use-retry-processing.ts` - Retry hook for UI
- `tests/unit/retry-processing.test.ts` - Unit tests
- `tests/integration/job-retry-flow.test.ts` - Integration tests

### Testing Strategy

**Unit Tests:**
- Test storeJobResult and getJobResult Redis helpers
- Test retry endpoint validates retryCount limit
- Test retry hook state management
- Mock API calls and verify error handling

**Integration Tests:**
- Test full retry flow: EXTRACT fails → retry → succeeds
- Test retry limit enforcement (3 attempts)
- Test retry restarts from correct step
- Test job result retrieval from Redis
- Test UI updates after retry initiated

**Manual Testing Scenarios:**
1. Upload corrupted PDF → EXTRACT fails → Retry → Success
2. Simulate AI failure → Retry → Verify AI_METADATA restarts
3. Retry 3 times → Verify max retries message
4. Delete failed book → Verify cascade delete works
5. Test retry button states (loading, disabled, enabled)

### Known Limitations

**MVP Scope:**
- ✅ Retry limit: 3 manual attempts (configurable)
- ✅ Job results stored for 24 hours only
- ❌ No partial job retry (must restart entire job step)
- ❌ No detailed error diagnostics in UI (just error message)
- ❌ No automatic retry scheduling (user must manually click)

**Future Enhancements (Post-MVP):**
- Add automatic retry after delay (smart retry)
- Store job results in database for longer persistence
- Add detailed error logs accessible from UI
- Implement partial checkpoint retry within jobs
- Add admin dashboard to view all failed jobs

### Architecture Compliance

**Tech Stack:**
- ✅ PostgreSQL + Prisma for persistent error tracking
- ✅ Redis for job result caching
- ✅ BullMQ for retry orchestration
- ✅ React + Zustand for UI state
- ✅ Next.js App Router for API endpoints

**Best Practices:**
- ✅ Graceful degradation (show delete option when retries exhausted)
- ✅ User-friendly error messages
- ✅ Optimistic UI updates
- ✅ Proper loading states
- ✅ Toast notifications for feedback
- ✅ Accessibility (buttons, error messages)

### Previous Story Learnings Applied

**From Story 3.5 (Job Chain):**
- ✅ Reuse existing retry endpoint pattern
- ✅ Leverage job-utils.ts for shared logic
- ✅ Use ProcessingJob.retryCount for tracking
- ✅ Store job results for chain continuation

**From Story 2.6 (Delete Book):**
- ✅ Provide delete option for failed books
- ✅ Cascade delete ProcessingJobs
- ✅ User-friendly delete confirmation

**From Story 3.2 (PDF Extraction):**
- ✅ Use Book.errorMessage for user feedback
- ✅ Handle corrupted PDFs gracefully
- ✅ Show specific error reasons

## Dev Agent Record

### Agent Model Used

[To be filled by Dev Agent]

### Debug Log References

[To be filled by Dev Agent]

### Completion Notes List

[To be filled by Dev Agent]

### File List

**Expected Modified Files:**
- prisma/schema.prisma
- src/lib/jobs/job-utils.ts
- src/lib/jobs/extract-job.ts
- src/lib/jobs/ai-metadata-job.ts
- src/lib/jobs/convert-job.ts
- src/components/screens/library.tsx
- src/lib/hooks/use-books.ts

**Expected Created Files:**
- src/app/api/books/[bookId]/retry/route.ts
- src/lib/hooks/use-retry-processing.ts
- tests/unit/retry-processing.test.ts
- tests/integration/job-retry-flow.test.ts

**Expected Deleted Files:**
- None

## Change Log

- 2026-02-09: Story created - Processing error recovery with retry button and job result caching
  - Analyzed existing job queue and retry infrastructure from Story 3.5
  - Defined retry strategy: restart from failed step with cached results
  - Designed UI for error display and retry button
  - Specified Redis caching for job results
  - Set retry limit to 3 manual attempts
  - Integrated with existing delete functionality for max retries scenario
