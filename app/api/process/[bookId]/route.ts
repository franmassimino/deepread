import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, isScannedPDF, getWordCount } from '@/lib/services/pdf-extraction';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';

/**
 * POST /api/process/[bookId]
 * Triggers async PDF processing (text extraction)
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
 * Extracts text from PDF and updates book status
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
    
    // Extract text from PDF
    console.log(`[Process] Extracting text from PDF...`);
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
    
    // Create a single chapter with all content (chapter detection comes in Epic 4)
    await prisma.chapter.create({
      data: {
        bookId,
        chapterNumber: 1,
        title: 'Full Book',
        content: text,
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
