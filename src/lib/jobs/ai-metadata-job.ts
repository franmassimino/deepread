import { Job } from 'bullmq';
import { prisma } from '@/lib/db/db';
import { pdfQueue } from '@/lib/services/queue';
import { updateProcessingJob, handleJobFailure } from './job-utils';
import { ExtractJobResult } from './extract-job';

export interface AIMetadataJobData {
  bookId: string;
  processingJobId: string;
  extractionResult: ExtractJobResult;
}

export interface AIMetadataJobResult {
  summary: string;
  chapters: { title: string; startWord: number; endWord: number }[];
  detectedTitle?: string;
  detectedAuthor?: string;
}

/**
 * AI_METADATA job processor
 * Generates summary, detects chapters, extracts metadata
 * Then queues CONVERT job with all data
 * 
 * NOTE: This is a stub implementation for MVP
 * Full implementation requires Mastra AI integration (Epic 4)
 */
export async function aiMetadataProcessor(job: Job<AIMetadataJobData>): Promise<AIMetadataJobResult> {
  const { bookId, processingJobId, extractionResult } = job.data;
  const { text, pageCount, wordCount } = extractionResult;
  
  console.log(`[AIMetadataJob] Starting AI processing for book ${bookId}, job ${processingJobId}`);
  
  // Update job status to ACTIVE
  await updateProcessingJob(processingJobId, 'ACTIVE', 0, undefined, 'ai-analysis', 'Analyzing content...');
  
  try {
    // Stage 1: Generate summary (0-40%)
    await job.updateProgress(10);
    await updateProcessingJob(processingJobId, 'ACTIVE', 10, undefined, 'ai-analysis', 'Generating summary...');
    
    // For MVP, create a simple summary from first 500 words
    const summaryText = text.slice(0, 2000);
    const summary = summaryText.length > 100 
      ? summaryText.slice(0, 200) + '...'
      : 'Summary unavailable';
    
    await job.updateProgress(40);
    await updateProcessingJob(processingJobId, 'ACTIVE', 40, undefined, 'ai-analysis', 'Summary generated');
    
    // Stage 2: Detect chapters (40-70%)
    await job.updateProgress(50);
    await updateProcessingJob(processingJobId, 'ACTIVE', 50, undefined, 'ai-analysis', 'Detecting chapters...');
    
    // For MVP, create a single chapter with all content
    // Full implementation will use Mastra to detect chapter boundaries
    const chapters = [
      {
        title: 'Full Book',
        startWord: 0,
        endWord: wordCount,
      }
    ];
    
    // Try to detect chapter headings from text (simple heuristic)
    const chapterMatches = text.match(/(?:CHAPTER|Chapter)\s+\d+[\s:.-]+([^.\n]+)/g);
    if (chapterMatches && chapterMatches.length > 1) {
      // If we found chapter headings, create multiple chapters
      chapters.length = 0;
      chapterMatches.forEach((match, idx) => {
        chapters.push({
          title: match.trim(),
          startWord: Math.floor((wordCount / chapterMatches.length) * idx),
          endWord: Math.floor((wordCount / chapterMatches.length) * (idx + 1)),
        });
      });
    }
    
    await job.updateProgress(70);
    await updateProcessingJob(processingJobId, 'ACTIVE', 70, undefined, 'ai-analysis', 'Chapters detected');
    
    // Stage 3: Extract title and author (70-100%)
    await job.updateProgress(80);
    await updateProcessingJob(processingJobId, 'ACTIVE', 80, undefined, 'ai-analysis', 'Extracting metadata...');
    
    // Try to extract title from first line
    const firstLine = text.split('\n')[0]?.trim();
    const detectedTitle = firstLine && firstLine.length < 100 ? firstLine : undefined;
    
    await job.updateProgress(100);
    await updateProcessingJob(processingJobId, 'COMPLETED', 100, undefined, 'completed', 'AI analysis complete');
    
    // Update book with summary
    await prisma.book.update({
      where: { id: bookId },
      data: {
        summary,
        title: detectedTitle || 'Untitled Book',
      },
    });
    
    console.log(`[AIMetadataJob] Completed for book ${bookId}`);
    
    // Prepare result
    const result: AIMetadataJobResult = {
      summary,
      chapters,
      detectedTitle,
    };
    
    // Create and queue CONVERT job with both extraction and metadata results
    const nextProcessingJob = await prisma.processingJob.create({
      data: {
        bookId,
        type: 'CONVERT',
        status: 'PENDING',
        progress: 0,
        stage: 'pending',
        message: 'Waiting to start...',
      },
    });
    
    await pdfQueue.add('CONVERT', {
      bookId,
      processingJobId: nextProcessingJob.id,
      extractionResult,
      metadataResult: result,
    });
    
    console.log(`[AIMetadataJob] Queued CONVERT job ${nextProcessingJob.id} with full data`);
    
    return result;
    
  } catch (error) {
    await handleJobFailure(processingJobId, bookId, error);
    throw error;
  }
}
