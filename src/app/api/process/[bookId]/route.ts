import { NextRequest, NextResponse } from 'next/server';
import { 
  extractTextFromPDF, 
  extractImagesFromPDF, 
  extractTablesFromPDF,
  isScannedPDF, 
  getWordCount,
  PDFExtractionError
} from '@/lib/services/pdf-extraction';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';

/**
 * Processing progress stages
 * Maps processing phase to progress percentage and user message
 */
const PROCESSING_STAGES = {
  TEXT: { progress: 33, message: 'Extracting text...' },
  IMAGES: { progress: 66, message: 'Extracting images...' },
  TABLES: { progress: 100, message: 'Extracting tables...' }
};

/**
 * POST /api/process/[bookId]
 * Triggers async PDF processing (text, images, tables extraction)
 * Returns immediately with accepted: true, processing continues in background
 * 
 * Processing pipeline:
 * 1. Text extraction (33%)
 * 2. Image extraction (66%) - continues on error
 * 3. Table extraction (100%) - continues on error
 * 4. Save to database (transaction)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  
  console.log(`[Process] Starting processing for book: ${bookId}`);
  
  // Respond immediately - processing happens after
  const response = NextResponse.json({ accepted: true, bookId });
  
  // Start processing in background (fire-and-forget)
  // TODO: Consider using a job queue (BullMQ) for production to handle
  // server restarts and provide better reliability
  processBookInBackground(bookId);
  
  return response;
}

/**
 * Background processing function
 * Extracts text, images, and tables from PDF and updates book status
 * 
 * Error handling strategy:
 * - Text extraction failure: Stops processing, marks book as ERROR
 * - Image extraction failure: Logs warning, continues processing
 * - Table extraction failure: Logs warning, continues processing
 * - Database failure: Marks book as ERROR
 */
