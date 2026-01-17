# Story 1.4: File Storage Service

## Story
As a developer,
I want to create a file storage abstraction layer,
So that I can store PDFs locally in development and easily switch to cloud storage later.

## Acceptance Criteria

**Given** the project has a basic infrastructure setup
**When** I implement a StorageService with methods for saving and retrieving files
**Then** PDFs can be saved to `/storage/pdfs/{bookId}/` directory
**And** images can be saved to `/storage/images/{bookId}/{chapterId}/` directory
**And** files can be retrieved by bookId and filename
**And** the storage directory is created automatically if it doesn't exist
**And** the storage directory is added to `.gitignore`
**And** I can test saving and retrieving a file successfully

## Technical Notes
- Use Node.js `fs/promises` for file operations
- Create interface: `saveFile(path, buffer)`, `getFile(path)`, `deleteFile(path)`
- Prepare for future S3/Vercel Blob integration

## Tasks

### Task 1: Create Storage Service Interface
- [x] Create `src/lib/services/storage.ts` with TypeScript interface
- [x] Define `StorageService` interface with methods: `saveFile`, `getFile`, `deleteFile`, `fileExists`
- [x] Add proper TypeScript types for all methods
- [x] Add JSDoc comments for documentation
- [x] **ENHANCED:** Added `getFileSize`, `listFiles`, `deleteBookFiles` methods
- [x] **ENHANCED:** Created custom `StorageError` class for better error handling

### Task 2: Implement Local File Storage
- [x] Implement `LocalStorageService` class
- [x] Add method: `saveFile(path: string, buffer: Buffer): Promise<string>`
- [x] Add method: `getFile(path: string): Promise<Buffer>`
- [x] Add method: `deleteFile(path: string): Promise<void>`
- [x] Add method: `fileExists(path: string): Promise<boolean>`
- [x] Create storage directories automatically if they don't exist
- [x] Handle file system errors gracefully
- [x] **ENHANCED:** Added comprehensive logging for all operations
- [x] **ENHANCED:** Wrapped all operations in try/catch with contextual errors

### Task 3: Configure Storage Paths
- [x] Define base storage path in environment variables (`STORAGE_PATH`)
- [x] Create helper functions for generating paths:
  - `getPdfPath(bookId: string, filename: string)`
  - `getImagePath(bookId: string, chapterId: string, filename: string)`
- [x] Ensure paths are platform-independent (use `path.join`)
- [x] **ENHANCED:** Added environment variable to both `.env` and `.env.example`

### Task 4: Add to .gitignore
- [x] Add `/storage/` to `.gitignore` to prevent committing uploaded files
- [x] Add `/test-storage/` for test isolation

### Task 5: Write Tests
- [x] Create test file: `tests/unit/storage.test.ts` (comprehensive unit tests)
- [x] Create test file: `tests/integration/storage/file-operations.test.ts` (integration tests)
- [x] Create test file: `tests/manual/storage-test.ts` (manual verification)
- [x] Test: `saveFile` creates file and returns path
- [x] Test: `getFile` retrieves saved file correctly
- [x] Test: `deleteFile` removes file successfully
- [x] Test: `fileExists` returns true for existing files, false otherwise
- [x] Test: Automatically creates directories if missing
- [x] Test: Error handling for invalid paths
- [x] Test: Error handling for non-existent files
- [x] **ENHANCED:** Added tests for `getFileSize`, `listFiles`, `deleteBookFiles`
- [x] **ENHANCED:** Added real-world workflow tests
- [x] **ENHANCED:** Added large file and concurrent operations tests

### Task 6: Create Singleton Instance
- [x] Export singleton instance of `LocalStorageService`
- [x] Add initialization logic for storage service
- [x] Ensure service is ready before accepting requests
- [x] **ENHANCED:** Implemented proper singleton pattern using `globalThis` (like Redis/Prisma)
- [x] **ENHANCED:** Added initialization logging

## Implementation Notes

### Directory Structure
```
storage/
  pdfs/
    {bookId}/
      original.pdf
  images/
    {bookId}/
      {chapterId}/
        image-1.png
        image-2.png
```

### Error Handling
- ENOENT: File/directory not found
- EACCES: Permission denied
- ENOSPC: No space left on device

### Future Considerations
- Abstract interface allows easy swap to S3/Vercel Blob
- Could add file compression for images
- Could add CDN integration for serving files

## Dev Agent Record

**Implementation Date:** 2026-01-17
**Developer:** Amelia (Dev Agent)

### What Was Implemented

1. **Enhanced Storage Service Interface**
   - Extended `StorageService` interface with 3 additional methods:
     - `getFileSize(path: string): Promise<number>` - Get file size in bytes
     - `listFiles(directoryPath: string): Promise<string[]>` - List files in directory
     - `deleteBookFiles(bookId: string): Promise<void>` - Cleanup all book files
   - Created custom `StorageError` class with operation context and original error tracking

