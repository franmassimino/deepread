---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['docs/bmad-output/planning-artifacts/prd.md', 'docs/bmad-output/planning-artifacts/architecture.md']
validationStatus: 'PASSED'
validationDate: '2026-01-14'
criticalFixes: ['Added ReadingProgress model to Story 1.2', 'Added UI skeleton verification note to Epic 2']
---

# deepread - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for deepread, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1: PDF Upload & Management**
- FR1.1: User can select and upload PDF files from local filesystem; System validates file type (PDF only); System enforces file size limits; User can upload multiple PDFs simultaneously; System provides real-time upload progress indication
- FR1.2: System processes PDFs in background (non-blocking); User can continue using application while PDFs process; System tracks processing status for each uploaded file; User receives notification when processing completes; Processing continues if user closes browser (server-side)
- FR1.3: System detects and reports corrupted PDF files; User receives clear error messages for failed uploads; User can retry failed uploads; User can cancel in-progress uploads; System provides option to remove failed uploads

**FR2: PDF Processing & Content Extraction**
- FR2.1: System extracts text content from PDF with structure preservation; System identifies and preserves headings, paragraphs, and lists; System maintains reading order and text flow; System handles multi-column layouts appropriately
- FR2.2: System extracts images from PDF; System embeds images inline with text content; System extracts and formats tables; System preserves special formatting (bold, italics, code blocks)
- FR2.3: System converts extracted content to HTML/markdown format; System generates renderable structured content; System ensures content is responsive and readable

**FR3: AI-Powered Metadata Generation**
- FR3.1: System auto-generates book title (if not in PDF metadata); System auto-detects book author; System generates book summary using AI (Mastra); System calculates total word count; System estimates total reading time
- FR3.2: System intelligently detects chapter boundaries using AI; System generates chapter titles; System creates chapter list with proper ordering; System calculates word count per chapter; System estimates reading time per chapter
- FR3.3: AI generates relevant and accurate book summaries; Chapter detection works for most technical books; Metadata generation completes within processing time budget

**FR4: Library Management**
- FR4.1: User can view all uploaded books in library; System displays book metadata (title, author, summary, cover); System shows processing status for each book; System displays reading progress indicators; User can access book overview from library
- FR4.2: User can remove books from library; User can navigate to book overview; User can see upload/processing timestamp; System persists library state across sessions

**FR5: Reading Experience**
- FR5.1: User can read parsed book content in reading view; System displays content with clean, readable formatting; System renders images inline with text; System displays tables with preserved structure; System applies appropriate typography and spacing
- FR5.2: User can navigate between chapters sequentially (prev/next); User can jump to specific chapter from chapter list; System displays current chapter context; System preserves reading position within chapter
- FR5.3: System provides responsive reading layout (desktop + mobile); User can view book in full reading mode; System maintains consistent UI similar to existing mockup; Reading view provides distraction-free experience

**FR6: Data Persistence**
- FR6.1: System stores book metadata in database; System stores chapter content and metadata; System persists all user data across page reloads; Database supports current MVP data schema
- FR6.2: System stores original PDF files; System maintains file references for uploaded books; File storage supports reliable upload and retrieval
- FR6.3: System saves reading position; System tracks processing state for uploads; System maintains upload queue state; System supports recovery from interruptions

### NonFunctional Requirements

**NFR1: Performance**
- NFR1.1: Initial page load completes in under 2 seconds on standard broadband; Time to interactive under 3 seconds; Application feels responsive to user interactions (60fps UI)
- NFR1.2: PDF processing completes within 2-3 minutes for 200-400 page books; System remains responsive during background processing; Multiple PDFs can process concurrently without blocking
- NFR1.3: Chapter rendering is instantaneous (< 500ms); Smooth scrolling and navigation (no jank); Image loading doesn't block text rendering

**NFR2: Reliability**
- NFR2.1: All uploaded books and metadata persists across sessions; No data loss during processing failures; System recovers gracefully from interruptions
- NFR2.2: System handles corrupted PDFs without crashing; Clear error reporting for failed operations; Automatic retry mechanisms for transient failures
- NFR2.3: No crashes during normal operation; Memory usage stays within reasonable bounds; Background jobs complete reliably

**NFR3: Usability**
- NFR3.1: First-time user can upload and read a book without instructions; UI is intuitive and follows platform conventions; Error messages are clear and actionable
- NFR3.2: WCAG 2.1 Level AA baseline compliance; Keyboard navigation for all core functions; Screen reader compatible for primary flows; Semantic HTML structure
- NFR3.3: Desktop-optimized experience (primary use case); Mobile functional (reading and basic navigation work); Adaptive layouts for different screen sizes

**NFR4: Maintainability**
- NFR4.1: TypeScript strict mode throughout; Consistent code style and conventions; Clear separation of concerns (components, logic, data)
- NFR4.2: Use existing Next.js + React + Zustand architecture; Leverage established libraries (Shadcn/UI, Tailwind); Minimize external dependencies
- NFR4.3: Fast development iteration (hot reload); Clear error messages during development; Easy to test and debug

**NFR5: Scalability (Personal Use)**
- NFR5.1: System handles library of 50-100 books comfortably; Individual books up to 1000 pages supported; No artificial limits on content storage
- NFR5.2: Support 3-5 PDFs processing simultaneously; Queue management for bulk uploads; No blocking of other operations during processing
- NFR5.3: Architecture supports adding Phase 2 features (notes, highlights, AI chat); Database schema designed for growth; API structure allows for future enhancements

