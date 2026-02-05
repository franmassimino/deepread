---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 'complete']
inputDocuments: ['docs/bmad-output/planning-artifacts/prd.md', 'docs/index.md', 'docs/project-overview.md', 'docs/architecture.md']
workflowType: 'architecture'
project_name: 'deepread'
user_name: 'Francisco'
date: '2026-01-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The system requires **6 major capability areas** with **18 detailed sub-requirements**:

1. **PDF Upload & Management (FR1)** - Multi-file uploads with validation, real-time progress tracking, background processing, and comprehensive error handling
2. **PDF Processing & Content Extraction (FR2)** - Text extraction with structure preservation, visual content extraction (images, tables), and HTML/markdown conversion
3. **AI-Powered Metadata Generation (FR3)** - Book metadata auto-generation, intelligent chapter detection, and processing quality assurance via Mastra AI
4. **Library Management (FR4)** - Book library display, processing status tracking, and persistent state management
5. **Reading Experience (FR5)** - Clean content display, chapter navigation, and responsive reading interface
6. **Data Persistence (FR6)** - Database storage, file storage, and progress state management with recovery

**Architectural Implications:**
- Requires **background job processing system** for PDF operations
- Needs **real-time communication** for progress updates (WebSocket or polling)
- Demands **AI integration layer** for Mastra processing
- Requires **dual storage strategy** (database + file system)
- Must support **state recovery** and interruption handling

**Non-Functional Requirements:**

**Performance Drivers:**
- PDF processing: 2-3 minutes for 200-400 page books
- Page load: <2 seconds initial, <3 seconds time-to-interactive
- Chapter rendering: <500ms
- UI responsiveness: 60fps interactions

**Reliability Requirements:**
- Data durability across sessions
- Graceful degradation for failures
- Automatic retry for transient errors
- Crash recovery without data loss

**Scalability Targets:**
- 3-5 concurrent PDF processing jobs
- 50-100 book library capacity
- Books up to 1000 pages
- Architecture extensible for Phase 2 features

**Maintainability Constraints:**
- TypeScript strict mode
- Existing tech stack: Next.js + React 19 + Zustand
- Minimal external dependencies
- Clear separation of concerns

**Scale & Complexity:**

- **Primary domain:** Full-stack web application
- **Complexity level:** Medium
- **Estimated architectural components:** 8-10 major components
  - Frontend: Upload UI, Library UI, Reader UI, Progress tracking
  - Backend: API routes, PDF processor, AI integration, Job queue
  - Data: Database layer, File storage, State management

### Technical Constraints & Dependencies

**Existing Stack (Brownfield Project):**
- **Frontend:** Next.js App Router, React 19, Zustand (state), Shadcn/UI + Tailwind CSS
- **Build:** TypeScript (strict mode), modern tooling
- **Deployment:** Web-based (no mobile native for MVP)

**Hard Requirements:**
- Must integrate with existing UI components and routing
- No authentication system for MVP (single-user local)
- Desktop-first with mobile functional support
- Modern browser support only (no IE11)

**External Dependencies:**
- **Mastra AI:** For metadata generation and chapter detection
- **PDF Processing Library:** TBD - needs text/image/table extraction
- **Database:** TBD - needs to support metadata + content storage
- **File Storage:** TBD - local or cloud storage for PDFs
- **Job Queue:** TBD - for background processing management

### Cross-Cutting Concerns Identified

**1. Background Job Processing**
- Affects: PDF upload, processing pipeline, AI generation
- Requirements: Queue management, progress tracking, failure recovery, server-side continuation

**2. Real-Time Communication**
- Affects: Upload progress, processing status, completion notifications
- Requirements: WebSocket or polling mechanism, client-server sync

**3. Error Handling & Recovery**
- Affects: All components
- Requirements: Graceful degradation, clear error messages, retry logic, state recovery

**4. Data Consistency**
- Affects: Database, file storage, state management
- Requirements: Transaction handling, rollback on failure, progress persistence

**5. Performance Optimization**
- Affects: PDF processing, rendering, navigation
- Requirements: Chunking strategies, lazy loading, caching, memory management

**6. Future Extensibility**
- Affects: Database schema, API design, component architecture
- Requirements: Prepare for Phase 2 (highlights, notes, AI chat), Phase 3 (auth, sync)

## Technology Stack Decisions

### Database Selection

**Decision: PostgreSQL (via Vercel Postgres or local)**

**Rationale:**
- **Relational structure** fits book/chapter/metadata model perfectly
- **JSON support** for flexible metadata and AI-generated content
- **ACID compliance** ensures data durability (NFR requirement)
- **Full-text search** ready for Phase 2 search features
- **Easy local development** with Docker
- **Vercel integration** for potential deployment