async function processBookInBackground(bookId: string): Promise<void> {
  let book: { id: string; title: string; pdfPath: string } | null = null;
  
  try {
    // Get book from database
    book = await prisma.book.findUnique({
      where: { id: bookId }
    });
    
    if (!book) {
      console.error(`[Process] Book not found: ${bookId}`);
      return;
    }
    
    console.log(`[Process] Book found: ${book.title}, PDF path: ${book.pdfPath}`);
    
    // Get PDF file path
    const pdfPath = storageService.getFilePath(book.pdfPath);
    
    // Check if file exists
    const fileExists = await storageService.fileExists(book.pdfPath);
    if (!fileExists) {
      throw new PDFExtractionError(`PDF file not found at path: ${book.pdfPath}`, pdfPath);
    }
    
    // Stage 1: Extract text from PDF (33%)
    console.log(`[Process] Stage 1/3: Extracting text from PDF...`);
    await updateBookProcessingProgress(bookId, PROCESSING_STAGES.TEXT.progress, PROCESSING_STAGES.TEXT.message);
    
    const { text, pageCount, info } = await extractTextFromPDF(pdfPath);
    
    // Check if PDF appears to be scanned (no extractable text)
    if (isScannedPDF(text)) {
      console.warn(`[Process] PDF appears to be scanned or has no extractable text: ${bookId}`);
      await prisma.book.update({
        where: { id: bookId },
        data: {
          status: 'ERROR',
          errorMessage: 'PDF appears to be scanned or contains no extractable text'
        }
      });
      return;
    }
    
    const wordCount = getWordCount(text);
    console.log(`[Process] Extracted ${pageCount} pages, ${wordCount} words`);
    
    // Stage 2: Extract images from PDF (66%)
    console.log(`[Process] Stage 2/3: Extracting images from PDF...`);
    await updateBookProcessingProgress(bookId, PROCESSING_STAGES.IMAGES.progress, PROCESSING_STAGES.IMAGES.message);
    
    let images: { filename: string; pageNumber: number; width: number; height: number }[] = [];
    try {
      images = await extractImagesFromPDF(pdfPath, bookId);
      console.log(`[Process] Extracted ${images.length} images`);
    } catch (imageError) {
      // Log but continue - image extraction is not critical
      console.warn(`[Process] Image extraction failed (continuing):`, 
        imageError instanceof Error ? imageError.message : String(imageError)
      );
    }
    
    // Stage 3: Extract tables from PDF (100%)
    console.log(`[Process] Stage 3/3: Extracting tables from PDF...`);
    await updateBookProcessingProgress(bookId, PROCESSING_STAGES.TABLES.progress, PROCESSING_STAGES.TABLES.message);
    
    let tables: { html: string; pageNumber: number; rowCount: number; colCount: number }[] = [];
    try {
      tables = await extractTablesFromPDF(pdfPath);
      console.log(`[Process] Extracted ${tables.length} tables`);
    } catch (tableError) {
      // Log but continue - table extraction is not critical
      console.warn(`[Process] Table extraction failed (continuing):`,
        tableError instanceof Error ? tableError.message : String(tableError)
      );
    }
    
    // Prepare content with placeholders
    let contentWithPlaceholders = text;
    
    // TODO: Insert placeholders at correct positions based on page numbers
    // Currently appending at end as MVP - ideally should insert at correct locations
    const placeholders: string[] = [];
    
    // Add table placeholders
    if (tables.length > 0) {
      placeholders.push('---');
      placeholders.push(...tables.map((t, i) => `[TABLE:${i}]\n${t.html}`));
    }
    
    // Add image placeholders
    if (images.length > 0) {
      if (placeholders.length === 0) placeholders.push('---');
      placeholders.push(...images.map(img => `[IMAGE:${img.filename}]`));
    }
    
    if (placeholders.length > 0) {
      contentWithPlaceholders += '\n\n' + placeholders.join('\n');
    }
    
    // Save everything to database in a transaction
    // This ensures atomicity - either all data is saved or nothing
    console.log(`[Process] Saving to database...`);
    
    await prisma.$transaction(async (tx) => {
      // Create chapter with content
      await tx.chapter.create({
        data: {
          bookId,
          chapterNumber: 1,
          title: 'Full Book',
          content: contentWithPlaceholders,
          wordCount,
          startPage: 1,
          endPage: pageCount,
        }
      });
      
      // Create image records
      if (images.length > 0) {
        await tx.image.createMany({
          data: images.map(img => ({
            bookId,
            filename: img.filename,
            pageNumber: img.pageNumber,
            width: img.width,
            height: img.height
          }))
        });
      }
      
      // Update book status to READY
      await tx.book.update({
        where: { id: bookId },
        data: {
          status: 'READY',
          totalPages: pageCount,
          wordCount,
        }
      });
    });
    
    console.log(`[Process] Book ${bookId} processed successfully`);
    console.log(`[Process] Summary: ${pageCount} pages, ${wordCount} words, ${images.length} images, ${tables.length} tables`);
    
  } catch (error) {
    console.error(`[Process] Error processing book ${bookId}:`, error);
    
    // Update book status to ERROR with descriptive message
    const errorMessage = error instanceof PDFExtractionError 
      ? error.message 
      : error instanceof Error 
        ? error.message 
        : 'Unknown error during processing';
    
    try {
      await prisma.book.update({
        where: { id: bookId },
        data: {
          status: 'ERROR',
          errorMessage
        }
      });
    } catch (dbError) {
      // If we can't even update the database, just log
      console.error(`[Process] Failed to update error status:`, dbError);
    }
  }
}

/**
 * Updates book processing progress
 * Note: This could be extended to store progress in database or emit SSE events
 * For now, just logs the progress
 */
async function updateBookProcessingProgress(
  bookId: string, 
  progress: number, 
  message: string
): Promise<void> {
  console.log(`[Process] Progress for ${bookId}: ${progress}% - ${message}`);
  
  // Future enhancement: Store progress in database or emit SSE events
  // Example:
  // await prisma.book.update({
  //   where: { id: bookId },
  //   data: { processingProgress: progress, processingMessage: message }
  // });
}
