---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-11-complete']
inputDocuments: ['docs/index.md', 'docs/project-overview.md', 'docs/architecture.md']
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 3
classification:
  projectType: web_app
  domain: edtech
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - deepread

**Author:** Francisco
**Date:** 2026-01-13

## Executive Summary

**Project:** Deepread MVP - PDF Reading Platform
**Type:** Web Application (Next.js)
**Status:** Brownfield Enhancement - Adding Backend & Core Functionality

### Overview

Deepread is an AI-powered PDF reading platform that transforms static PDF books into an organized, interactive reading experience. This PRD defines the MVP scope: building the foundational backend infrastructure to enable PDF upload, intelligent processing, and structured reading - setting the stage for future learning tools (notes, highlights, AI chat).

### Current State

- ✅ Complete UI implementation (Next.js + React + Shadcn/UI)
- ✅ Component library and routing
- ✅ Mock data and frontend architecture
- ❌ No backend, database, or PDF processing
- ❌ No AI integration or data persistence

### MVP Goal

Transform the frontend shell into a functional PDF reading application by implementing:
1. **PDF Upload & Processing** - Real upload, parsing, and content extraction
2. **AI Metadata Generation** - Auto-detect chapters, generate summaries (Mastra AI)
3. **Data Persistence** - Database + file storage for books and chapters
4. **Reading Experience** - Display parsed content with clean formatting
5. **Library Management** - Organize and track uploaded books

### Key Differentiators

- **AI-Powered Metadata** - Automatic chapter detection and book summaries
- **Structured Content** - PDFs parsed to HTML/markdown for better reading
- **Background Processing** - Non-blocking uploads with progress tracking
- **Foundation for Learning** - Architecture supports Phase 2 interactive features

### Success Metric

User can upload a PDF, it processes automatically with AI-generated metadata, and they can read it in a clean interface - "it just works" for basic reading flow.

### Post-MVP Vision

Phase 2: Highlights, notes, AI conversational assistant
Phase 3: Authentication, multi-device sync, advanced features

---

## Success Criteria

### User Success

**Core Experience:**
- User uploads a PDF and it processes without errors
- Book appears in library with accurate metadata (title, author, AI-generated summary)
- Chapters are automatically detected and organized in a usable way
- Reading experience is clean and legible:
  - Text is readable and properly formatted
  - Images are embedded and visible
  - Tables maintain their structure
  - Special formatting (headings, lists, etc.) is preserved
- Processing time is reasonable for typical books (not waiting 10+ minutes)

**Success Moment:**
User can upload their first PDF and start reading it with minimal friction - the app "just works" for the basic reading flow.

### Business Success

**Personal Project Metrics:**
- App is stable enough for daily personal use
- Foundation is solid for Phase 2 features (AI chat, notes, highlights)
- Learning experience validates technical approach for PDF processing and AI integration

### Technical Success

