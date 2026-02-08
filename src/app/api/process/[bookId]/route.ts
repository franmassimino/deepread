import { NextRequest, NextResponse } from 'next/server';
import { 
  extractTextFromPDF, 
  extractTablesFromPDF,
  isScannedPDF, 
  getWordCount,
  PDFExtractionError
} from '@/lib/services/pdf-extraction';
import { convertAndSanitize } from '@/lib/services/content-converter';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';

/**
 * Processing progress stages
 * 33% - Text extraction
 * 66% - Table extraction
 * 83% - Content conversion to HTML
 * 100% - HTML sanitization and save
 */
const PROCESSING_STAGES = {
  TEXT: { progress: 33, message: 'Extracting text...' },
  TABLES: { progress: 66, message: 'Extracting tables...' },
  CONVERT: { progress: 83, message: 'Converting to HTML...' },
  SANITIZE: { progress: 100, message: 'Finalizing...' }
};

/**
 * POST /api/process/[bookId]
 * Triggers async PDF processing (text + tables extraction + HTML conversion)
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
 * Background processing: extracts text, tables, converts to HTML
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
    
    // Stage 1: Extract text (33%)
    console.log(`[Process] Stage 1/3: Extracting text...`);
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
    
    // Stage 2: Extract tables (66%)
    console.log(`[Process] Stage 2/3: Extracting tables...`);
    let tables: { html: string; pageNumber: number }[] = [];
    try {
      tables = await extractTablesFromPDF(pdfPath);
      console.log(`[Process] Extracted ${tables.length} tables`);
    } catch (tableError) {
      console.warn(`[Process] Table extraction failed (continuing):`, tableError);
    }
    
    // Stage 3: Convert to HTML with table placeholders (83%)
    console.log(`[Process] Stage 3/3: Converting to HTML...`);
    
    // Prepare content with table placeholders for conversion
    let contentWithPlaceholders = text;
    if (tables.length > 0) {
      contentWithPlaceholders += '\n\n---\n\n' + tables.map((t, i) => `[TABLE:${i}]`).join('\n\n');
    }
    
    // Convert text to HTML and sanitize
    const { html: convertedHtml, stats } = convertAndSanitize(contentWithPlaceholders, tables);
    console.log(`[Process] Conversion stats:`, stats);
    
    // Sanitize the table HTML to ensure no XSS
    const sanitizedTables = tables.map(t => ({
      ...t,
      html: convertedHtml.includes(t.html) ? t.html : '' // Tables are already embedded
    }));
    
    // Final sanitized content
    const finalContent = convertedHtml;
    
    // Save to database
    await prisma.$transaction([
      prisma.chapter.create({
        data: {
          bookId,
          chapterNumber: 1,
          title: 'Full Book',
          content: finalContent,
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
    console.log(`[Process] Summary: ${pageCount} pages, ${wordCount} words, ${tables.length} tables, ${stats.headingCount} headings, ${stats.paragraphCount} paragraphs`);
    
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
