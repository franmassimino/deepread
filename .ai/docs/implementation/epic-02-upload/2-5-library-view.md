# Story 2.5: Library View with Uploaded Books

Status: review

## Story

As a user,
I want to see my uploaded books in the library view,
So that I can access my book collection after uploading PDFs.

## Acceptance Criteria

1. **Given** I have uploaded books
   **When** I view the library
   **Then** I see all my books from the database

2. **And** the library shows book title, author (if available), and status

3. **And** the library auto-refreshes when I upload a new book

4. **And** an empty state message shows when I have no books

## Tasks / Subtasks

- [x] Task 1: Create GET /api/books endpoint
  - [x] 1.1 Create route handler returning all books
  - [x] 1.2 Order by createdAt descending (newest first)

- [x] Task 2: Update Library component
  - [x] 2.1 Fetch books from API on mount
  - [x] 2.2 Show loading state while fetching
  - [x] 2.3 Map database books to UI format
  - [x] 2.4 Auto-refresh after upload completes

- [x] Task 3: Add empty state
  - [x] 3.1 Show message when no books uploaded

## Dev Notes

- Keep implementation simple - no React Query needed, just useEffect + fetch
- Use zustand store to trigger refetch after upload
- Map BookStatus enum to UI status (PROCESSING→reading, READY→completed)

## Change Log

- 2026-01-29: Story created
