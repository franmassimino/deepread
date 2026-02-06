# Story 3.3: Image and Table Extraction

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want images and tables from PDFs to be preserved,
So that I can see visual content when reading.

## Acceptance Criteria

1. **Given** text extraction is working
   **When** the extraction worker processes a PDF with images
   **Then** images are extracted from the PDF
   **And** images are saved to storage at `/storage/images/{bookId}/`
   **And** image references in text are marked with placeholders

2. **Given** text extraction is working
   **When** the extraction worker processes a PDF with tables
   **Then** tables are detected and extracted with structure preserved
   **And** table data is marked up with basic HTML table tags

3. **Given** the extraction job is running
   **When** processing progresses
   **Then** job tracks progress: text (33%), images (66%), tables (100%)

4. **Given** a PDF has no images or tables
   **When** extraction completes
   **Then** extraction completes successfully with empty results
   **And** text content is still preserved

5. **Given** a PDF has images
   **When** images are extracted
   **Then** common image formats (PNG, JPEG) are supported
   **And** images are saved with sequential naming: image-1.png, image-2.png

## Tasks / Subtasks

- [x] Task 1: Install pdf.js for Image Extraction (AC: #1, #5)
  - [x] 1.1 Install `pdfjs-dist` package: `npm install pdfjs-dist`
  - [x] 1.2 Install types: `npm install -D @types/pdfjs-dist`
  - [x] 1.3 Verify pdf.js can render PDF pages

- [x] Task 2: Extend PDF Extraction Service for Images (AC: #1, #5)
  - [x] 2.1 Add `extractImagesFromPDF(pdfPath: string, bookId: string)` function
  - [x] 2.2 Render each page to canvas using pdf.js
  - [x] 2.3 Extract embedded image objects (not full page renders)
  - [x] 2.4 Save images to `/storage/images/{bookId}/image-{n}.png`
  - [x] 2.5 Return array of image metadata: `{ filename, pageNumber, width, height }`
  - [x] 2.6 Handle cases where no images exist gracefully

- [x] Task 3: Extend PDF Extraction Service for Tables (AC: #2)
  - [x] 3.1 Add `extractTablesFromPDF(pdfPath: string)` function
  - [x] 3.2 Detect table structures using pdf-parse text positioning
  - [x] 3.3 Extract table data as 2D array: `string[][]`
  - [x] 3.4 Convert table data to HTML `<table>` markup
  - [x] 3.5 Mark table locations in text with placeholder `[TABLE:{index}]`
  - [x] 3.6 Handle cases where no tables exist gracefully

- [x] Task 4: Update Processing API Route (AC: #3)
  - [x] 4.1 Modify `/api/process/[bookId]/route.ts` to call image extraction
  - [x] 4.2 Modify to call table extraction
  - [x] 4.3 Update job progress: 33% after text, 66% after images, 100% after tables
  - [x] 4.4 Store extracted content with image/table placeholders
  - [x] 4.5 Create Image records in database (new table if needed)

- [x] Task 5: Update Processing Status API (AC: #3)
  - [x] 5.1 Include detailed progress: text extraction complete, image extraction complete, etc.
  - [x] 5.2 Return image count and table count in status response

- [x] Task 6: Frontend Updates for Visual Content (AC: #1, #2)
  - [x] 6.1 Update upload progress steps: "Extracting text..." → "Extracting images..." → "Extracting tables..." → "Ready!"
  - [x] 6.2 Ensure image placeholders are handled in reading view (future prep)

- [x] Task 7: Unit Tests
  - [x] 7.1 Test: pdf.js extracts images from sample PDF
  - [x] 7.2 Test: images saved to correct storage path
  - [x] 7.3 Test: table extraction returns structured data
  - [x] 7.4 Test: table HTML conversion is valid
  - [x] 7.5 Test: progress updates correctly through stages
  - [x] 7.6 Test: PDFs without images/tables complete successfully

## Dev Notes

### Architecture Context

**Epic 3 Goal:** Background PDF processing with real-time progress updates [Source: epics.md#Epic 3]

**Previous Story (3.2) Learnings:**
- Simple async processing works well (no BullMQ needed for MVP)
- Fire-and-forget pattern for background processing
- Polling-based progress updates every 2 seconds
- `pdf-parse` for text extraction is fast and reliable

**Current Architecture:**
```
Upload Flow:
1. Client uploads PDF → POST /api/upload
2. Server saves PDF, creates Book record (status: PROCESSING)
3. Server responds with bookId
4. Client calls POST /api/process/[bookId] (async)
5. Server extracts: text → images → tables (this story)
6. Client polls GET /api/books/[bookId]/status
7. When status=READY, book appears in library
```

### Technical Requirements

**1. Image Extraction Strategy**

Two approaches with pdf.js:

**Option A: Extract embedded image objects (preferred)**
```typescript
// Get image data from PDF internal structure
const operatorList = await page.getOperatorList();
// Filter for image operators and extract raw image data
```

**Option B: Render pages to canvas and extract (fallback)**
```typescript
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
await page.render({ canvasContext: context, viewport }).promise;
// Extract image data from canvas
```

**Decision:** Start with Option A (embedded images). If complex, use Option B for MVP.

**2. Table Detection Strategy**

pdf-parse provides text with position info:
```typescript
const data = await pdfParse(buffer, {
  pagerender: function(pageData) {
    // Access text items with x,y coordinates
    return pageData.getTextContent().then(function(textContent) {
      // Analyze text positions to detect tables
      // Tables = aligned text in rows/columns
    });
  }
});
```

**Table Detection Heuristics:**
- Look for text aligned in consistent vertical positions (columns)
- Multiple rows with similar structure
- Grid-like pattern detection

**3. Storage Structure**

```
/storage/
├── pdfs/
│   └── {bookId}/
│       └── book.pdf
└── images/
    └── {bookId}/
        ├── image-1.png
        ├── image-2.png
        └── ...
```

**4. Database Schema Updates**

May need new `Image` model:
```prisma
model Image {
  id        String   @id @default(uuid())
  bookId    String
  filename  String
  pageNumber Int
  width     Int
  height    Int
  createdAt DateTime @default(now())
  
  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
  
  @@index([bookId])
}
```

Add to `Book` model:
```prisma
model Book {
  // ... existing fields ...
  images    Image[]
}
```

**5. Content Placeholders**

Text stored in `Chapter.content` with markers:
```
Some text content here.

[IMAGE:image-1.png]

More text after image.

[TABLE:0]

Final text content.
```

Table data stored separately or inline as HTML:
```html
[TABLE:<table><tr><td>Cell 1</td><td>Cell 2</td></tr>...</table>]
```

### Existing Code to Extend

**PDF Extraction Service** ([lib/services/pdf-extraction.ts](../3-2-pdf-extraction.md))
```typescript
// Current exports:
export async function extractTextFromPDF(pdfPath: string)
export function isScannedPDF(text: string)
export function getWordCount(text: string)

// New exports to add:
export async function extractImagesFromPDF(pdfPath: string, bookId: string)
export async function extractTablesFromPDF(pdfPath: string)
```

**Processing API Route** ([app/api/process/[bookId]/route.ts](../3-2-pdf-extraction.md))
```typescript
// Current flow:
// 1. Extract text
// 2. Create chapter with text
// 3. Update book status

// New flow:
// 1. Extract text (33% progress)
// 2. Extract images (66% progress)  
// 3. Extract tables (100% progress)
// 4. Create chapter with text + placeholders
// 5. Save image records
// 6. Update book status
```

### Implementation Details

**1. Image Extraction with pdf.js**

```typescript
// lib/services/pdf-extraction.ts
import * as pdfjs from 'pdfjs-dist';

export async function extractImagesFromPDF(pdfPath: string, bookId: string) {
  const images: { filename: string; pageNumber: number; width: number; height: number }[] = [];
  
  const data = new Uint8Array(await fs.readFile(pdfPath));
  const pdf = await pdfjs.getDocument({ data }).promise;
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const operatorList = await page.getOperatorList();
    
    // Extract embedded images from operator list
    // ... implementation details ...
    
    // Save each image
    for (let i = 0; i < extractedImages.length; i++) {
      const filename = `image-${images.length + 1}.png`;
      const imagePath = `/storage/images/${bookId}/${filename}`;
      await fs.mkdir(dirname(imagePath), { recursive: true });
      await fs.writeFile(imagePath, imageData);
      
      images.push({ filename, pageNumber: pageNum, width, height });
    }
  }
  
  return images;
}
```

**2. Table Detection**

```typescript
export async function extractTablesFromPDF(pdfPath: string) {
  const tables: { html: string; pageNumber: number }[] = [];
  
  const data = await pdfParse(buffer, {
    pagerender: function(pageData) {
      return pageData.getTextContent().then(function(textContent) {
        // Analyze text items for table structure
        const items = textContent.items;
        
        // Group by Y position (rows)
        const rows = groupByRow(items);
        
        // Detect columns by consistent X positions
        const columns = detectColumns(items);
        
        // If table detected, generate HTML
        if (isTable(rows, columns)) {
          tables.push({
            html: generateTableHTML(rows, columns),
            pageNumber: pageData.pageNumber
          });
        }
        
        return textContent;
      });
    }
  });
  
  return tables;
}
```

**3. Updated Processing Flow**

```typescript
// app/api/process/[bookId]/route.ts
export async function POST(...) {
  const response = Response.json({ accepted: true });
  
  (async () => {
    try {
      // 33% - Text extraction
      await updateJobProgress(bookId, 33, 'Extracting text...');
      const { text, pageCount } = await extractTextFromPDF(pdfPath);
      
      // 66% - Image extraction
      await updateJobProgress(bookId, 66, 'Extracting images...');
      const images = await extractImagesFromPDF(pdfPath, bookId);
      
      // 100% - Table extraction
      await updateJobProgress(bookId, 100, 'Extracting tables...');
      const tables = await extractTablesFromPDF(pdfPath);
      
      // Combine content with placeholders
      let content = text;
      // Insert [IMAGE:...] and [TABLE:...] placeholders at correct positions
      
      // Save chapter
      await prisma.chapter.create({
        data: { bookId, chapterNumber: 1, title: 'Full Book', content, wordCount }
      });
      
      // Save image records
      for (const img of images) {
        await prisma.image.create({ data: { ...img, bookId } });
      }
      
      // Update book status
      await prisma.book.update({
        where: { id: bookId },
        data: { status: 'READY', totalPages: pageCount }
      });
    } catch (error) {
      await prisma.book.update({
        where: { id: bookId },
        data: { status: 'ERROR', errorMessage: error.message }
      });
    }
  })();
  
  return response;
}
```

### Dependencies to Install

```bash
npm install pdfjs-dist
npm install -D @types/pdfjs-dist
```

### Known Limitations (MVP Scope)

- Images extracted as PNG only (no format preservation)
- Simple table detection (may miss complex layouts)
- No image deduplication (same image on multiple pages = multiple files)
- Table detection works best for simple grid layouts
- No OCR for scanned tables

### Testing Strategy

**Test PDFs Needed:**
1. PDF with embedded images (PNG, JPEG)
2. PDF with tables (simple grid layout)
3. PDF with both images and tables
4. PDF without any visual content (text only)
5. PDF with complex table layouts (edge case)

**Unit Test Approach:**
- Mock pdf.js for predictable image extraction
- Test table detection with known table structures
- Verify file system operations with mock storage

### Web Research: pdf.js Image Extraction

**pdfjs-dist API:**
- `pdfjs.getDocument(data)` - Load PDF
- `pdfDocument.getPage(pageNum)` - Get page
- `page.getOperatorList()` - Get rendering operators
- Operators of type `OPS.paintImageXObject` indicate images

**Key Considerations:**
- pdf.js runs in both Node.js and browser
- For Node.js, need to set up canvas factory for rendering
- Image extraction from operator list requires decoding image streams

**Alternative Libraries:**
- `pdf-image-extractor` - Simpler but less control
- `pdf2pic` - Converts pages to images (not extract embedded)

**Recommendation:** Use native pdf.js for maximum control and learning.

### References

- [Source: .ai/docs/planning/epics.md#Story 3.3] - Original story requirements
- [Source: .ai/docs/implementation/epic-03-pdf-processing/3-2-pdf-extraction.md] - Previous story implementation patterns
- [Source: .ai/docs/project-context.md] - Git workflow and project structure
- pdf.js documentation: https://mozilla.github.io/pdf.js/

## Dev Agent Record

### Agent Model Used

Kimi Code CLI - dev-story workflow execution

### Debug Log References

- Sprint status: .ai/docs/implementation/sprint-status.yaml
- Previous story: .ai/docs/implementation/epic-03-pdf-processing/3-2-pdf-extraction.md

### Completion Notes List

- Installed pdfjs-dist@5.x and @types/pdfjs-dist
- Extended pdf-extraction.ts with extractImagesFromPDF() and extractTablesFromPDF()
- Used pdf.js legacy build for Node.js compatibility
- Added Image model to Prisma schema with cascade delete
- Updated process API route with 3-stage progress tracking (33%/66%/100%)
- Updated upload-store.tsx with new processing steps
- Created comprehensive unit tests for image and table extraction
- Database synced with prisma db push

### File List

**Modified Files:**
- src/lib/services/pdf-extraction.ts - Added extractImagesFromPDF() and extractTablesFromPDF()
- src/app/api/process/[bookId]/route.ts - Added 3-stage processing with image/table extraction
- src/lib/stores/upload-store.tsx - Updated processing steps
- prisma/schema.prisma - Added Image model
- tests/unit/pdf-extraction.test.ts - Added tests for image and table extraction
- tests/unit/api/process.test.ts - Updated mocks for new functions

**Created Files:**
- None (all modifications to existing files)

**Database Changes:**
- Image table created in PostgreSQL via prisma db push

## Change Log

- 2026-02-06: Story created - Comprehensive context analysis completed
  - Analyzed previous story 3.2 implementation patterns
  - Researched pdf.js image extraction approach
  - Defined table detection strategy
  - Documented integration points with existing code

- 2026-02-06: Story implementation completed
  - Installed pdfjs-dist for PDF image extraction
  - Created extractImagesFromPDF() with pdf.js legacy build
  - Created extractTablesFromPDF() using text position analysis
  - Added Image model to Prisma schema
  - Updated process API with 3-stage progress tracking
  - Updated frontend progress steps
  - Created comprehensive unit tests
  - Database synced with new Image table
