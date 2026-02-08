import { Job } from 'bullmq';
import { extractTextFromPDF, extractTablesFromPDF, isScannedPDF, getWordCount, PDFExtractionError } from '@/lib/services/pdf-extraction';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';
import { updateProcessingJob, handleJobFailure, createNextJob } from './job-utils';

export interface ExtractJobData {
  bookId: string;
  processingJobId: string;
}

export interface ExtractJobResult {
  text: string;
  pageCount: number;
  tables: { html: string; pageNumber: number }[];
  wordCount: number;
}

/**
 * EXTRACT job processor
 * Extracts text and tables from PDF
 */
export async function extractProcessor(job: Job<ExtractJobData>): Promise<ExtractJobResult> {
  const { bookId, processingJobId } = job.data;
  
  console.log(`[ExtractJob] Starting extraction for book ${bookId}, job ${processingJobId}`);
  
  // Update job status to ACTIVE
  await updateProcessingJob(processingJobId, 'ACTIVE', 0);
  
  try {
    // Get book details
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new PDFExtractionError('Book not found', '');
    }
    
    const pdfPath = storageService.getFilePath(book.pdfPath);
    
    if (!await storageService.fileExists(book.pdfPath)) {
      throw new PDFExtractionError('PDF file not found', pdfPath);
    }
    
    // Stage 1: Extract text (0-33%)
    await job.updateProgress(10);
    const { text, pageCount } = await extractTextFromPDF(pdfPath);
    
    if (isScannedPDF(text)) {
      throw new PDFExtractionError('PDF appears to be scanned or contains no extractable text', pdfPath);
    }
    
    const wordCount = getWordCount(text);
    console.log(`[ExtractJob] Extracted ${pageCount} pages, ${wordCount} words`);
    
    await job.updateProgress(33);
    await updateProcessingJob(processingJobId, 'ACTIVE', 33);
    
    // Stage 2: Extract tables (33-66%)
    await job.updateProgress(50);
    let tables: { html: string; pageNumber: number }[] = [];
    try {
      tables = await extractTablesFromPDF(pdfPath);
      console.log(`[ExtractJob] Extracted ${tables.length} tables`);
    } catch (tableError) {
      console.warn(`[ExtractJob] Table extraction failed (continuing):`, tableError);
    }
    
    await job.updateProgress(66);
    await updateProcessingJob(processingJobId, 'ACTIVE', 66);
    
    // Stage 3: Mark extraction complete (66-100%)
    await job.updateProgress(100);
    await updateProcessingJob(processingJobId, 'COMPLETED', 100);
    
    console.log(`[ExtractJob] Completed for book ${bookId}`);
    
    // Create AI_METADATA job
    const nextJobId = await createNextJob(bookId, 'AI_METADATA');
    if (nextJobId) {
      console.log(`[ExtractJob] Queued AI_METADATA job ${nextJobId}`);
    }
    
    return {
      text,
      pageCount,
      tables,
      wordCount,
    };
    
  } catch (error) {
    await handleJobFailure(processingJobId, bookId, error);
    throw error; // Re-throw for BullMQ retry
  }
}