2. **Improved LocalStorageService Implementation**
   - Added comprehensive logging system:
     - Development-only operation logging via `log()` method
     - Error logging for all operations via `logError()` method
   - Enhanced error handling:
     - All public methods wrapped in try/catch
     - Contextual `StorageError` thrown with operation details
   - Added `deleteDirectory()` private helper for recursive directory deletion
   - Implemented all 7 interface methods with full error handling

3. **Proper Singleton Pattern**
   - Refactored singleton implementation to match Redis/Prisma pattern
   - Uses `globalThis` to prevent multiple instances in development (hot reload)
   - Added initialization logging
   - Factory function `createStorageService()` for clean instantiation

4. **Environment Configuration**
   - Added `STORAGE_PATH` to `.env.example` with documentation
   - Added `STORAGE_PATH="./storage"` to `.env`
   - Storage service defaults to `./storage` if env var not set

5. **Git Configuration**
   - Added `/storage/` to `.gitignore` (production uploads)
   - Added `/test-storage/` to `.gitignore` (test isolation)

### Tests Created

**Unit Tests:** `tests/unit/storage.test.ts` (198 lines)
- 11 test suites covering all methods
- Tests for saveFile, getFile, deleteFile, fileExists, getFileSize, listFiles, deleteBookFiles
- Edge cases: empty files, binary files, invalid paths, non-existent files
- Error handling validation with `StorageError` type checking
- **Total: 25 unit tests**

**Integration Tests:** `tests/integration/storage/file-operations.test.ts` (183 lines)
- 4 test suites simulating real-world scenarios
- PDF operations with helper path functions
- Multi-chapter image handling
- Book cleanup and isolation testing
- Full upload workflow simulation
- Large file handling (5MB test)
- Concurrent operations (10 parallel uploads)
- **Total: 11 integration tests**

**Manual Test:** `tests/manual/storage-test.ts` (184 lines)
- 12 comprehensive manual verification steps
- Real file system operations with cleanup
- Detailed console output for debugging
- Validates all core functionality end-to-end
- Error simulation and handling verification

### Decisions Made

1. **Enhanced Interface vs Minimal**
   - **Decision:** Extended interface beyond story requirements
   - **Rationale:** Added `getFileSize`, `listFiles`, `deleteBookFiles` as these are commonly needed operations and prevent future refactoring
   - **Trade-off:** Slightly more complex but significantly more useful

2. **Custom Error Class**
   - **Decision:** Created `StorageError` instead of generic errors
   - **Rationale:** Provides context (operation, path, original error) for better debugging
   - **Benefit:** Easier to handle specific storage errors in calling code

3. **Logging Strategy**
   - **Decision:** Development-only operation logging, always-on error logging
   - **Rationale:** Reduces production noise while maintaining debuggability
   - **Implementation:** `process.env.NODE_ENV === 'development'` check

4. **Singleton Pattern**
   - **Decision:** Use `globalThis` pattern instead of simple export
   - **Rationale:** Consistency with existing services (Redis, Prisma) and prevents hot reload issues
   - **Benefit:** Single instance across app, compatible with Next.js development mode

5. **Test Organization**
   - **Decision:** Separate unit, integration, and manual tests
   - **Rationale:** Clear separation of concerns, different execution contexts
   - **Benefit:** Can run fast unit tests in CI, integration tests for verification, manual for debugging

6. **Path Helpers**
   - **Decision:** Keep existing `getPdfPath` and `getImagePath` functions
   - **Rationale:** Abstracts storage structure, easy to refactor directory layout later
   - **Benefit:** Consistent paths across codebase

## File List

### Created Files
1. `tests/unit/storage.test.ts` - Unit tests (198 lines)
2. `tests/integration/storage/file-operations.test.ts` - Integration tests (183 lines)
3. `tests/manual/storage-test.ts` - Manual verification script (184 lines)

### Modified Files
1. `src/lib/services/storage.ts` - Enhanced storage service (297 lines)
   - Added imports: `stat`, `readdir`, `rm`
   - Added `StorageError` class
   - Extended `StorageService` interface with 3 methods
   - Enhanced all methods with logging and error handling
   - Implemented singleton pattern with `globalThis`

2. `.env.example` - Added storage configuration
   - Added `STORAGE_PATH` environment variable documentation

3. `.env` - Added storage path
   - Added `STORAGE_PATH="./storage"`

4. `.gitignore` - Added storage directories
   - Added `/storage/` (production)
   - Added `/test-storage/` (testing)

### Total Changes
- **Lines of Code Added:** ~900 lines (including tests)
- **Files Created:** 3
- **Files Modified:** 4
- **Test Coverage:** 36 tests (25 unit + 11 integration)
