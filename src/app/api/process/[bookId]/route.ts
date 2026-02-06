import { NextRequest, NextResponse } from 'next/server';
import { 
  extractTextFromPDF, 
  extractTablesFromPDF,
  isScannedPDF, 
  getWordCount,
  PDFExtractionError
} from '@/lib/services/pdf-extraction';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';

/**
 * Processing progress stages
 */
const PROCESSING_STAGES = {
  TEXT: { progress: 50, message: 'Extracting text...' },
  TABLES: { progress: 100, message: 'Extracting tables...' }
};

/**
 * POST /api/process/[bookId]
 * Triggers async PDF processing (text + tables extraction)
 * Images extraction: TODO for future implementation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  console.log(`[Process] Starting processing for book: ${bookId}`);
  
  const response = NextResponse.json({ accepted: true, bookId });
  processBookInBackground(bookId);
  
  return response;
}

/**
 * Background processing: extracts text and tables
 */
async function processBookInBackground(bookId: string): Promise<void> {
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      console.error(`[Process] Book not found: ${bookId}`);
      return;
    }
    
    console.log(`[Process] Book found: ${book.title}`);
    const pdfPath = storageService.getFilePath(book.pdfPath);
    
    if (!await storageService.fileExists(book.pdfPath)) {
      throw new PDFExtractionError(`PDF file not found`, pdfPath);
    }
    
    // Stage 1: Extract text (50%)
    console.log(`[Process] Stage 1/2: Extracting text...`);
    const { text, pageCount } = await extractTextFromPDF(pdfPath);
    
    if (isScannedPDF(text)) {
      await prisma.book.update({
        where: { id: bookId },
        data: { status: 'ERROR', errorMessage: 'PDF appears to be scanned or contains no extractable text' }
      });
      return;
    }
    
    const wordCount = getWordCount(text);
    console.log(`[Process] Extracted ${pageCount} pages, ${wordCount} words`);
    
    // Stage 2: Extract tables (100%)
    console.log(`[Process] Stage 2/2: Extracting tables...`);
    let tables: { html: string; pageNumber: number }[] = [];
    try {
      tables = await extractTablesFromPDF(pdfPath);
      console.log(`[Process] Extracted ${tables.length} tables`);
    } catch (tableError) {
      console.warn(`[Process] Table extraction failed (continuing):`, tableError);
    }
    
    // Prepare content with table placeholders
    let content = text;
    if (tables.length > 0) {
      content += '\n\n---\n\n' + tables.map((t, i) => `[TABLE:${i}]\n${t.html}`).join('\n\n');
    }
    
    // Save to database
    await prisma.$transaction([
      prisma.chapter.create({
        data: {
          bookId,
          chapterNumber: 1,
          title: 'Full Book',
          content,
          wordCount,
          startPage: 1,
          endPage: pageCount,
        }
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { status: 'READY', totalPages: pageCount, wordCount }
      })
    ]);
    
    console.log(`[Process] Book ${bookId} processed successfully`);
    console.log(`[Process] Summary: ${pageCount} pages, ${wordCount} words, ${tables.length} tables`);
    
  } catch (error) {
    console.error(`[Process] Error processing book ${bookId}:`, error);
    
    const errorMessage = error instanceof PDFExtractionError 
      ? error.message 
      : error instanceof Error ? error.message : 'Unknown error';
    
    try {
      await prisma.book.update({
        where: { id: bookId },
        data: { status: 'ERROR', errorMessage }
      });
    } catch (dbError) {
      console.error(`[Process] Failed to update error status:`, dbError);
    }
  }
}