**Alternatives Considered:**
- SQLite: Simple but limited scalability for concurrent processing
- MongoDB: Overkill for structured book data, weaker consistency guarantees
- Drizzle ORM: More lightweight but Prisma wins for personal project DX

**ORM Choice: Prisma ORM**
- **Best-in-class Developer Experience**: Intuitive schema, excellent TypeScript types
- **Prisma Studio**: Visual database browser - invaluable for debugging and data inspection
- **Mature ecosystem**: Battle-tested, extensive documentation, large community
- **Migrations**: Auto-generated, easy to manage and review
- **Personal project fit**: Development speed and tooling > micro-optimizations
- **Type safety**: End-to-end type safety from database to application code

### File Storage

**Decision: Local filesystem for MVP, S3-compatible for production**

**Rationale:**
- **Local development:** Store PDFs in `/public/uploads` or `/storage` directory
- **Production:** Vercel Blob Storage or S3 for scalability
- **Abstraction layer:** Create storage service to swap implementations easily

**Storage Structure:**
```
/storage/
  /pdfs/
    /{bookId}/
      original.pdf
  /images/
    /{bookId}/
      /{chapterId}/
        image-1.png
        image-2.png
```

### PDF Processing Library

**Decision: pdf-parse + pdf.js**

**Rationale:**
- **pdf-parse:** Fast text extraction, Node.js native
- **pdf.js (Mozilla):** Advanced rendering, image extraction, table detection
- **Combined approach:** pdf-parse for text, pdf.js for visual content
- **Open source:** No licensing costs, active community

**Alternatives Considered:**
- PDFium: More complex integration
- Apache PDFBox (Java): Requires Java runtime
- Commercial APIs (Adobe, etc.): Unnecessary cost for MVP

### Background Job Processing

**Decision: BullMQ + Redis**

**Rationale:**
- **BullMQ:** Modern, TypeScript-first job queue
- **Redis:** In-memory store for queue state and progress tracking
- **Features needed:**
  - Job prioritization
  - Progress tracking
  - Retry logic with exponential backoff
  - Job recovery after crash
  - Concurrent worker support (3-5 jobs)

**Job Types:**
1. `pdf-upload` - File validation and storage
2. `pdf-extraction` - Text and visual content extraction
3. `ai-metadata` - Mastra AI processing for summaries/chapters
4. `content-conversion` - HTML/markdown generation

**Queue Architecture:**
```typescript
// Single queue with different job types
const pdfQueue = new Queue('pdf-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});
```

### Real-Time Communication

**Decision: Server-Sent Events (SSE) for progress updates**

**Rationale:**
- **Simpler than WebSocket** for one-way server→client updates
- **Native browser support** with EventSource API
- **Automatic reconnection** built-in
- **Works with Next.js API routes** easily

**Alternative:** Polling (fallback if SSE issues)

**Implementation:**
```typescript
// API route: /api/jobs/{jobId}/progress
// Client subscribes to job progress updates
// Server pushes progress events from BullMQ
```

### AI Integration Layer

**Decision: Direct Mastra SDK integration**

**Rationale:**
- **Mastra AI** already specified in PRD
- **Server-side only:** Keep API keys secure in backend
- **Async processing:** Run in background jobs, not blocking API routes

**Integration Points:**
1. Book summary generation
2. Chapter boundary detection
3. Chapter title extraction
4. Metadata enrichment (genre, topics, reading level)

### State Management

**Decision: Zustand (already in stack) + Server State (TanStack Query)**

**Rationale:**
- **Zustand:** Client-side UI state (already used)
- **TanStack Query (React Query):** Server state, caching, real-time updates
- **Separation of concerns:** UI state vs server data

**State Structure:**
```typescript
// Zustand: UI state
- uploadProgress: Map<fileId, progress>
- activeBookId: string
- readerSettings: { fontSize, theme }

// React Query: Server state
- books: Book[]
- book(id): Book with chapters
- jobStatus(id): ProcessingStatus
```

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│           Next.js Frontend (React 19)           │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Upload  │  │ Library  │  │  Reader  │     │
│  │    UI    │  │    UI    │  │    UI    │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │            │
│  ┌────┴─────────────┴──────────────┴─────┐     │
│  │    Zustand State + React Query        │     │
│  └────────────────┬───────────────────────┘     │
└───────────────────┼─────────────────────────────┘
                    │ API calls (fetch)
