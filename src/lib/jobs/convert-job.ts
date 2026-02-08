import { Job } from 'bullmq';
import { prisma } from '@/lib/db/db';
import { convertAndSanitize } from '@/lib/services/content-converter';
import { updateProcessingJob, handleJobFailure } from './job-utils';
import { AIMetadataJobResult } from './ai-metadata-job';
import { ExtractJobResult } from './extract-job';

export interface ConvertJobData {
  bookId: string;
  processingJobId: string;
  // Pass through data from previous jobs
  extractionResult: ExtractJobResult;
  metadataResult: AIMetadataJobResult;
}

/**
 * CONVERT job processor
 * Converts extracted content to HTML and creates chapter records
 */
export async function convertProcessor(job: Job<ConvertJobData>): Promise<void> {
  const { bookId, processingJobId, extractionResult, metadataResult } = job.data;
  const { text, pageCount, tables, wordCount } = extractionResult;
  const { chapters } = metadataResult;
  
  console.log(`[ConvertJob] Starting conversion for book ${bookId}, job ${processingJobId}`);
  
  // Update job status to ACTIVE
  await updateProcessingJob(processingJobId, 'ACTIVE', 0);
  
  try {
    // Stage 1: Prepare content with placeholders (0-33%)
    await job.updateProgress(10);
    
    let contentWithPlaceholders = text;
    if (tables.length > 0) {
      contentWithPlaceholders += '\n\n---\n\n' + tables.map((t, i) => `[TABLE:${i}]`).join('\n\n');
    }
    
    await job.updateProgress(33);
    await updateProcessingJob(processingJobId, 'ACTIVE', 33);
    
    // Stage 2: Convert to HTML (33-66%)
    await job.updateProgress(50);
    
    const { html: convertedHtml, stats } = convertAndSanitize(contentWithPlaceholders, tables);
    
    console.log(`[ConvertJob] Conversion stats:`, stats);
    
    await job.updateProgress(66);
    await updateProcessingJob(processingJobId, 'ACTIVE', 66);
    
    // Stage 3: Create chapter records and update book (66-100%)
    await job.updateProgress(80);
    
    // Create chapters from detected chapters
    const chapterData = chapters.map((ch, idx) => ({
      bookId,
      chapterNumber: idx + 1,
      title: ch.title,
      content: convertedHtml,
      wordCount,
      startPage: 1,
      endPage: pageCount,
    }));
    
    // Update book and create chapters in transaction
    await prisma.$transaction([
      ...chapterData.map(ch => prisma.chapter.create({ data: ch })),
      prisma.book.update({
        where: { id: bookId },
        data: {
          status: 'READY',
          totalPages: pageCount,
          wordCount,
        },
      }),
    ]);
    
    await job.updateProgress(100);
    await updateProcessingJob(processingJobId, 'COMPLETED', 100);
    
    console.log(`[ConvertJob] Completed for book ${bookId}`);
    console.log(`[ConvertJob] Created ${chapters.length} chapter(s), book status: READY`);
    
  } catch (error) {
    await handleJobFailure(processingJobId, bookId, error);
    throw error;
  }
}