**Core Functionality:**
- PDF upload and parsing completes without crashing
- Structured content (text, images, tables) is extracted from PDFs
- AI (Mastra) successfully generates metadata during upload workflow
- All data persists in database (survives page reloads)
- App remains responsive during PDF processing
- Memory usage stays reasonable (doesn't consume excessive RAM)

**Infrastructure:**
- Database schema supports current MVP needs
- File storage handles PDF uploads reliably
- AI integration with Mastra works for metadata generation

### Measurable Outcomes

- **PDF Processing:** Standard book (200-400 pages) processes in under 2-3 minutes
- **Content Quality:** 90%+ of text extracted correctly, images and tables preserved
- **Chapter Detection:** AI correctly identifies chapter boundaries in most books
- **Metadata Accuracy:** Generated summaries are relevant and useful
- **Stability:** No crashes during upload/parsing flow

## Product Scope

### MVP - Minimum Viable Product

**Must Have:**
1. **PDF Upload System**
   - File upload with validation (PDF only, reasonable size limits)
   - Real-time upload progress tracking
   - Multi-file upload support (background processing)

2. **PDF Processing Pipeline**
   - Extract text content with structure preservation
   - Extract images and embed them in content
   - Parse tables and maintain formatting
   - Convert to HTML/markdown for rendering

3. **AI Metadata Generation (Mastra)**
   - Auto-generate book title and author (if not obvious)
   - Create book summary
   - Intelligent chapter detection and separation
   - Generate technical metadata (word count, reading time estimates)

4. **Data Persistence**
   - Database for books, chapters, and metadata
   - File storage for original PDFs
   - All data survives page reloads

5. **Reading Experience**
   - Display parsed content in reading view (similar to current mockup)
   - Navigate between chapters
   - Preserve visual elements (images, tables, formatting)
   - Responsive design (desktop focus, mobile functional)

6. **Library Management**
   - View all uploaded books
   - Display progress indicators
   - Remove books from library

### Growth Features (Post-MVP)

**Phase 2 - Interactive Learning Tools:**
- Text selection and highlighting
- Note-taking on specific passages
- AI conversational assistant (chat with book context)
- Comprehension tests/quizzes
- Search within books
- Progress tracking across reading sessions

**Phase 3 - User Experience:**
- User authentication and accounts
- Multi-device sync
- Advanced reading preferences (themes, fonts, layout)
- Reading statistics and analytics
- Book recommendations

### Vision (Future)

- Multi-user support and sharing
- Collaborative reading and annotations
- Spaced repetition system for retention
- Integration with external learning tools
- Mobile native apps
- OCR support for scanned PDFs
- Audio narration integration
- Export notes and highlights

## User Journeys

### Journey 1: Francisco - First PDF Upload & Read

**Opening Scene:**
Francisco has technical PDFs he wants to read but hates reading in normal PDF readers - no organization, no progress tracking, no way to leverage AI for understanding.

**Rising Action:**
1. Opens Deepread and uploads "Designing Data-Intensive Applications" PDF (400 pages)
2. App shows real-time processing progress in background
3. Book appears in library with AI-generated summary and auto-detected chapters
4. Clicks on book → sees organized chapter list
5. Clicks Chapter 1 → reading view displays clean, structured content
6. Images and tables are preserved and readable
7. Navigates between chapters easily
8. Progress is saved automatically

**Climax:**
Content renders cleanly, navigation works smoothly, and Francisco realizes "this is actually usable - I can finally read this book properly."

**Resolution:**
Francisco now has a functional PDF reading system. Books are organized, metadata is useful, and the foundation is ready for Phase 2 features (notes, highlights, AI chat).

### Journey 2: Francisco - Multi-Upload Edge Case

**Scenario:**
Francisco wants to upload 3 books at once while the first one is still processing.

**Flow:**
1. Uploads first PDF → processing starts
2. Uploads 2 more PDFs while first is processing
3. All 3 process in background with independent progress bars
4. Can close browser and come back - processing continues server-side
5. Returns to see all 3 books completed and in library

**Error Recovery:**
- If PDF is corrupted → clear error message, upload fails gracefully
- If processing fails → retry option or remove failed upload
- If browser closes mid-upload → resume or restart on return

### Journey Requirements Summary

**Capabilities Revealed:**

1. **PDF Upload & Validation**
   - File type validation (PDF only)
   - Size limit enforcement
   - Multi-file upload support
   - Background processing

2. **Processing Pipeline**
   - Text extraction with structure
   - Image and table preservation
   - AI metadata generation (Mastra)
   - Chapter detection
   - Progress tracking

3. **Data Persistence**
   - Database for books/chapters/metadata
   - File storage for PDFs
   - Progress state management
   - Recovery from interruptions

4. **Reading Experience**
   - Clean content rendering
   - Chapter navigation
   - Visual element display (images, tables)
   - Responsive layout

5. **Error Handling**
   - Corrupted file detection
   - Processing failure recovery
   - Clear error messaging
   - Retry mechanisms

## Technical Requirements

### Web Application Specifications

**Architecture:**
- Single Page Application (SPA) using Next.js App Router
- Client-side rendering with React 19
- Server-side API routes for backend logic

**Browser Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Desktop-first focus with mobile functional support
- No IE11 support required

**SEO Requirements:**
- Not applicable (personal use application)
- No public-facing pages requiring search indexing

**Real-Time Features:**
- WebSocket or polling for upload progress tracking
- Live processing status updates
- Background job status monitoring

**Accessibility:**
- WCAG 2.1 Level AA baseline (Shadcn/UI provides good defaults)
- Keyboard navigation support
- Screen reader compatibility for core flows
- Semantic HTML structure

**Performance Targets:**
- Initial page load: < 2 seconds
- Time to interactive: < 3 seconds
- PDF processing: 2-3 minutes for 200-400 page books
- Smooth 60fps UI interactions

## Functional Requirements

### FR1: PDF Upload & Management

**FR1.1 - File Upload**
- User can select and upload PDF files from local filesystem
- System validates file type (PDF only)
- System enforces file size limits (prevent excessive uploads)
- User can upload multiple PDFs simultaneously
- System provides real-time upload progress indication

**FR1.2 - Upload Processing**
- System processes PDFs in background (non-blocking)
- User can continue using application while PDFs process
- System tracks processing status for each uploaded file
- User receives notification when processing completes
- Processing continues if user closes browser (server-side)

**FR1.3 - Error Handling**
- System detects and reports corrupted PDF files
- User receives clear error messages for failed uploads
- User can retry failed uploads
- User can cancel in-progress uploads
- System provides option to remove failed uploads

### FR2: PDF Processing & Content Extraction

**FR2.1 - Text Extraction**
- System extracts text content from PDF with structure preservation
- System identifies and preserves headings, paragraphs, and lists
- System maintains reading order and text flow
- System handles multi-column layouts appropriately

**FR2.2 - Visual Content Extraction**
- System extracts images from PDF
- System embeds images inline with text content
- System extracts and formats tables
- System preserves special formatting (bold, italics, code blocks)

**FR2.3 - Content Conversion**
- System converts extracted content to HTML/markdown format
- System generates renderable structured content
- System ensures content is responsive and readable

### FR3: AI-Powered Metadata Generation

**FR3.1 - Book Metadata**
- System auto-generates book title (if not in PDF metadata)
- System auto-detects book author
- System generates book summary using AI (Mastra)
- System calculates total word count
- System estimates total reading time

**FR3.2 - Chapter Detection**
- System intelligently detects chapter boundaries using AI
- System generates chapter titles
- System creates chapter list with proper ordering
- System calculates word count per chapter
- System estimates reading time per chapter

**FR3.3 - Processing Quality**
- AI generates relevant and accurate book summaries
- Chapter detection works for most technical books
- Metadata generation completes within processing time budget

### FR4: Library Management

**FR4.1 - Book Library**
- User can view all uploaded books in library
- System displays book metadata (title, author, summary, cover)
- System shows processing status for each book
- System displays reading progress indicators
- User can access book overview from library

**FR4.2 - Book Actions**
- User can remove books from library
- User can navigate to book overview
- User can see upload/processing timestamp
- System persists library state across sessions

### FR5: Reading Experience

**FR5.1 - Content Display**
- User can read parsed book content in reading view
- System displays content with clean, readable formatting
- System renders images inline with text
- System displays tables with preserved structure
- System applies appropriate typography and spacing

**FR5.2 - Chapter Navigation**
- User can navigate between chapters sequentially (prev/next)
- User can jump to specific chapter from chapter list
- System displays current chapter context
- System preserves reading position within chapter

**FR5.3 - Reading Interface**
- System provides responsive reading layout (desktop + mobile)
- User can view book in full reading mode
- System maintains consistent UI similar to existing mockup
- Reading view provides distraction-free experience

### FR6: Data Persistence

**FR6.1 - Database Storage**
- System stores book metadata in database
- System stores chapter content and metadata
- System persists all user data across page reloads
- Database supports current MVP data schema

**FR6.2 - File Storage**
- System stores original PDF files
- System maintains file references for uploaded books
- File storage supports reliable upload and retrieval

**FR6.3 - Progress State**
- System saves reading position
- System tracks processing state for uploads
- System maintains upload queue state
- System supports recovery from interruptions

## Non-Functional Requirements

### NFR1: Performance

**NFR1.1 - Page Load Performance**
- Initial page load completes in under 2 seconds on standard broadband
- Time to interactive under 3 seconds
- Application feels responsive to user interactions (60fps UI)

**NFR1.2 - Processing Performance**
- PDF processing completes within 2-3 minutes for 200-400 page books
- System remains responsive during background processing
- Multiple PDFs can process concurrently without blocking

**NFR1.3 - Reading Performance**
- Chapter rendering is instantaneous (< 500ms)
- Smooth scrolling and navigation (no jank)
- Image loading doesn't block text rendering

### NFR2: Reliability

**NFR2.1 - Data Durability**
- All uploaded books and metadata persists across sessions
- No data loss during processing failures
- System recovers gracefully from interruptions

**NFR2.2 - Processing Reliability**
- System handles corrupted PDFs without crashing
- Clear error reporting for failed operations
- Automatic retry mechanisms for transient failures

**NFR2.3 - Application Stability**
- No crashes during normal operation
- Memory usage stays within reasonable bounds
- Background jobs complete reliably

### NFR3: Usability

**NFR3.1 - Ease of Use**
- First-time user can upload and read a book without instructions
- UI is intuitive and follows platform conventions
- Error messages are clear and actionable

**NFR3.2 - Accessibility**
- WCAG 2.1 Level AA baseline compliance
- Keyboard navigation for all core functions
- Screen reader compatible for primary flows
- Semantic HTML structure

**NFR3.3 - Responsiveness**
- Desktop-optimized experience (primary use case)
- Mobile functional (reading and basic navigation work)
- Adaptive layouts for different screen sizes

### NFR4: Maintainability

**NFR4.1 - Code Quality**
- TypeScript strict mode throughout
- Consistent code style and conventions
- Clear separation of concerns (components, logic, data)

**NFR4.2 - Technology Stack**
- Use existing Next.js + React + Zustand architecture
- Leverage established libraries (Shadcn/UI, Tailwind)
- Minimize external dependencies

**NFR4.3 - Development Experience**
- Fast development iteration (hot reload)
- Clear error messages during development
- Easy to test and debug

### NFR5: Scalability (Personal Use)

**NFR5.1 - Data Volume**
- System handles library of 50-100 books comfortably
- Individual books up to 1000 pages supported
- No artificial limits on content storage

**NFR5.2 - Concurrent Processing**
- Support 3-5 PDFs processing simultaneously
- Queue management for bulk uploads
- No blocking of other operations during processing

**NFR5.3 - Future Extensibility**
- Architecture supports adding Phase 2 features (notes, highlights, AI chat)
- Database schema designed for growth
- API structure allows for future enhancements

### NFR6: Security (Basic)

**NFR6.1 - Data Privacy**
- PDF content stored locally (not shared externally)
- No telemetry or tracking of reading behavior
- User data remains on user's system

**NFR6.2 - File Security**
- Validate PDF files before processing
- Prevent malicious file uploads
- Secure file storage (no public access)

**NFR6.3 - Future Auth Considerations**
- Architecture ready for authentication in Phase 3
- Secure session management when multi-user support added
- No security vulnerabilities in current single-user implementation

