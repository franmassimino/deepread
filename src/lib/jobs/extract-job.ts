import { Job } from 'bullmq';
import { extractTextFromPDF, extractTablesFromPDF, isScannedPDF, getWordCount, PDFExtractionError } from '@/lib/services/pdf-extraction';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';
import { pdfQueue } from '@/lib/services/queue';
import { updateProcessingJob, handleJobFailure } from './job-utils';

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
 * Extracts text and tables from PDF, then queues AI_METADATA job with results
 */
export async function extractProcessor(job: Job<ExtractJobData>): Promise<ExtractJobResult> {
  const { bookId, processingJobId } = job.data;
  
  console.log(`[ExtractJob] Starting extraction for book ${bookId}, job ${processingJobId}`);
  
  // Update job status to ACTIVE
  await updateProcessingJob(processingJobId, 'ACTIVE', 0, undefined, 'extract-text', 'Extracting text...');
  
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
    await updateProcessingJob(processingJobId, 'ACTIVE', 10, undefined, 'extract-text', 'Extracting text...');
    const { text, pageCount } = await extractTextFromPDF(pdfPath);
    
    if (isScannedPDF(text)) {
      throw new PDFExtractionError('PDF appears to be scanned or contains no extractable text', pdfPath);
    }
    
    const wordCount = getWordCount(text);
    console.log(`[ExtractJob] Extracted ${pageCount} pages, ${wordCount} words`);
    
    await job.updateProgress(33);
    await updateProcessingJob(processingJobId, 'ACTIVE', 33, undefined, 'extract-text', 'Text extraction complete');
    
    // Stage 2: Extract tables (33-66%)
    await job.updateProgress(50);
    await updateProcessingJob(processingJobId, 'ACTIVE', 50, undefined, 'extract-visual', 'Extracting tables and images...');
    let tables: { html: string; pageNumber: number }[] = [];
    try {
      tables = await extractTablesFromPDF(pdfPath);
      console.log(`[ExtractJob] Extracted ${tables.length} tables`);
    } catch (tableError) {
      console.warn(`[ExtractJob] Table extraction failed (continuing):`, tableError);
    }
    
    await job.updateProgress(66);
    await updateProcessingJob(processingJobId, 'ACTIVE', 66, undefined, 'extract-visual', 'Table extraction complete');
    
    // Stage 3: Mark extraction complete (66-100%)
    await job.updateProgress(100);
    await updateProcessingJob(processingJobId, 'COMPLETED', 100, undefined, 'completed', 'Extraction complete');
    
    console.log(`[ExtractJob] Completed for book ${bookId}`);
    
    // Prepare result
    const result: ExtractJobResult = {
      text,
      pageCount,
      tables,
      wordCount,
    };
    
    // Create and queue AI_METADATA job with extraction results
    const nextProcessingJob = await prisma.processingJob.create({
      data: {
        bookId,
        type: 'AI_METADATA',
        status: 'PENDING',
        progress: 0,
        stage: 'pending',
        message: 'Waiting to start...',
      },
    });
    
    await pdfQueue.add('AI_METADATA', {
      bookId,
      processingJobId: nextProcessingJob.id,
      extractionResult: result,
    });
    
    console.log(`[ExtractJob] Queued AI_METADATA job ${nextProcessingJob.id} with extraction data`);
    
    return result;
    
  } catch (error) {
    await handleJobFailure(processingJobId, bookId, error);
    throw error; // Re-throw for BullMQ retry
  }
}