**NFR6: Security (Basic)**
- NFR6.1: PDF content stored locally (not shared externally); No telemetry or tracking of reading behavior; User data remains on user's system
- NFR6.2: Validate PDF files before processing; Prevent malicious file uploads; Secure file storage (no public access)
- NFR6.3: Architecture ready for authentication in Phase 3; Secure session management when multi-user support added; No security vulnerabilities in current single-user implementation

### Additional Requirements

**From Architecture Document:**

**Infrastructure & Setup:**
- Setup PostgreSQL database (local Docker for dev, Vercel Postgres for production)
- Setup Redis for BullMQ job queue (local Docker for dev, Upstash for production)
- Initialize Prisma ORM with schema and migrations
- Setup local file storage structure (/storage/pdfs, /storage/images)
- Configure environment variables (DATABASE_URL, REDIS_URL, MASTRA_API_KEY, etc.)

**Technology Stack Implementation:**
- Implement Prisma schema with Book, Chapter, ReadingProgress, ProcessingJob models
- Setup BullMQ queue with job types: pdf-extraction, ai-metadata, content-conversion
- Implement Server-Sent Events (SSE) for real-time progress updates
- Integrate Mastra AI SDK for metadata generation and chapter detection
- Setup TanStack Query (React Query) for server state management
- Configure pdf-parse + pdf.js for PDF processing

**Backend Services (from Architecture):**
- PDFService: uploadPDF(), extractContent(), convertToHTML()
- MastraService: generateSummary(), detectChapters(), extractMetadata()
- BookService: createBook(), getBooks(), getBook(), deleteBook()
- StorageService: savePDF(), saveImage(), getPDFPath()
- JobService: createJob(), getJobStatus(), subscribeToProgress()

**API Endpoints (from Architecture):**
- GET /api/books - List all books
- GET /api/books/[id] - Get book details with chapters
- POST /api/books - Create book (triggers upload job)
- DELETE /api/books/[id] - Delete book and cleanup
- POST /api/upload - Upload PDF file(s)
- GET /api/jobs/[id] - Get job status
- GET /api/jobs/[id]/progress - SSE endpoint for real-time updates
- GET /api/books/[bookId]/chapters - List chapters
- GET /api/books/[bookId]/chapters/[id] - Get chapter content

**Processing Workflow (from Architecture):**
- Job 1: PDF Extraction - Extract text, images, tables from PDF
- Job 2: AI Metadata - Generate summary and detect chapters using Mastra
- Job 3: Content Conversion - Convert extracted content to HTML/markdown

**Cross-Cutting Concerns:**
- Background job processing with BullMQ + Redis
- Real-time communication via SSE for progress updates
- Error handling and recovery with retry logic
- Data consistency with transaction handling
- Performance optimization (streaming, chunking, lazy loading, caching)
- Future extensibility for Phase 2 and Phase 3 features

### FR Coverage Map

- FR1.1 (Upload files, validate, multi-file, progress) → Epic 2
- FR1.2 (Background processing, server-side continuation) → Epic 3
- FR1.3 (Error handling, retry, cancel) → Epic 2
- FR2.1 (Text extraction with structure) → Epic 3
- FR2.2 (Images, tables, formatting) → Epic 3
- FR2.3 (HTML/markdown conversion) → Epic 3
- FR3.1 (Book metadata generation) → Epic 4
- FR3.2 (Chapter detection) → Epic 4
- FR3.3 (AI quality) → Epic 4
- FR4.1 (View library, metadata display) → Epic 5
- FR4.2 (Remove books, navigation, persistence) → Epic 5
- FR5.1 (Content display with formatting) → Epic 6
- FR5.2 (Chapter navigation) → Epic 6
- FR5.3 (Responsive reading layout) → Epic 6
- FR6.1 (Database storage) → Epic 5
- FR6.2 (File storage) → Epic 2
- FR6.3 (Progress state, recovery) → Epic 3, Epic 6

## Epic List

### Epic 1: Project Foundation & Infrastructure
Enable the development environment and core infrastructure to support PDF processing. This epic sets up all the foundational technologies (PostgreSQL, Redis, Prisma, BullMQ, file storage) required for subsequent epics to function.

**FRs covered:** Infrastructure setup from Architecture (Prisma, PostgreSQL, Redis, BullMQ, file storage structure)

**User Outcome:** Development environment is ready with all infrastructure components configured and operational

---

### Epic 2: PDF Upload & Storage
Users can upload PDF books and see them stored in the library with proper validation and error handling.

**FRs covered:** FR1.1, FR1.3, FR6.2

**User Outcome:** Users can successfully upload PDFs (single or multiple), see them appear in their library with basic metadata, and receive clear feedback on upload status and errors

---

### Epic 3: PDF Processing Pipeline
System automatically processes uploaded PDFs in the background to extract readable content with text, images, and formatting preserved.

**FRs covered:** FR1.2, FR2.1, FR2.2, FR2.3, FR6.3

**User Outcome:** PDFs are automatically parsed into structured, readable content with real-time progress tracking, and processing continues even if the browser is closed

---

### Epic 4: AI-Powered Book Metadata
Books automatically get intelligent metadata through AI processing, including summaries, chapter detection, and reading time estimates.

**FRs covered:** FR3.1, FR3.2, FR3.3

