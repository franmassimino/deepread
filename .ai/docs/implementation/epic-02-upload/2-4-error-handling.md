# Story 2.4: Upload Error Handling

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to receive clear error messages when uploads fail,
So that I understand what went wrong and can take corrective action.

## Acceptance Criteria

1. **Given** the upload system is implemented
   **When** an upload fails for any reason
   **Then** I see a specific error message for file type errors ("Only PDF files are supported")

2. **And** I see a specific error message for file size errors ("File exceeds 50MB limit")

3. **And** I see a specific error message for network errors ("Upload failed - check connection")

4. **And** I see a specific error message for server errors ("Server error - please try again")

5. **And** corrupted PDFs are detected and show "Invalid or corrupted PDF file"

6. **And** I can retry the upload with a "Retry" button

7. **And** I can dismiss the error and continue using the application

## Tasks / Subtasks

- [ ] Task 1: Enhance Client-Side File Validation (AC: #1, #2, #5)
  - [ ] 1.1 Add client-side PDF magic number validation before upload starts
  - [ ] 1.2 Add client-side file size check (50MB limit) before upload starts
  - [ ] 1.3 Show immediate toast error for invalid file type (don't start upload)
  - [ ] 1.4 Show immediate toast error for oversized files (don't start upload)
  - [ ] 1.5 Validate file extension is .pdf (case-insensitive)

- [ ] Task 2: Enhance Server-Side Validation (AC: #1, #2, #5)
  - [ ] 2.1 Add server-side PDF magic number validation in /api/upload
  - [ ] 2.2 Add server-side file size enforcement (return 413 if exceeded)
  - [ ] 2.3 Add basic PDF structure validation (check for %PDF header)
  - [ ] 2.4 Return specific error messages in JSON format: `{ error: "message" }`
  - [ ] 2.5 Map server error codes to user-friendly messages

- [ ] Task 3: Improve Error Display in Upload UI (AC: #3, #4, #6, #7)
  - [ ] 3.1 Ensure BookUploadItem shows error state with clear message
  - [ ] 3.2 Add "Retry" button for failed uploads (already exists, verify it works)
  - [ ] 3.3 Add "Dismiss" button to remove failed upload from list
  - [ ] 3.4 Show specific error icons for different error types (file, network, server)
  - [ ] 3.5 Ensure error messages are accessible (aria-live regions)

- [ ] Task 4: Enhance Network Error Handling (AC: #3)
  - [ ] 4.1 Add timeout detection for stalled uploads (>30s without progress)
  - [ ] 4.2 Show specific "Network error - check your connection" message
  - [ ] 4.3 Implement automatic retry for transient network errors (1 attempt)
  - [ ] 4.4 Distinguish between client offline vs server unreachable

- [ ] Task 5: Add Error Logging and Analytics (Optional but recommended)
  - [ ] 5.1 Log upload errors to console with detailed context
  - [ ] 5.2 Track error frequency by type for debugging

- [ ] Task 6: Unit Tests for Error Handling
  - [ ] 6.1 Test: Client rejects non-PDF files before upload
  - [ ] 6.2 Test: Client rejects files >50MB before upload
  - [ ] 6.3 Test: Server returns 400 for invalid PDF
  - [ ] 6.4 Test: Server returns 413 for oversized file
  - [ ] 6.5 Test: Network error shows correct message
  - [ ] 6.6 Test: Retry functionality works for failed uploads
  - [ ] 6.7 Test: Dismiss removes failed upload from list

## Dev Notes

### Existing Code Analysis

**Upload Store** ([lib/stores/upload-store.tsx](lib/stores/upload-store.tsx))
- ✅ Already has `getErrorMessage()` function mapping HTTP status to messages (lines 53-71)
- ✅ Already handles 400, 413, 500 errors with specific messages
- ✅ Already shows toast notifications on errors
- ✅ Already has `retryUpload()` method
- ❌ Missing: Client-side validation before upload starts
- ❌ Missing: PDF magic number validation
- ❌ Missing: Corrupted PDF detection

**Current Error Mapping:**
```typescript
400 → 'Invalid PDF file'
413 → 'File exceeds 50MB limit'
500 → 'Server error - please try again'
default → 'Upload failed - please try again'
```

**Upload Dialog** ([components/upload/upload-pdf-dialog.tsx](components/upload/upload-pdf-dialog.tsx))
- ✅ Validates file type via input accept attribute
- ❌ Missing: Programmatic validation before calling startUpload()
- ❌ Missing: File size check before upload

**BookUploadItem Component** ([components/upload/book-upload-item.tsx](components/upload/book-upload-item.tsx))
- ✅ Shows error states
- ✅ Has retry button
- ✅ Shows error messages
- ❌ Missing: Dismiss/remove button for failed uploads

### Implementation Strategy

**1. Client-Side Validation (upload-pdf-dialog.tsx)**
Add validation before calling `startUpload()`:
```typescript
const validateFile = (file: File): string | null => {
  // Check extension
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files are supported';
  }
  
  // Check size (50MB = 50 * 1024 * 1024 bytes)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return 'File exceeds 50MB limit';
  }
  
  // Check magic number (first few bytes)
  // PDF files start with "%PDF-"
  return null; // Valid
};
```

**2. Server-Side Validation (/api/upload)**
Enhance existing validation:
- Check Content-Type header
- Verify file signature (magic number)
- Parse first few bytes to check for %PDF header
- Reject corrupted files with specific error

**3. Magic Number Validation**
PDF files start with bytes: `%PDF-` (0x25 0x50 0x44 0x46 0x2D)
```typescript
const isValidPDF = async (buffer: Buffer): boolean => {
  const pdfSignature = Buffer.from('%PDF-');
  return buffer.slice(0, 5).equals(pdfSignature);
};
```

**4. Error Message Enhancement**
Update messages for clarity:
- "Only PDF files are supported" (file type)
- "File exceeds 50MB limit" (size)
- "Invalid or corrupted PDF file" (corrupted)
- "Upload failed - check your connection" (network)
- "Server error - please try again" (server)

### Technical Notes

- **File size limit:** 50MB (52,428,800 bytes)
- **Validation order:** Extension → Size → Magic number → Content
- **Error display:** Use existing toast + inline error in BookUploadItem
- **Accessibility:** Add aria-live="polite" to error containers
- **Performance:** Client-side validation happens before any network request

### Architecture Compliance

- **State management:** Zustand (already used)
- **TypeScript:** Strict types for error states
- **Testing:** Vitest for unit tests
- **Error handling:** Client-side first, server-side as backup
- **UX:** Immediate feedback for validation errors, clear retry/dismiss actions

## Dev Agent Record

### Agent Model Used

[To be filled by Dev Agent]

### Debug Log References

[To be filled by Dev Agent]

### Completion Notes List

[To be filled by Dev Agent]

### File List

**Expected Modified Files:**
- components/upload/upload-pdf-dialog.tsx (add client-side validation)
- app/api/upload/route.ts or pages/api/upload.ts (add server-side validation)
- lib/stores/upload-store.tsx (enhance error handling if needed)
- components/upload/book-upload-item.tsx (add dismiss button)
- tests/unit/upload-store.test.ts (add error handling tests)

**Expected Created Files:**
- [To be filled by Dev Agent]

**Expected Deleted Files:**
- None

## Change Log

- 2026-02-03: Story created - comprehensive error handling for upload functionality
