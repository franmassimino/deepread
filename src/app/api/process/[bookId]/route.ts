import { NextRequest, NextResponse } from 'next/server';
import { 
  extractTextFromPDF, 
  extractImagesFromPDF, 
  extractTablesFromPDF,
  isScannedPDF, 
  getWordCount 
} from '@/lib/services/pdf-extraction';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';

/**
 * Processing progress stages
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
  // Using waitUntil pattern for Next.js App Router
  processBookInBackground(bookId);
  
  return response;
}

/**
 * Background processing function
 * Extracts text, images, and tables from PDF and updates book status
 */
async function processBookInBackground(bookId: string): Promise<void> {
  try {
    // Get book from database
    const book = await prisma.book.findUnique({
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
      throw new Error(`PDF file not found at path: ${book.pdfPath}`);
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
      
      // Save image records to database
      for (const image of images) {
        await prisma.image.create({
          data: {
            bookId,
            filename: image.filename,
            pageNumber: image.pageNumber,
            width: image.width,
            height: image.height
          }
        });
      }
    } catch (imageError) {
      console.warn(`[Process] Image extraction failed (continuing):`, imageError);
      // Continue processing even if image extraction fails
    }
    
    // Stage 3: Extract tables from PDF (100%)
    console.log(`[Process] Stage 3/3: Extracting tables from PDF...`);
    await updateBookProcessingProgress(bookId, PROCESSING_STAGES.TABLES.progress, PROCESSING_STAGES.TABLES.message);
    
    let tables: { html: string; pageNumber: number; rowCount: number; colCount: number }[] = [];
    let contentWithPlaceholders = text;
    
    try {
      tables = await extractTablesFromPDF(pdfPath);
      console.log(`[Process] Extracted ${tables.length} tables`);
      
      // Insert table placeholders into content
      // For MVP: append table HTML at the end of content with markers
      if (tables.length > 0) {
        const tableSection = '\n\n---\n\n' + tables.map((t, i) => 
          `[TABLE:${i}]\n${t.html}`
        ).join('\n\n');
        contentWithPlaceholders += tableSection;
      }
    } catch (tableError) {
      console.warn(`[Process] Table extraction failed (continuing):`, tableError);
      // Continue processing even if table extraction fails
    }
    
    // Insert image placeholders into content
    // Group images by page and add placeholders
    if (images.length > 0) {
      const imagePlaceholders = images.map(img => `[IMAGE:${img.filename}]`).join('\n');
      contentWithPlaceholders += '\n\n---\n\n' + imagePlaceholders;
    }
    
    // Create a single chapter with all content (chapter detection comes in Epic 4)
    await prisma.chapter.create({
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
    
    // Update book status to READY
    await prisma.book.update({
      where: { id: bookId },
      data: {
        status: 'READY',
        totalPages: pageCount,
        wordCount,
      }
    });
    
    console.log(`[Process] Book ${bookId} processed successfully`);
    console.log(`[Process] Summary: ${pageCount} pages, ${wordCount} words, ${images.length} images, ${tables.length} tables`);
    
  } catch (error) {
    console.error(`[Process] Error processing book ${bookId}:`, error);
    
    // Update book status to ERROR
    await prisma.book.update({
      where: { id: bookId },
      data: {
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during processing'
      }
    });
  }
}

/**
 * Updates book processing progress
 * Note: This could be extended to store progress in database or emit events
 */
async function updateBookProcessingProgress(
  bookId: string, 
  progress: number, 
  message: string
): Promise<void> {
  console.log(`[Process] Progress for ${bookId}: ${progress}% - ${message}`);
  
  // Future enhancement: Store progress in database or emit SSE events
  // For now, just log the progress
}