**User Outcome:** Users see auto-generated summaries and intelligently organized chapters for their books without manual input

---

### Epic 5: Library Management & Organization
Users can browse, manage, and track their book collection with full CRUD operations and persistent state.

**FRs covered:** FR4.1, FR4.2, FR6.1

**User Outcome:** Users have a functional library to view all books with metadata, see processing status, remove books, and have all data persist across sessions

---

### Epic 6: Reading Experience
Users can read books with clean formatting, easy chapter navigation, and automatic progress tracking.

**FRs covered:** FR5.1, FR5.2, FR5.3, FR6.3 (reading position)

**User Outcome:** Users can read their books in a distraction-free interface with responsive design, chapter navigation, and reading position that persists across sessions
## Epic 1: Project Foundation & Infrastructure

**Goal:** Enable development environment with PostgreSQL, Redis, Prisma, BullMQ, and file storage so that backend services can be built on a solid technical foundation.

### Story 1.1: Database Setup with Prisma

As a developer,
I want to set up PostgreSQL with Prisma ORM,
So that I have a type-safe database layer for storing book and chapter data.

**Acceptance Criteria:**

**Given** the project has Next.js configured
**When** I install and configure Prisma with PostgreSQL
**Then** Prisma is initialized with a connection to a local PostgreSQL database
**And** I can run `npx prisma studio` to view the database
**And** migrations can be created and applied successfully
**And** TypeScript types are generated for database models

**Technical Notes:**
- Install: `prisma`, `@prisma/client`
- Initialize: `npx prisma init`
- Configure `DATABASE_URL` in `.env`
- Use Docker for local PostgreSQL if needed

---

### Story 1.2: Core Database Schema

As a developer,
I want to create the initial database schema for books, chapters, and reading progress,
So that I can store uploaded PDF metadata, content, and user reading state.

**Acceptance Criteria:**

**Given** Prisma is configured and connected to PostgreSQL
**When** I define the database models in the Prisma schema
**Then** the Book model includes fields: id, title, author, summary, pdfPath, totalPages, wordCount, status, createdAt, updatedAt
**And** the Chapter model includes fields: id, bookId, chapterNumber, title, content, wordCount, startPage, endPage
**And** the ReadingProgress model includes fields: id, bookId, chapterId, position, lastReadAt
**And** proper relationships are defined (Book has many Chapters and ReadingProgress records)
**And** cascading deletes are configured (deleting Book deletes its Chapters and ReadingProgress)
**And** ReadingProgress has unique constraint on (bookId, chapterId)
**And** the migration runs successfully with `npx prisma migrate dev`
**And** I can create test records using Prisma Client

**Technical Notes:**
- Status enum: PROCESSING, READY, ERROR
- Use @db.Text for large content fields (summary, content)
- Add indexes on bookId and chapterNumber
- ReadingProgress position is scroll position (0-100 percentage)
- Note: ProcessingJob model will be added in Story 3.1 when job queue is implemented

---

### Story 1.3: Redis and BullMQ Setup

As a developer,
I want to set up Redis and BullMQ for background job processing,
So that I can handle PDF processing asynchronously without blocking the UI.

**Acceptance Criteria:**

**Given** the project has a database configured
**When** I install and configure Redis and BullMQ
**Then** Redis is running locally (via Docker or local install)
**And** I can connect to Redis from the Next.js application
**And** BullMQ queue is initialized with proper TypeScript types
**And** I can add a test job to the queue and process it successfully
**And** job status can be retrieved and tracked
**And** failed jobs can retry with exponential backoff

**Technical Notes:**
- Install: `bullmq`, `ioredis`
- Configure `REDIS_URL` in `.env`
- Create queue: `pdf-processing` with retry logic
- Test with a simple "hello world" job

---

### Story 1.4: File Storage Service

As a developer,
I want to create a file storage abstraction layer,
So that I can store PDFs locally in development and easily switch to cloud storage later.

**Acceptance Criteria:**

**Given** the project has a basic infrastructure setup
**When** I implement a StorageService with methods for saving and retrieving files
**Then** PDFs can be saved to `/storage/pdfs/{bookId}/` directory
**And** images can be saved to `/storage/images/{bookId}/{chapterId}/` directory
**And** files can be retrieved by bookId and filename
**And** the storage directory is created automatically if it doesn't exist
**And** the storage directory is added to `.gitignore`
**And** I can test saving and retrieving a file successfully

**Technical Notes:**
- Use Node.js `fs/promises` for file operations
- Create interface: `saveFile(path, buffer)`, `getFile(path)`, `deleteFile(path)`
- Prepare for future S3/Vercel Blob integration

---

### Story 1.5: Development Environment Configuration

As a developer,
I want to configure environment variables and scripts for local development,
So that the application runs consistently across development and production.

**Acceptance Criteria:**

**Given** all infrastructure components are set up
**When** I configure environment variables and npm scripts
**Then** `.env.example` exists with all required variables documented
**And** `.env` is in `.gitignore`
**And** Docker Compose file exists for PostgreSQL and Redis (optional but recommended)
**And** `npm run dev` starts Next.js with all services available
**And** `npm run db:migrate` runs Prisma migrations
**And** `npm run db:studio` opens Prisma Studio
**And** all TypeScript types compile without errors

**Technical Notes:**
- Required env vars: DATABASE_URL, REDIS_URL, NODE_ENV
- Optional: Docker compose with postgres + redis services

---

## Epic 2: PDF Upload & Storage

