import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db';
import { pdfQueue } from '@/lib/services/queue';
import { storageService } from '@/lib/services/storage';

/**
 * POST /api/jobs/[jobId]/retry
 * Retry a failed processing job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  console.log(`[Retry] Attempting to retry job ${jobId}`);
  
  try {
    // Find the processing job
    const processingJob = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: { book: true },
    });
    
    if (!processingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if job can be retried
    if (processingJob.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Job is not in FAILED status' },
        { status: 400 }
      );
    }
    
    if (processingJob.retryCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum retry attempts (3) exceeded' },
        { status: 400 }
      );
    }
    
    const { bookId, type } = processingJob;
    
    // Update job status to PENDING
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        progress: 0,
        error: null,
        retryCount: { increment: 1 },
      },
    });
    
    // Reset book status to PROCESSING
    await prisma.book.update({
      where: { id: bookId },
      data: {
        status: 'PROCESSING',
        errorMessage: null,
      },
    });
    
    // Re-queue the job in BullMQ
    const book = processingJob.book;
    
    // Prepare job data based on job type
    const jobData: Record<string, unknown> = {
      bookId,
      processingJobId: jobId,
    };
    
    // For AI_METADATA and CONVERT jobs, we need previous results
    // For now, we'll need to re-run the full chain or fetch previous results
    if (type === 'AI_METADATA' || type === 'CONVERT') {
      // Get previous job results if available
      const previousJobs = await prisma.processingJob.findMany({
        where: { bookId },
        orderBy: { createdAt: 'asc' },
      });
      
      // For AI_METADATA retry, we need EXTRACT results
      // For CONVERT retry, we need both EXTRACT and AI_METADATA results
      // Since we don't store the full results, we'll restart from EXTRACT
      if (type === 'CONVERT') {
        // Restart from AI_METADATA to get fresh data
        const aiJob = previousJobs.find(j => j.type === 'AI_METADATA');
        if (aiJob && aiJob.status === 'COMPLETED') {
          // Ideally we'd have stored the results, but for now restart chain
          // This is a limitation - in production, store job results in Redis/DB
        }
      }
    }
    
    // Add to BullMQ queue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pdfQueue.add(type, jobData as any);
    
    console.log(`[Retry] Job ${jobId} (${type}) re-queued successfully (retry ${processingJob.retryCount + 1})`);
    
    return NextResponse.json({
      success: true,
      message: 'Job retry initiated',
      jobId,
      retryCount: processingJob.retryCount + 1,
    });
    
  } catch (error) {
    console.error(`[Retry] Error retrying job ${jobId}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
