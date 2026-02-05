# Story 3.2: PDF Text Extraction

Status: review

<!-- MVP Pragmatic Version: No BullMQ, simple async processing with polling -->

## Story

As a developer,
I want to extract text content from uploaded PDFs,
So that book content can be stored and displayed for reading.

## Acceptance Criteria

1. **Given** a PDF has been uploaded and saved to storage
   **When** the extraction process runs
   **Then** text content is extracted from the PDF using pdf-parse

2. **And** the extracted text preserves basic structure (paragraph breaks, page breaks)

3. **And** the text is stored in the database associated with the book

4. **And** the Book.status is updated to READY when extraction completes

5. **And** if extraction fails, Book.status is set to ERROR with error message

6. **And** extraction completes within 30 seconds for typical PDFs (200-400 pages)

7. **And** the user sees real-time progress (uploading → extracting → ready)

## Tasks / Subtasks

- [x] Task 1: Install pdf-parse Library (AC: #1)
  - [x] 1.1 Install `pdf-parse` package: `npm install pdf-parse@1.1.1`
  - [x] 1.2 Install types: included in package
  - [x] 1.3 Verify installation works with simple test

- [x] Task 2: Create PDF Extraction Service (AC: #1, #2)
  - [x] 2.1 Create `lib/services/pdf-extraction.ts`
  - [x] 2.2 Implement `extractTextFromPDF(pdfPath: string)` function:
    - Reads PDF file from storage
    - Uses pdf-parse to extract text
    - Returns: `{ text: string, pageCount: number, info: object }`
  - [x] 2.3 Preserve page breaks in text (via pdf-parse output)
  - [x] 2.4 Handle PDF read errors gracefully (PDFExtractionError)
  - [x] 2.5 Add helper functions: `isScannedPDF()`, `getWordCount()`

- [x] Task 3: Create Async Processing API Route (AC: #1, #4, #5)
  - [x] 3.1 Create `app/api/process/[bookId]/route.ts` (POST endpoint)
  - [x] 3.2 Endpoint accepts bookId, loads PDF path from database
  - [x] 3.3 Calls PDF extraction service
  - [x] 3.4 Creates initial Chapter record with extracted text:
    - Single chapter titled "Full Book" (chapter detection comes in Epic 4)
    - Stores extracted text in Chapter.content
  - [x] 3.5 Updates Book.status to READY on success
  - [x] 3.6 Updates Book.status to ERROR with message on failure
  - [x] 3.7 Updates Book.totalPages with actual page count
  - [x] 3.8 Returns immediately (don't wait for extraction) with `{ accepted: true }`

- [x] Task 4: Create Processing Status API Route (AC: #7)
  - [x] 4.1 Create `app/api/books/[id]/status/route.ts` (GET endpoint)
  - [x] 4.2 Returns book status: PROCESSING, READY, or ERROR
  - [x] 4.3 Returns error message if status is ERROR
  - [x] 4.4 Returns processing progress (0/50/100 based on status)

- [x] Task 5: Integrate Processing Flow with Upload (AC: #7)
  - [x] 5.1 Modify upload-store to trigger processing after upload completes
  - [x] 5.2 After upload success, call POST /api/process/[bookId]
  - [x] 5.3 Replace simulateProcessing with real status polling:
    - Poll GET /api/books/[bookId]/status every 2 seconds
    - Update progress UI based on status
    - When READY, add book to library with toast success
    - When ERROR, show error with retry option
  - [x] 5.4 Update progress steps: "Uploading..." → "Extracting text..." → "Ready!"

- [x] Task 6: Handle Edge Cases (AC: #5, #6)
  - [x] 6.1 Handle corrupted PDFs (catch extraction errors)
  - [x] 6.2 Handle very large PDFs - pdf-parse handles this
  - [x] 6.3 Handle PDFs with no extractable text (scanned images) via isScannedPDF()
  - [x] 6.4 Error handling with Book.errorMessage field
  - [x] 6.5 Added errorMessage field to Book schema

- [x] Task 7: Unit Tests
  - [x] 7.1 Test: pdf-parse extracts text from sample PDF
  - [x] 7.2 Test: extraction service returns correct page count
  - [x] 7.3 Test: API route triggers extraction and updates status
  - [x] 7.4 Test: status endpoint returns correct book status
  - [x] 7.5 Test: corrupted PDF returns ERROR status
  - [x] 7.6 Test: helper functions (isScannedPDF, getWordCount)

## Dev Notes

### Architecture Decision: Simple Async Processing (No BullMQ)

**Why not BullMQ for MVP:**
- Adds Redis dependency (another service to run)
- More complex infrastructure
- Overkill for single-user personal app
- Can be added later if needed

**Simple approach:**
```
Upload Flow:
1. Client uploads PDF → POST /api/upload
2. Server saves PDF, creates Book record (status: PROCESSING)
3. Server immediately responds with bookId
4. Client calls POST /api/process/[bookId] (async, returns immediately)
5. Server starts extraction in background (after responding)
6. Client polls GET /api/books/[bookId]/status every 2s
7. When status=READY, book appears in library
```

### Existing Code Analysis

**Upload Store** ([lib/stores/upload-store.tsx](lib/stores/upload-store.tsx))
- ✅ Already has `simulateProcessing()` function (lines 271-331)
- ✅ Already polls progress (simulated)
- ✅ Already updates book status to ready
- ✅ Already adds book to library when complete
- ❌ Uses fake simulation - needs to be replaced with real API calls

**Current Flow to Replace:**
```typescript
// CURRENT (fake):
xhr.onload = () => {
  // ... upload success ...
  simulateProcessing(id, bookId, file.name, get); // FAKE
}

// NEW (real):
xhr.onload = async () => {
  // ... upload success ...
  await fetch(`/api/process/${bookId}`, { method: 'POST' }); // Trigger processing
  pollProcessingStatus(bookId, id); // Real polling
}
```

**Book Model** ([prisma/schema.prisma](prisma/schema.prisma))
- ✅ Already has Book.status field (PROCESSING, READY, ERROR)
- ✅ Already has Book.totalPages field
- ✅ Already has Chapter model for storing content
- ✅ Relation Book → Chapters already configured (Cascade delete)

**Storage** (from Story 2.1)
- ✅ PDFs saved to `/storage/pdfs/{bookId}/`
- ✅ StorageService should have `getFilePath(bookId, filename)`

### Implementation Details

**1. PDF Extraction Service**

```typescript
// lib/services/pdf-extraction.ts
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

export async function extractTextFromPDF(pdfPath: string) {
  const buffer = await fs.readFile(pdfPath);
  const data = await pdfParse(buffer);
  
  return {
    text: data.text,
    pageCount: data.numpages,
    info: data.info,
  };
}
```

**2. Processing API Route**

```typescript
// app/api/process/[bookId]/route.ts
import { NextRequest } from 'next/server';
import { extractTextFromPDF } from '@/lib/services/pdf-extraction';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@/lib/services/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const { bookId } = params;
  
  // Respond immediately - processing happens after
  const response = Response.json({ accepted: true });
  
  // Start processing in background (fire-and-forget)
  (async () => {
    try {
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) return;
      
      const pdfPath = StorageService.getPDFPath(bookId);
      const { text, pageCount } = await extractTextFromPDF(pdfPath);
      
      // Create single chapter with all content
      await prisma.chapter.create({
        data: {
          bookId,
          chapterNumber: 1,
          title: 'Full Book',
          content: text,
          wordCount: text.split(/\s+/).length,
        }
      });
      
      // Update book status
      await prisma.book.update({
        where: { id: bookId },
        data: { 
          status: 'READY', 
          totalPages: pageCount,
          wordCount: text.split(/\s+/).length,
        }
      });
    } catch (error) {
      await prisma.book.update({
        where: { id: bookId },
        data: { 
          status: 'ERROR',
          // Could add errorMessage field if needed
        }
      });
    }
  })();
  
  return response;
}
```

**3. Status Polling in Frontend**

```typescript
// In upload-store.tsx, replace simulateProcessing:
async function pollProcessingStatus(bookId: string, uploadId: string) {
  const poll = async () => {
    const res = await fetch(`/api/books/${bookId}/status`);
    const { status, error } = await res.json();
    
    if (status === 'READY') {
      // Update UI to ready
      // Add to library
    } else if (status === 'ERROR') {
      // Show error
    } else {
      // Still processing, poll again
      setTimeout(poll, 2000);
    }
  };
  
  poll();
}
```

### Technical Notes

- **pdf-parse:** Pure Node.js, no external dependencies, fast
- **Processing time:** Typically 1-5 seconds for 200-400 page PDFs
- **Memory:** Loads entire PDF into memory - may need streaming for very large files (>100MB)
- **Text extraction:** Gets text content only - images/tables will be empty (handled in Story 3.3)
- **Scanned PDFs:** pdf-parse returns empty text - detect this and mark as ERROR or special status

### Dependencies to Install

```bash
npm install pdf-parse
npm install -D @types/pdf-parse
```

### Known Limitations (MVP Scope)

- ❌ No real-time progress during extraction (just PENDING → READY/ERROR)
- ❌ No job queue (only one extraction at a time per server instance)
- ❌ No retry queue (just 1 immediate retry on error)
- ✅ Can be enhanced with BullMQ later if needed

### Testing with Sample PDFs

Create a test script:
```typescript
// scripts/test-extraction.ts
import { extractTextFromPDF } from '@/lib/services/pdf-extraction';

async function test() {
  const result = await extractTextFromPDF('./test.pdf');
  console.log('Pages:', result.pageCount);
  console.log('Text preview:', result.text.substring(0, 500));
}

test();
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
- lib/stores/upload-store.tsx (replaced simulateProcessing with real polling)
- lib/services/storage.ts (added getFilePath method)
- prisma/schema.prisma (added errorMessage field)
- tests/setup.ts (added PDF_PARSE_DISABLE_TEST)

**Expected Created Files:**
- lib/services/pdf-extraction.ts (PDF extraction service)
- app/api/process/[bookId]/route.ts (processing trigger endpoint)
- app/api/books/[id]/status/route.ts (status polling endpoint)
- tests/unit/pdf-extraction.test.ts
- tests/unit/api/process.test.ts
- tests/fixtures/pdfs/sample.pdf (test PDF)
- test/data/05-versions-space.pdf (pdf-parse workaround)

**Expected Deleted Files:**
- None (simulateProcessing will be removed/commented)

## Change Log

- 2026-02-03: Story created - MVP pragmatic version with simple async processing (no BullMQ)
- 2026-02-03: Decision: Use pdf-parse for extraction (fast, local, free), save Mastra AI for Epic 4 (metadata/chapters)
- 2026-02-04: Implementation completed
  - Installed pdf-parse@1.1.1 for PDF text extraction
  - Created PDF extraction service with error handling
  - Created async processing API route with fire-and-forget pattern
  - Created status polling endpoint for real-time progress
  - Integrated with upload flow, replacing simulated processing
  - Added errorMessage field to Book schema
  - Created comprehensive unit tests