**Goal:** Users can upload PDFs and see them stored in their library, enabling the foundation for PDF processing.

**Functional Requirements:** FR1.1 (File Upload), FR1.3 (Error Handling), FR6.2 (File Storage)

**⚠️ CRITICAL IMPLEMENTATION NOTE:**
Before implementing ANY story in this epic or subsequent epics, ALWAYS check if UI skeleton/components already exist in the codebase. The project may already have Shadcn UI components, page structures, or routing configured. Verify existing code FIRST, then integrate with or extend what's there rather than creating from scratch.

### Story 2.1: Basic File Upload API

As a user,
I want to upload a PDF file through the application,
So that I can add books to my library.

**Acceptance Criteria:**

**Given** the storage service is configured
**When** I implement the POST /api/upload endpoint
**Then** the endpoint accepts multipart/form-data with PDF files
**And** the endpoint validates that uploaded files are PDFs (check magic number, not just extension)
**And** the endpoint enforces a 50MB file size limit
**And** valid PDFs are saved to storage using StorageService
**And** a Book record is created in the database with status PROCESSING
**And** the API returns the book ID and upload success status
**And** invalid files return a 400 error with a clear error message
**And** files exceeding size limits return a 413 error

**Technical Notes:**
- Use Next.js file upload handling
- Validate MIME type and magic number for PDFs
- Generate unique bookId (UUID)

---

### Story 2.2: Upload Progress Tracking UI

As a user,
I want to see real-time upload progress when uploading PDFs,
So that I know my files are being uploaded successfully.

**Acceptance Criteria:**

**Given** the upload API endpoint exists
**When** I implement the upload UI component
**Then** users can click a button to open a file picker
**And** users can select one or multiple PDF files
**And** a progress bar appears for each file being uploaded
**And** progress updates in real-time (0-100%)
**And** successful uploads show a success indicator
**And** failed uploads show an error message with reason
**And** users can cancel an in-progress upload
**And** the file picker only accepts .pdf files

**Technical Notes:**
- Use XMLHttpRequest or fetch with progress events
- Update Zustand store with upload progress
- Display progress using Shadcn UI Progress component

---

### Story 2.3: Multi-File Upload Support

As a user,
I want to upload multiple PDF files at once,
So that I can add several books to my library efficiently.

**Acceptance Criteria:**

**Given** single file upload works correctly
**When** I select multiple PDF files for upload
**Then** all files are uploaded concurrently (up to 3 parallel uploads)
**And** each file has its own progress indicator
**And** each file creates a separate Book record
**And** failed uploads don't affect successful ones
**And** I can see which files succeeded and which failed
**And** I can retry individual failed uploads
**And** successfully uploaded books appear in the library even if others fail

**Technical Notes:**
- Limit concurrent uploads to 3 to prevent overwhelming server
- Queue additional uploads if more than 3 selected
- Handle each upload independently

---

### Story 2.4: Upload Error Handling

As a user,
I want to receive clear error messages when uploads fail,
So that I understand what went wrong and can take corrective action.

**Acceptance Criteria:**

**Given** the upload system is implemented
**When** an upload fails for any reason
**Then** I see a specific error message for file type errors ("Only PDF files are supported")
**And** I see a specific error message for file size errors ("File exceeds 50MB limit")
**And** I see a specific error message for network errors ("Upload failed - check connection")
**And** I see a specific error message for server errors ("Server error - please try again")
**And** corrupted PDFs are detected and show "Invalid or corrupted PDF file"
**And** I can retry the upload with a "Retry" button
**And** I can dismiss the error and continue using the application

**Technical Notes:**
- Implement file validation before upload (client-side)
- Validate file content after upload (server-side)
- Use toast notifications for errors (Shadcn UI)

---

### Story 2.5: Library View with Uploaded Books

As a user,
I want to view all my uploaded books in a library,
So that I can see what PDFs I have added to the system.

**Acceptance Criteria:**

**Given** books have been uploaded to the system
**When** I navigate to the library page
**Then** all uploaded books are displayed in a grid or list view
**And** each book shows its title (or filename if title not available yet)
**And** each book shows its processing status (PROCESSING, READY, ERROR)
**And** books with status PROCESSING show a "Processing..." indicator
**And** books with status ERROR show an error indicator
**And** books are sorted by upload date (newest first)
**And** the library updates automatically when new books are uploaded
**And** empty library shows a helpful "Upload your first PDF" message

**Technical Notes:**
- Use GET /api/books endpoint
- Use React Query for data fetching and auto-refresh
- Display using existing UI components

---

### Story 2.6: Delete Book from Library

As a user,
I want to delete books from my library,
So that I can remove PDFs I no longer need.

**Acceptance Criteria:**

**Given** books exist in my library
**When** I click a delete button on a book
**Then** a confirmation dialog appears asking "Delete this book?"
**And** confirming the deletion removes the book from the database
**And** the original PDF file is deleted from storage
**And** all associated chapter records are deleted (cascade)
**And** the book is removed from the library view immediately
**And** I see a success message "Book deleted successfully"
**And** canceling the dialog keeps the book intact
**And** deletion works for books in any status (PROCESSING, READY, ERROR)

**Technical Notes:**
- Implement DELETE /api/books/[id] endpoint
- Use Prisma cascade delete for chapters
- Use StorageService to delete PDF file
- Optimistic UI update

---

## Epic 3: PDF Processing Pipeline