┌───────────────────┼─────────────────────────────┐
│                   ▼                             │
│         Next.js API Routes (Backend)            │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Upload  │  │  Books   │  │  Jobs    │     │
│  │  Routes  │  │  Routes  │  │  Routes  │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │            │
│  ┌────┴─────────────┴──────────────┴─────┐     │
│  │       Services Layer                  │     │
│  │  - PDFService                         │     │
│  │  - MastraService                      │     │
│  │  - StorageService                     │     │
│  │  - BookService                        │     │
│  └────┬───────────────┬──────────────────┘     │
│       │               │                         │
│  ┌────▼─────┐    ┌───▼──────┐                 │
│  │PostgreSQL│    │  BullMQ  │                 │
│  │   (DB)   │    │  + Redis │                 │
│  └──────────┘    └────┬─────┘                 │
│                       │                         │
│                  ┌────▼─────┐                  │
│                  │  Workers │                  │
│                  │ - PDF    │                  │
│                  │ - AI     │                  │
│                  │ - Convert│                  │
│                  └──────────┘                  │
└─────────────────────────────────────────────────┘
```

### Component Breakdown

**Frontend Components:**
1. **Upload Flow**
   - File picker with drag-drop
   - Multi-file selection
   - Upload progress bars (real-time via SSE)
   - Error display and retry

2. **Library View**
   - Book grid/list with metadata
   - Processing status indicators
   - Search and filter (future)
   - Book actions (open, delete)

3. **Reader View**
   - Chapter navigation sidebar
   - Content rendering (HTML/markdown)
   - Progress tracking
   - Reading position persistence

**Backend Services:**
1. **PDFService**
   - `uploadPDF(file)` → store file, create job
   - `extractContent(pdfPath)` → text + images + tables
   - `convertToHTML(content)` → renderable format

2. **MastraService**
   - `generateSummary(text)` → AI summary
   - `detectChapters(text)` → chapter boundaries
   - `extractMetadata(text)` → title, author, topics

3. **BookService**
   - `createBook(metadata)` → DB record
   - `getBooks()` → list all books
   - `getBook(id)` → book with chapters
   - `deleteBook(id)` → cleanup DB + files

4. **StorageService**
   - `savePDF(file)` → filesystem/S3
   - `saveImage(bookId, image)` → store extracted images
   - `getPDFPath(bookId)` → retrieve location

5. **JobService**
   - `createJob(type, data)` → add to queue
   - `getJobStatus(id)` → progress info
   - `subscribeToProgress(id)` → SSE stream

### Data Model

**Prisma Schema:**

```prisma
// schema.prisma

model Book {
  id                  String             @id @default(uuid())
  title               String
  author              String?
  summary             String             @db.Text // AI-generated
  coverUrl            String?
  pdfPath             String             // Storage location
  totalPages          Int
  wordCount           Int
  readingTimeMinutes  Int
  status              BookStatus         @default(PROCESSING)
  processingJobId     String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  chapters            Chapter[]
  readingProgress     ReadingProgress[]
  processingJobs      ProcessingJob[]

  @@index([status])
  @@index([createdAt])
}

enum BookStatus {
  PROCESSING
  READY
  ERROR
}

model Chapter {
  id             String    @id @default(uuid())
  bookId         String
  chapterNumber  Int
  title          String
  content        String    @db.Text // HTML/markdown
  wordCount      Int
  startPage      Int?
  endPage        Int?
  createdAt      DateTime  @default(now())

  book           Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId, chapterNumber])
}

model ReadingProgress {
  id          String   @id @default(uuid())
  bookId      String
  chapterId   String
  position    Int      // Percentage or scroll position
  lastReadAt  DateTime @updatedAt

  book        Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([bookId, chapterId])
}

model ProcessingJob {
  id          String       @id @default(uuid())
  bookId      String
  type        JobType
  status      JobStatus    @default(PENDING)
  progress    Int          @default(0) // 0-100
  error       String?      @db.Text
  createdAt   DateTime     @default(now())
  completedAt DateTime?

  book        Book         @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId, status])
}

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
```

## API Design

### REST Endpoints

**Books:**
- `GET /api/books` - List all books
- `GET /api/books/[id]` - Get book details with chapters
- `POST /api/books` - Create book (triggers upload job)
- `DELETE /api/books/[id]` - Delete book and cleanup

**Upload:**
- `POST /api/upload` - Upload PDF file(s)
  - Multipart form data
  - Returns: jobIds for tracking

**Jobs:**
- `GET /api/jobs/[id]` - Get job status
- `GET /api/jobs/[id]/progress` - SSE endpoint for real-time updates

**Chapters:**
- `GET /api/books/[bookId]/chapters` - List chapters
- `GET /api/books/[bookId]/chapters/[id]` - Get chapter content

### Processing Workflow

**Upload Flow:**
```
1. User selects PDF(s) → POST /api/upload
2. API validates files → saves to storage
3. Creates book record (status: 'processing')
4. Enqueues job chain:
   a. pdf-extraction job
   b. ai-metadata job (depends on a)
   c. content-conversion job (depends on b)
