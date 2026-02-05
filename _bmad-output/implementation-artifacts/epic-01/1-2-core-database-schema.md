# Story 1.2: Core Database Schema

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to create the initial database schema for books, chapters, and reading progress,
So that I can store uploaded PDF metadata, content, and user reading state.

## Acceptance Criteria

**Given** Prisma is configured and connected to SQLite
**When** I define the database models in the Prisma schema
**Then** the Book model includes fields: id, title, author, summary, pdfPath, totalPages, wordCount, status, createdAt, updatedAt
**And** the Chapter model includes fields: id, bookId, chapterNumber, title, content, wordCount, startPage, endPage
**And** the ReadingProgress model includes fields: id, bookId, chapterId, position, lastReadAt
**And** proper relationships are defined (Book has many Chapters and ReadingProgress records)
**And** cascading deletes are configured (deleting Book deletes its Chapters and ReadingProgress)
**And** ReadingProgress has unique constraint on (bookId, chapterId)
**And** the migration runs successfully with `npx prisma migrate dev`
**And** I can create test records using Prisma Client

## Tasks / Subtasks

- [ ] Update Prisma schema with Book model (AC: Book model fields)
  - [ ] Add Book model with all required fields
  - [ ] Add BookStatus enum (PROCESSING, READY, ERROR)
  - [ ] Configure indexes on status and createdAt fields
  - [ ] Add readingTimeMinutes calculated field

- [ ] Update Prisma schema with Chapter model (AC: Chapter model fields)
  - [ ] Add Chapter model with all required fields
  - [ ] Add foreign key relationship to Book with cascade delete
  - [ ] Add composite index on (bookId, chapterNumber)
  - [ ] Use @db.Text for content field (large content storage)

- [ ] Update Prisma schema with ReadingProgress model (AC: ReadingProgress model fields)
  - [ ] Add ReadingProgress model with all required fields
  - [ ] Add foreign key relationship to Book with cascade delete
  - [ ] Add unique constraint on (bookId, chapterId)
  - [ ] Configure lastReadAt with @updatedAt

- [ ] Create and apply database migration (AC: Migration successful)
  - [ ] Run `npx prisma migrate dev --name add-core-models`
  - [ ] Verify migration file is created
  - [ ] Verify migration applies successfully
  - [ ] Check database with `npx prisma studio`

- [ ] Test database schema with Prisma Client (AC: Test records creation)
  - [ ] Create test Book record
  - [ ] Create test Chapter records linked to Book
  - [ ] Create test ReadingProgress record
  - [ ] Verify cascade delete works (delete Book deletes Chapters)
  - [ ] Verify unique constraint on ReadingProgress works

## Dev Notes

### Architecture Requirements