**Goal:** Background PDF processing with real-time progress updates, enabling automated text extraction and content preparation.

**Functional Requirements:** FR1.2 (Upload Processing), FR2.1 (Text Extraction), FR2.2 (Visual Content), FR2.3 (Content Conversion), FR6.3 (Progress State)

### Story 3.1: Job Queue System

As a developer,
I want to implement a job queue system for PDF processing,
So that uploads can be processed in the background without blocking the UI.

**Acceptance Criteria:**

**Given** BullMQ is configured
**When** I create the job queue infrastructure
**Then** a ProcessingJob model exists in the database schema
**And** ProcessingJob includes: id, bookId, type, status, progress, error, createdAt, completedAt
**And** job types include: UPLOAD, EXTRACT, AI, CONVERT
**And** job statuses include: PENDING, ACTIVE, COMPLETED, FAILED
**And** I can create a job record when a book is uploaded
**And** jobs are added to the BullMQ queue
**And** I can query job status by jobId
**And** the database migration runs successfully

**Technical Notes:**
- Extend Prisma schema with ProcessingJob model
- Create JobService for queue operations
- Foreign key relationship to Book

---

### Story 3.2: PDF Extraction Worker

As a developer,
I want to implement a worker that extracts text content from PDFs,
So that book content can be processed and stored.

**Acceptance Criteria:**

**Given** the job queue system exists
**When** a pdf-extraction job is processed
**Then** the worker loads the PDF file from storage
**And** text content is extracted using pdf-parse
**And** text structure is preserved (paragraphs, headings, lists)
**And** page breaks are identified and marked
**And** extracted text is stored temporarily (in memory or temp file)
**And** the job progress updates to 100% when extraction completes
**And** job status changes to COMPLETED on success
**And** job status changes to FAILED with error message on failure
**And** extraction works for typical technical PDFs (200-400 pages)

**Technical Notes:**
- Install and use `pdf-parse` library
- Store extracted text for next job in chain
- Handle large PDFs with streaming if needed

---

### Story 3.3: Image and Table Extraction

As a user,
I want images and tables from PDFs to be preserved,
So that I can see visual content when reading.

**Acceptance Criteria:**

**Given** text extraction is working
**When** the extraction worker processes a PDF with images and tables
**Then** images are extracted from the PDF
**And** images are saved to storage at `/storage/images/{bookId}/`
**And** image references in text are marked with placeholders
**And** tables are detected and extracted with structure preserved
**And** table data is marked up with basic HTML table tags
**And** the extraction job tracks progress: text (33%), images (66%), tables (100%)
**And** extraction completes successfully even if no images/tables exist
**And** common image formats (PNG, JPEG) are supported

**Technical Notes:**
- Use pdf.js for image extraction
- Save images with sequential naming: image-1.png, image-2.png
- Replace image locations with markers like `[IMAGE:image-1.png]`

---

### Story 3.4: Content Conversion to HTML

As a developer,
I want to convert extracted PDF content to clean HTML,
So that it can be rendered in the reading interface.

**Acceptance Criteria:**

**Given** PDF content has been extracted
**When** the content-conversion job processes the text
**Then** plain text is converted to HTML with proper tags
**And** headings are wrapped in `<h1>`, `<h2>`, etc. based on size/style
**And** paragraphs are wrapped in `<p>` tags
**And** lists are converted to `<ul>` or `<ol>` tags
**And** images are embedded as `<img>` tags with correct src paths
**And** tables remain as `<table>` HTML elements
**And** code blocks are wrapped in `<pre><code>` tags
**And** the HTML is sanitized to prevent XSS
**And** converted HTML is stored in the Chapter.content field

**Technical Notes:**
- Use markdown-to-HTML library or custom converter
- Sanitize HTML with library like `DOMPurify`
- Handle edge cases: empty paragraphs, malformed structure

---

### Story 3.5: Job Chain Orchestration

As a developer,
I want jobs to execute in sequence (extract → AI → convert),
So that PDF processing happens automatically after upload.

**Acceptance Criteria:**

**Given** individual job workers exist
**When** a book is uploaded
**Then** the system creates an EXTRACT job immediately
**And** the EXTRACT job completes and automatically creates an AI job
**And** the AI job completes and automatically creates a CONVERT job
**And** the CONVERT job completes and updates book status to READY
**And** each job updates its ProcessingJob record with progress
**And** if any job fails, the chain stops and book status becomes ERROR
**And** failed jobs can be retried manually
**And** the entire process completes within 2-3 minutes for typical books

**Technical Notes:**
- Implement job chaining in BullMQ workers
- Each job creates the next job on completion
- Handle failure states gracefully

---

### Story 3.6: Real-Time Progress Updates (SSE)

As a user,
I want to see real-time progress updates while my PDF is processing,
So that I know the system is working and can estimate completion time.

**Acceptance Criteria:**

**Given** a PDF is being processed
**When** I view the library or upload page
**Then** I see a progress bar showing overall processing status
**And** progress updates automatically without page refresh
**And** progress shows specific stages: "Extracting text...", "Analyzing content...", "Converting..."
**And** progress percentage updates from 0% to 100%
**And** when processing completes, status changes to "Ready"
**And** if processing fails, I see an error message with details
**And** progress updates continue even if I navigate to other pages
**And** updates are delivered via Server-Sent Events (SSE)

