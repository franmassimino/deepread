import { prisma } from '@/lib/db/db';
import { JobStatus, JobType } from '@prisma/client';
import { pdfQueue } from '@/lib/services/queue';
import { ExtractJobResult } from './extract-job';
import { AIMetadataJobResult } from './ai-metadata-job';

/**
 * Update ProcessingJob status and progress
 */
export async function updateProcessingJob(
  jobId: string,
  status: JobStatus,
  progress: number,
  error?: string
): Promise<void> {
  try {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status,
        progress,
        error: error || null,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  } catch (err) {
    console.error(`[Job] Failed to update job ${jobId}:`, err);
  }
}

/**
 * Handle job failure - update job and book status
 */
export async function handleJobFailure(
  jobId: string,
  bookId: string,
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  console.error(`[Job] Job ${jobId} failed for book ${bookId}:`, errorMessage);
  
  try {
    // Update job status
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: errorMessage,
      },
    });
    
    // Update book status to ERROR
    await prisma.book.update({
      where: { id: bookId },
      data: {
        status: 'ERROR',
        errorMessage,
      },
    });
  } catch (err) {
    console.error(`[Job] Failed to handle job failure:`, err);
  }
}

/**
 * Create the next job in the chain and add to BullMQ queue
 */
export async function createNextJob(
  bookId: string,
  nextJobType: JobType,
  previousData?: ExtractJobResult | AIMetadataJobResult
): Promise<string | null> {
  try {
    // Create ProcessingJob record
    const processingJob = await prisma.processingJob.create({
      data: {
        bookId,
        type: nextJobType,
        status: 'PENDING',
        progress: 0,
      },
    });
    
    // Add to BullMQ queue with data from previous job
    const queueData: Record<string, unknown> = {
      bookId,
      processingJobId: processingJob.id,
    };
    
    // Pass through data from previous jobs
    if (nextJobType === 'AI_METADATA' && previousData) {
      // AI_METADATA receives EXTRACT results
      queueData.extractionResult = previousData;
    } else if (nextJobType === 'CONVERT' && previousData) {
      // CONVERT receives both EXTRACT and AI_METADATA results
      if ('chapters' in previousData) {
        // previousData is AIMetadataJobResult, need to get extractionResult from elsewhere
        // For now, we'll fetch the latest extraction result
        const extractJob = await prisma.processingJob.findFirst({
          where: { bookId, type: 'EXTRACT' },
          orderBy: { createdAt: 'desc' },
        });
        if (extractJob) {
          // Store extraction results temporarily or pass via job data
          // For now, we'll need to re-extract or store in a temp location
          // This is a known limitation - ideally we'd pass both results
        }
        queueData.metadataResult = previousData;
      }
    }
    
    await pdfQueue.add(nextJobType, queueData);
    
    console.log(`[Job] Created and queued ${nextJobType} job ${processingJob.id} for book ${bookId}`);
    return processingJob.id;
  } catch (err) {
    console.error(`[Job] Failed to create ${nextJobType} job:`, err);
    return null;
  }
}

/**
 * Create and queue a job with full data
 */
export async function queueJobWithData<T extends Record<string, unknown>>(
  bookId: string,
  jobType: JobType,
  jobData: T
): Promise<string | null> {
  try {
    const processingJob = await prisma.processingJob.create({
      data: {
        bookId,
        type: jobType,
        status: 'PENDING',
        progress: 0,
      },
    });
    
    await pdfQueue.add(jobType, {
      ...jobData,
      processingJobId: processingJob.id,
    });
    
    console.log(`[Job] Queued ${jobType} job ${processingJob.id} for book ${bookId}`);
    return processingJob.id;
  } catch (err) {
    console.error(`[Job] Failed to queue ${jobType} job:`, err);
    return null;
  }
}

/**
 * Get the latest job for a book by type
 */
export async function getLatestJob(
  bookId: string,
  type: JobType
) {
  return prisma.processingJob.findFirst({
    where: { bookId, type },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if all jobs for a book are completed
 */
export async function areAllJobsCompleted(bookId: string): Promise<boolean> {
  const incompleteJobs = await prisma.processingJob.count({
    where: {
      bookId,
      status: { not: 'COMPLETED' },
    },
  });
  
  return incompleteJobs === 0;
}

/**
 * Get job chain status for a book
 */
export async function getJobChainStatus(bookId: string) {
  const jobs = await prisma.processingJob.findMany({
    where: { bookId },
    orderBy: { createdAt: 'asc' },
  });
  
  const extractJob = jobs.find(j => j.type === 'EXTRACT');
  const aiJob = jobs.find(j => j.type === 'AI_METADATA');
  const convertJob = jobs.find(j => j.type === 'CONVERT');
  
  return {
    extract: extractJob,
    aiMetadata: aiJob,
    convert: convertJob,
    overallStatus: calculateOverallStatus(jobs),
    overallProgress: calculateOverallProgress(jobs),
  };
}

function calculateOverallStatus(jobs: { status: JobStatus }[]): JobStatus | 'UNKNOWN' {
  if (jobs.length === 0) return 'UNKNOWN';
  if (jobs.some(j => j.status === 'FAILED')) return 'FAILED';
  if (jobs.every(j => j.status === 'COMPLETED')) return 'COMPLETED';
  if (jobs.some(j => j.status === 'ACTIVE')) return 'ACTIVE';
  return 'PENDING';
}

function calculateOverallProgress(jobs: { type: JobType; progress: number }[]): number {
  if (jobs.length === 0) return 0;
  
  // Weight by job type
  const weights: Record<JobType, number> = {
    EXTRACT: 0.4,
    AI_METADATA: 0.3,
    CONVERT: 0.3,
  };
  
  let totalProgress = 0;
  let totalWeight = 0;
  
  for (const job of jobs) {
    const weight = weights[job.type] || 0.33;
    totalProgress += job.progress * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
}