**From Architecture Document ([architecture.md](../_bmad-output/planning-artifacts/architecture.md#data-model)):**

The architecture specifies the exact Prisma schema structure:

**Book Model:**
- UUID id (default generated)
- title, author (string, author nullable)
- summary (Text field for AI-generated content)
- coverUrl (nullable - future enhancement)
- pdfPath (storage location reference)
- totalPages, wordCount, readingTimeMinutes (integers)
- BookStatus enum (PROCESSING, READY, ERROR)
- Relationships: chapters[], readingProgress[], processingJobs[]
- Indexes: status, createdAt

**Chapter Model:**
- UUID id
- bookId foreign key (cascade delete)
- chapterNumber (ordering)
- title, content (content uses @db.Text)
- wordCount, startPage, endPage (integers, pages nullable)
- Index: (bookId, chapterNumber) composite

**ReadingProgress Model:**
- UUID id
- bookId, chapterId foreign keys
- position (integer - scroll percentage 0-100)
- lastReadAt (auto-updated timestamp)
- Unique constraint: (bookId, chapterId)

**CRITICAL NOTES:**
- Story 1.1 already set up Prisma with SQLite + BetterSQLite3 adapter
- Prisma 7.x is installed (configuration in prisma.config.ts, not schema.prisma)
- ProcessingJob model intentionally deferred to Story 3.1 (when job queue is implemented)
- User switched from PostgreSQL to SQLite for simpler local development

### Current Project State

**From Story 1.1 Implementation:**

✅ **Already Completed:**
- Prisma 7.2.0 installed with SQLite configuration
- prisma.config.ts configured with BetterSQLite3 adapter
- lib/prisma.ts with singleton pattern for Next.js
- lib/db.ts as canonical Prisma client export
- Migration system verified and working
- Prisma Studio confirmed working on port 51212
- .env and .env.example properly configured

✅ **Current Schema State:**
```prisma
// prisma/schema.prisma (CURRENT - needs extension)
datasource db {
  provider = "sqlite"
  // url moved to prisma.config.ts in Prisma 7.x
}

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

**Git Context from Recent Commits:**
- a1019a0: Added postinstall script for Prisma Client generation
- 4395d55: Fixed Prisma Client imports for deployment
- 35c50b3: Improved tests with dynamic imports
- e2bbdd7: Reorganized project folder structure
- fe07b16: Multi-file upload with background processing added

**Key Insight:** The multi-file upload feature (fe07b16) suggests the upload UI already exists. This story adds the database layer to persist uploaded PDF data.

### Implementation Strategy

**Schema Evolution Approach:**
1. Keep existing User model (don't remove - may be used elsewhere)
2. Add Book, Chapter, ReadingProgress models to schema
3. Create new migration (don't modify existing migrations)
4. Test all relationships and constraints work correctly

**Migration Naming Convention:**
- Use descriptive name: `add-core-models`
- This follows Story 1.1's pattern for clarity

**Testing Strategy:**
- Create helper script to test database operations
- Verify all CRUD operations work
- Test cascade deletes
- Test unique constraints

### Technical Specifications

**Prisma Schema Updates:**

```prisma
// ADD to prisma/schema.prisma

// Book status enum
enum BookStatus {
  PROCESSING
  READY
  ERROR
}

// Book model
model Book {
  id                  String             @id @default(uuid())
  title               String
  author              String?
  summary             String             @db.Text
  coverUrl            String?
  pdfPath             String
  totalPages          Int                @default(0)
  wordCount           Int                @default(0)
  readingTimeMinutes  Int                @default(0)
  status              BookStatus         @default(PROCESSING)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  chapters            Chapter[]
  readingProgress     ReadingProgress[]

  @@index([status])
  @@index([createdAt])
}

// Chapter model
model Chapter {
  id             String    @id @default(uuid())
  bookId         String
  chapterNumber  Int
  title          String
  content        String    @db.Text
  wordCount      Int       @default(0)
  startPage      Int?
  endPage        Int?
  createdAt      DateTime  @default(now())

  book           Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@index([bookId, chapterNumber])
}

// ReadingProgress model
model ReadingProgress {
  id          String   @id @default(uuid())
  bookId      String
  chapterId   String
  position    Int      @default(0)
  lastReadAt  DateTime @updatedAt

  book        Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([bookId, chapterId])
}
```

**Why SQLite Instead of PostgreSQL:**
- User preference from Story 1.1 for simpler local development
- No Docker dependency required
- File-based database (prisma/dev.db)
- Easily portable and backed up
- Sufficient for single-user MVP

**Important Prisma 7.x Details:**
- `@db.Text` annotation works with SQLite for unlimited text
- UUID generation works natively (no special setup needed)
- Cascade deletes: `onDelete: Cascade` in relation
- Composite indexes: `@@index([field1, field2])`
- Unique constraints: `@@unique([field1, field2])`

### Testing Requirements

**Unit Tests:**
- Create Book record and verify all fields
- Create Chapter with foreign key relationship
- Create ReadingProgress with unique constraint
- Verify timestamps auto-update (updatedAt, lastReadAt)

**Integration Tests:**
- Create Book → Create multiple Chapters → Verify relationship
- Delete Book → Verify Chapters cascade delete
- Create duplicate ReadingProgress → Verify unique constraint fails
- Update ReadingProgress → Verify lastReadAt updates

**Manual Verification:**
- Open Prisma Studio and inspect tables
- Verify indexes exist in database
- Check foreign key constraints
- Verify enum values display correctly

### File Structure Requirements

**Files to Modify:**
1. `prisma/schema.prisma` - Add Book, Chapter, ReadingProgress models and BookStatus enum

**Files Created by Migration:**
1. `prisma/migrations/{timestamp}_add-core-models/migration.sql` - Auto-generated migration SQL

**Files to Verify:**
1. `generated/prisma/index.d.ts` - TypeScript types should update after migration
2. `prisma/dev.db` - Database file should contain new tables

### Related Stories

**Dependencies:**
- ✅ **Story 1.1:** Database Setup with Prisma - COMPLETED (prerequisite)

**Related Future Stories:**
- **Story 1.3:** Redis and BullMQ Setup - Parallel infrastructure (ProcessingJob model added later)
- **Story 2.1:** Basic File Upload API - Will use Book model to create records
- **Story 3.1:** Job Queue System - Will add ProcessingJob model to track processing
- **Story 4.2:** Book Summary Generation - Will populate Book.summary field
- **Story 4.3:** Chapter Boundary Detection - Will create Chapter records
- **Story 5.1:** Book Library API - Will query Book and Chapter models
- **Story 6.4:** Reading Position Persistence - Will use ReadingProgress model

### Implementation Sequence

1. **Update Prisma Schema** - Add models and enum
2. **Generate Migration** - Create migration file
3. **Apply Migration** - Update database schema
4. **Verify Types** - Check generated Prisma Client types
5. **Test Operations** - Verify CRUD and constraints

### Known Limitations & Trade-offs

**SQLite vs PostgreSQL:**
- ✅ Simpler setup (no Docker)
- ✅ File-based (easy backup/restore)
- ❌ No concurrent write optimization (acceptable for single-user)
- ❌ Limited full-text search (deferred to Phase 2)

**Schema Design Decisions:**
- ProcessingJob model deferred to Story 3.1 (when BullMQ is set up)
- No User model integration for MVP (single-user, no auth)
- coverUrl nullable (Phase 2 enhancement - PDF cover extraction)
- Reading progress as percentage (0-100) instead of absolute scroll pixels

### Success Criteria

This story is complete when:
- ✅ Book model exists with all specified fields
- ✅ Chapter model exists with proper relationship to Book
- ✅ ReadingProgress model exists with unique constraint
- ✅ BookStatus enum is defined and used
- ✅ Migration runs successfully without errors
- ✅ Cascade delete works (deleting Book removes Chapters and ReadingProgress)
- ✅ Indexes are created on specified fields
- ✅ TypeScript recognizes all new Prisma types
- ✅ Test records can be created, queried, updated, and deleted
- ✅ Prisma Studio shows new tables with correct structure

## Dev Agent Record

### Agent Model Used

_Will be filled during implementation_

### Debug Log References

_Will be filled during implementation_

### Implementation Plan

_Will be filled during implementation_

### Completion Notes List

_Will be filled during implementation_

### File List

_Will be filled during implementation_

## Change Log

- 2026-01-15: Story created with comprehensive context analysis
  - Analyzed Epic 1 requirements from epics.md
  - Extracted database schema specifications from architecture.md
  - Reviewed Story 1.1 completion notes for current Prisma setup
  - Analyzed recent Git commits for project evolution context
  - Noted SQLite vs PostgreSQL decision from Story 1.1
  - Identified ProcessingJob model deferral to Story 3.1