**Technical Notes:**
- Implement GET /api/jobs/[id]/progress SSE endpoint
- Frontend subscribes using EventSource API
- BullMQ emits progress events that SSE streams to client

---

### Story 3.7: Processing Error Recovery

As a user,
I want to retry processing if a PDF fails,
So that temporary issues don't permanently block my book from being added.

**Acceptance Criteria:**

**Given** a PDF processing job has failed
**When** I view the failed book in the library
**Then** I see an error indicator with the failure reason
**And** a "Retry Processing" button is available
**And** clicking retry restarts the job chain from the failed step
**And** the book status changes back to PROCESSING
**And** progress tracking resumes
**And** if the retry succeeds, the book becomes READY
**And** if the retry fails again, I can retry up to 3 times
**And** after 3 failures, I can delete the book and re-upload

**Technical Notes:**
- Store last failed job type in Book model
- Retry from the failed step (don't restart extraction if AI failed)
- Implement retry counter to limit attempts

---

### Story 3.8: Background Processing Persistence

As a user,
I want PDF processing to continue even if I close my browser,
So that I don't have to keep the page open for long uploads.

**Acceptance Criteria:**

**Given** a PDF is processing in the background
**When** I close the browser tab or window
**Then** the BullMQ worker continues processing server-side
**And** the job continues through the full chain (extract → AI → convert)
**And** when I return to the application, the processing status is current
**And** completed books show as READY when I reload the page
**And** failed jobs show error status when I reload the page
**And** I can see accurate progress if processing is still ongoing
**And** no data is lost during browser closure

**Technical Notes:**
- BullMQ runs server-side, independent of client
- ProcessingJob records persist in database
- Client re-subscribes to job progress on page load

---

## Epic 4: AI-Powered Book Metadata

**Goal:** AI-generated summaries and intelligent chapter detection using Mastra, enabling automated book organization.

**Functional Requirements:** FR3.1 (Book Metadata), FR3.2 (Chapter Detection), FR3.3 (Processing Quality)

### Story 4.1: Mastra AI Integration

As a developer,
I want to integrate Mastra AI into the processing pipeline,
So that I can generate book metadata automatically.

**Acceptance Criteria:**

**Given** the job queue system is working
**When** I install and configure Mastra SDK
**Then** Mastra API key is stored securely in environment variables
**And** MastraService is created with methods: generateSummary, detectChapters, extractMetadata
**And** I can make a test API call to Mastra successfully
**And** API errors are caught and logged appropriately
**And** rate limits and retries are handled gracefully
**And** Mastra calls are made server-side only (never from client)
**And** the service includes proper TypeScript types

**Technical Notes:**
- Install Mastra SDK
- Configure MASTRA_API_KEY in .env
- Create service in `/lib/services/mastra.ts`

---

### Story 4.2: Book Summary Generation

As a user,
I want AI to generate a summary of my uploaded book,
So that I can quickly understand what the book is about.

**Acceptance Criteria:**

**Given** PDF text has been extracted
**When** the AI job processes the book
**Then** the first 5000 words (or full book if shorter) are sent to Mastra
**And** Mastra generates a 2-3 paragraph summary
**And** the summary is saved to the Book.summary field
**And** the summary is factual and relevant to the book content
**And** the summary appears in the library book card
**And** summary generation completes within 30 seconds
**And** if summary generation fails, a generic summary is used: "Summary unavailable"
**And** the job continues even if summary generation fails

**Technical Notes:**
- Send first 5000 words to avoid token limits
- Prompt engineering: "Generate a concise 2-3 paragraph summary of this book"
- Handle API failures gracefully

---

### Story 4.3: Chapter Boundary Detection

As a user,
I want chapters to be automatically detected from the PDF,
So that I can navigate through the book by chapter.

**Acceptance Criteria:**

**Given** PDF text has been extracted
**When** the AI job analyzes the book structure
**Then** Mastra identifies chapter boundaries intelligently
**And** chapter breaks are detected based on headings, page breaks, and content patterns
**And** each detected chapter is saved as a separate Chapter record
**And** chapters are numbered sequentially (1, 2, 3, ...)
**And** chapter titles are extracted from headings
**And** if no chapters are detected, the entire book is one chapter titled "Full Book"
**And** chapter detection works for most technical books
**And** chapter text content is assigned to the correct Chapter record

**Technical Notes:**
- Use Mastra to analyze structure and find chapter boundaries
- Fallback: create single chapter if detection fails
- Split extracted text based on detected boundaries

---

### Story 4.4: Chapter Metadata Calculation

As a user,
I want to see metadata for each chapter (word count, reading time),
So that I can plan my reading sessions.

**Acceptance Criteria:**

**Given** chapters have been detected and created
**When** the system calculates chapter metadata
**Then** word count is calculated for each chapter
**And** reading time is estimated at 200 words per minute
**And** start and end page numbers are assigned to each chapter (if available)
**And** chapter metadata is saved to the database
**And** chapter metadata is displayed in the chapter list UI
**And** total book word count is sum of all chapter word counts
**And** total book reading time is sum of all chapter reading times

**Technical Notes:**
- Word count: split by whitespace and count
- Reading time: wordCount / 200 (average reading speed)
- Store in Chapter model fields

---

### Story 4.5: Book Title and Author Detection

As a user,
I want the system to detect the book title and author,
So that my library shows accurate book information.

**Acceptance Criteria:**

**Given** a PDF has been uploaded
**When** the AI job extracts metadata
**Then** the system first checks PDF metadata for title and author
**And** if PDF metadata is missing, Mastra analyzes the first few pages to detect title
**And** if PDF metadata is missing, Mastra analyzes the first few pages to detect author
**And** detected title is saved to Book.title
**And** detected author is saved to Book.author
**And** if no title is detected, the filename (without .pdf) is used
**And** if no author is detected, author is left empty
**And** title and author appear in the library view

**Technical Notes:**
- Use pdf-parse to check PDF metadata first
- Fallback to AI analysis of first 2-3 pages
- Prompt: "Identify the book title and author from this text"

---

## Epic 5: Library Management

**Goal:** Browse and manage book collection with search and filtering capabilities.

**Functional Requirements:** FR4.1 (Book Library), FR4.2 (Book Actions), FR6.1 (Database Storage)

### Story 5.1: Book Library API

As a developer,
I want to create API endpoints for book management,
So that the frontend can fetch and display library data.

**Acceptance Criteria:**

**Given** the Book model exists in the database
**When** I implement the books API
**Then** GET /api/books returns all books with metadata
**And** GET /api/books/[id] returns a single book with all chapters
**And** books are returned sorted by createdAt descending (newest first)
**And** book response includes: id, title, author, summary, status, wordCount, readingTimeMinutes, createdAt
**And** chapter response includes: id, chapterNumber, title, wordCount, startPage, endPage
**And** API returns proper HTTP status codes (200, 404, 500)
**And** API handles database errors gracefully
**And** responses include proper CORS headers

**Technical Notes:**
- Use Prisma to query books and chapters
- Include chapter count in book list response
- Paginate if needed (future enhancement)

---

### Story 5.2: Library Grid View

As a user,
I want to see my books displayed in an attractive grid layout,
So that I can browse my collection visually.

**Acceptance Criteria:**

**Given** books exist in the database
**When** I navigate to the library page
**Then** books are displayed in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)
**And** each book card shows: title, author, summary (truncated), status badge
**And** book cards have a placeholder cover image (since PDFs don't have covers in MVP)
**And** processing books show a pulsing "Processing" badge
**And** ready books show a "Ready" badge or no badge
**And** error books show a red "Error" badge
**And** hovering over a book card highlights it
**And** clicking a book card navigates to the book overview page

**Technical Notes:**
- Use existing Shadcn UI Card component
- Implement with CSS Grid or Flexbox
- Truncate summary to 150 characters with "..."

---

### Story 5.3: Book Overview Page

As a user,
I want to view detailed information about a book,
So that I can see all metadata and navigate to reading.

**Acceptance Criteria:**

**Given** a book exists with status READY
**When** I click on a book in the library
**Then** I navigate to /books/[bookId] overview page
**And** the page displays: title, author, full summary, word count, reading time
**And** a list of all chapters is shown with chapter numbers and titles
**And** each chapter shows its word count and estimated reading time
**And** clicking a chapter navigates to the reading view for that chapter
**And** a "Start Reading" button navigates to the first chapter
**And** a "Delete Book" button is available with confirmation
**And** if the book is still processing, a message says "Processing in progress..."

**Technical Notes:**
- Use GET /api/books/[id] to fetch book data
- Display chapter list as ordered list or table
- Use existing UI components

---

### Story 5.4: Book Search and Filter

As a user,
I want to search for books by title or author,
So that I can quickly find specific books in my library.

**Acceptance Criteria:**

**Given** multiple books exist in the library
**When** I type in the search box at the top of the library
**Then** the book list filters in real-time as I type
**And** books are filtered by title (case-insensitive partial match)
**And** books are filtered by author (case-insensitive partial match)
**And** if no books match, I see "No books found" message
**And** clearing the search shows all books again
**And** search works immediately without requiring Enter key
**And** search box has placeholder text "Search by title or author..."

**Technical Notes:**
- Client-side filtering for MVP (simple and fast)
- Use debounced search input for performance
- Future: server-side search with database query

---

### Story 5.5: Library Status Filters

As a user,
I want to filter books by processing status,
So that I can see only ready books, processing books, or failed books.

**Acceptance Criteria:**

**Given** books exist with different statuses
**When** I click status filter buttons (All, Ready, Processing, Error)
**Then** the library shows only books matching the selected status
**And** "All" shows all books regardless of status
**And** "Ready" shows only books with status READY
**And** "Processing" shows only books with status PROCESSING
**And** "Error" shows only books with status ERROR
**And** the active filter is visually highlighted
**And** filter selection persists when searching
**And** book count for each filter is displayed (e.g., "Ready (5)")

**Technical Notes:**
- Combine with search filter (both apply simultaneously)
- Use Zustand to store active filter state
- Update UI reactively

---

### Story 5.6: Reading Progress Tracking

As a user,
I want to see my reading progress for each book,
So that I know which books I've started and how far I've read.

**Acceptance Criteria:**

**Given** I have read chapters from a book
**When** I view the library or book overview
**Then** each book shows a progress percentage (0-100%)
**And** progress is calculated as: (chapters read / total chapters) × 100
**And** a progress bar visualizes the percentage
**And** book cards in the library show the progress bar
**And** the book overview page shows: "Progress: 3 of 10 chapters (30%)"
**And** progress updates automatically as I read chapters
**And** unread books show 0% progress
**And** fully read books show 100% progress

**Technical Notes:**
- Use ReadingProgress model to track which chapters are read
- A chapter is "read" if ReadingProgress record exists
- Update progress bar component with percentage

---

## Epic 6: Reading Experience

**Goal:** Read books with chapter navigation, clean formatting, and progress tracking.

**Functional Requirements:** FR5.1 (Content Display), FR5.2 (Chapter Navigation), FR5.3 (Reading Interface), FR6.3 (Progress State)

### Story 6.1: Chapter Content Rendering

As a user,
I want to read chapter content in a clean, formatted view,
So that I can comfortably read my PDFs.

**Acceptance Criteria:**

**Given** a book has been processed and is READY
**When** I navigate to /books/[bookId]/chapters/[chapterId]
**Then** the chapter content is displayed with proper HTML rendering
**And** headings are styled distinctly (larger, bold)
**And** paragraphs have appropriate spacing
**And** lists are formatted with bullets or numbers
**And** images are displayed inline at correct positions
**And** tables are rendered with visible borders and spacing
**And** code blocks use monospace font and background color
**And** text is readable with good typography (font size 16-18px, line height 1.6)
**And** content is responsive and readable on mobile devices

**Technical Notes:**
- Render Chapter.content HTML directly
- Apply typography styles via Tailwind prose classes
- Sanitize HTML to prevent XSS

---

### Story 6.2: Chapter Navigation Controls

As a user,
I want to navigate between chapters easily,
So that I can read through the book sequentially.

**Acceptance Criteria:**

**Given** I am reading a chapter
**When** I view the reading interface
**Then** a "Previous Chapter" button appears if not on first chapter
**And** a "Next Chapter" button appears if not on last chapter
**And** clicking "Next Chapter" navigates to the next sequential chapter
**And** clicking "Previous Chapter" navigates to the previous chapter
**And** keyboard shortcuts work: Arrow Right = next, Arrow Left = previous
**And** current chapter is highlighted in the chapter list sidebar
**And** chapter navigation is smooth without page flicker
**And** buttons are disabled (grayed out) when at book boundaries

**Technical Notes:**
- Store chapters in order by chapterNumber
- Fetch current chapter and determine prev/next by number
- Implement keyboard event listeners

---

### Story 6.3: Chapter List Sidebar

As a user,
I want to see a sidebar with all chapters while reading,
So that I can jump to any chapter directly.

**Acceptance Criteria:**

**Given** I am reading a book
**When** the reading view is displayed
**Then** a sidebar shows all chapters for the current book
**And** chapters are listed in order with number and title
**And** the currently active chapter is highlighted
**And** clicking a chapter in the sidebar navigates to that chapter
**And** the sidebar is collapsible on mobile devices
**And** chapter titles are truncated if too long (with ...)
**And** the sidebar shows chapter word counts and reading times
**And** the sidebar remains visible while scrolling chapter content

**Technical Notes:**
- Use sticky positioning for sidebar
- Highlight active chapter with background color
- Mobile: collapse to hamburger menu

---

### Story 6.4: Reading Position Persistence

As a user,
I want my reading position to be saved automatically,
So that I can resume reading where I left off.

**Acceptance Criteria:**

**Given** I am reading a chapter
**When** I scroll through the content
**Then** my scroll position is saved automatically every 5 seconds
**And** when I navigate away and return, I resume at my last position
**And** when I close the browser and reopen, I resume at my last position
**And** the last read chapter is marked in the ReadingProgress table
**And** the book overview shows which chapter I'm currently on
**And** the library shows my overall progress percentage
**And** reading position is saved even if I don't finish the chapter
**And** position tracking is per-chapter (each chapter remembers scroll position)

**Technical Notes:**
- Create/update ReadingProgress record with scroll position
- Use IntersectionObserver or scroll event listener
- Debounce position updates to avoid excessive DB writes
- On component mount, restore scroll position from DB

---

### Story 6.5: Reading Mode Customization

As a user,
I want to adjust reading preferences like font size and theme,
So that I can read comfortably according to my preferences.

**Acceptance Criteria:**

**Given** I am reading a chapter
**When** I open the reading settings menu
**Then** I can select font size: Small (14px), Medium (16px), Large (18px), Extra Large (20px)
**And** I can select theme: Light, Sepia, Dark
**And** font size changes apply immediately to chapter content
**And** theme changes apply immediately to the reading view
**And** my preferences are saved to localStorage
**And** preferences persist across browser sessions
**And** preferences apply to all books and chapters
**And** default settings are: Medium font, Light theme

**Technical Notes:**
- Store preferences in Zustand + localStorage
- Apply via CSS classes or inline styles
- Dark theme: dark background, light text

---

### Story 6.6: Reading Statistics

As a user,
I want to see reading statistics while reading,
So that I know how much time the chapter will take.

**Acceptance Criteria:**

**Given** I am reading a chapter
**When** the chapter content is displayed
**Then** the header shows: "Chapter [number]: [title]"
**And** the header shows: "[wordCount] words · [readingTime] min read"
**And** a progress indicator shows how far I've scrolled in the current chapter
**And** the progress indicator updates in real-time as I scroll
**And** at the end of the chapter, I see: "Chapter completed! Continue to next chapter?"
**And** clicking "Continue" navigates to the next chapter automatically
**And** chapter completion is tracked in ReadingProgress

**Technical Notes:**
- Calculate scroll percentage: (scrollTop / scrollHeight) × 100
- Display as progress bar at top of reading view
- Mark chapter as "completed" when scroll reaches 90%+

---