5. Returns job IDs to client
6. Client subscribes to SSE for progress
7. Worker processes jobs sequentially
8. Updates book status to 'ready' when complete
```

**Job Chain Details:**
```typescript
// Job 1: PDF Extraction
{
  type: 'pdf-extraction',
  data: { bookId, pdfPath },
  process: async () => {
    const content = await PDFService.extractContent(pdfPath);
    await db.books.update({ rawContent: content });
    // Enqueue next job
    await JobService.createJob('ai-metadata', { bookId });
  }
}

// Job 2: AI Metadata
{
  type: 'ai-metadata',
  data: { bookId },
  process: async () => {
    const book = await db.books.findById(bookId);
    const summary = await MastraService.generateSummary(book.rawContent);
    const chapters = await MastraService.detectChapters(book.rawContent);
    await db.books.update({ summary });
    await db.chapters.createMany(chapters);
    // Enqueue next job
    await JobService.createJob('content-conversion', { bookId });
  }
}

// Job 3: Content Conversion
{
  type: 'content-conversion',
  data: { bookId },
  process: async () => {
    const chapters = await db.chapters.findByBookId(bookId);
    for (const chapter of chapters) {
      const html = await PDFService.convertToHTML(chapter.rawContent);
      await db.chapters.update(chapter.id, { content: html });
    }
    await db.books.update(bookId, { status: 'ready' });
  }
}
```

## Deployment Strategy

**Development:**
- Local PostgreSQL (Docker)
- Local Redis (Docker)
- Local file storage (`/storage`)
- Next.js dev server

**Production (Vercel recommended):**
- Vercel Postgres (managed PostgreSQL)
- Upstash Redis (serverless Redis)
- Vercel Blob Storage (S3-compatible)
- Next.js serverless functions
- Background workers via Vercel Cron or separate worker dyno

**Environment Variables:**
```
DATABASE_URL=
REDIS_URL=
MASTRA_API_KEY=
STORAGE_BUCKET=
NODE_ENV=
```

**Initial Setup Commands:**
```bash
# Install dependencies
npm install prisma @prisma/client bullmq ioredis pdf-parse mastra

# Dev dependencies
npm install -D tsx

# Initialize Prisma
npx prisma init

# Create migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Optional: Open Prisma Studio to inspect database
npx prisma studio
```

## Security Considerations

**File Upload Security:**
- Validate file type (magic number check, not just extension)
- Size limits (e.g., 50MB per file)
- Virus scanning (optional for MVP, critical for production)
- Sanitize filenames

**Data Security:**
- No authentication for MVP (local single-user)
- Prepared for Phase 3: JWT tokens, session management
- SQL injection prevention via ORM (Prisma)
- XSS prevention via React's built-in escaping

**API Security:**
- Rate limiting on upload endpoints
- CORS configuration for production
- Mastra API key server-side only (never exposed to client)

## Performance Optimization Strategy

**PDF Processing:**
- Stream processing for large files (avoid loading entire PDF in memory)
- Chunk extraction (process in batches)
- Cache extracted content temporarily during job chain

**Frontend:**
- Lazy load chapters (don't fetch all at once)
- Virtual scrolling for long content
- Image lazy loading
- Code splitting for reader view

**Database:**
- Index on bookId, chapterId for fast queries
- Pagination for book lists
- Consider full-text search index for Phase 2

**Caching:**
- React Query cache for book/chapter data (5 min TTL)
- CDN caching for static assets
- No caching for real-time job progress

## Monitoring & Observability

**Logging:**
- Structured logging (Winston or Pino)
- Log levels: error, warn, info, debug
- Log job progress and failures

**Metrics (Future):**
- Processing time per job type
- Success/failure rates
- Queue depth and wait times
- API response times

**Error Tracking:**
- Sentry for production errors
- Track PDF processing failures
- Monitor Mastra API errors

## Future Architecture Evolution

**Phase 2 (Interactive Learning):**
- Add Highlights table
- Add Notes table
- Extend ReadingProgress
- Add AI Chat service (RAG with vector DB)

**Phase 3 (Multi-user):**
- Add Users table
- Add authentication (NextAuth.js)
- Row-level security in DB
- User-specific storage paths

**Scalability Path:**
- Horizontal scaling: Multiple worker instances
- Database read replicas
- CDN for static content and images
- Queue sharding if needed

