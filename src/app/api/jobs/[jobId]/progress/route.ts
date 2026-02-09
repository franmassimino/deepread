import { NextRequest } from 'next/server';
import { pdfQueue } from '@/lib/services/queue';
import { prisma } from '@/lib/db/db';

/**
 * GET /api/jobs/[jobId]/progress
 * Server-Sent Events endpoint for real-time job progress updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Verify job exists in database
  const processingJob = await prisma.processingJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      bookId: true,
      type: true,
      status: true,
      progress: true,
      stage: true,
      message: true,
      error: true,
    },
  });

  if (!processingJob) {
    return new Response(
      JSON.stringify({ error: 'Job not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Set SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      const initialData = {
        jobId: processingJob.id,
        bookId: processingJob.bookId,
        type: processingJob.type,
        status: processingJob.status,
        progress: processingJob.progress,
        overallProgress: calculateOverallProgress(processingJob.type, processingJob.progress),
        stage: processingJob.stage,
        message: processingJob.message,
        error: processingJob.error,
      };
      
      controller.enqueue(
        `data: ${JSON.stringify(initialData)}\n\n`
      );

      // Set up keep-alive interval
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(':keep-alive\n\n');
        } catch {
          // Controller closed, interval will be cleared
        }
      }, 30000); // Send keep-alive every 30 seconds

      // Poll for updates every 500ms
      const pollInterval = setInterval(async () => {
        try {
          // Check if client disconnected
          if (request.signal.aborted) {
            clearInterval(pollInterval);
            clearInterval(keepAliveInterval);
            controller.close();
            return;
          }

          // Fetch latest job data from database
          const updatedJob = await prisma.processingJob.findUnique({
            where: { id: jobId },
            select: {
              status: true,
              progress: true,
              stage: true,
              message: true,
              error: true,
            },
          });

          if (!updatedJob) {
            // Job was deleted
            clearInterval(pollInterval);
            clearInterval(keepAliveInterval);
            controller.enqueue(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
            controller.close();
            return;
          }

          // Also check BullMQ job status for more accurate progress
          const bullJob = await pdfQueue.getJob(jobId);
          const bullProgress = bullJob?.progress as number | undefined;

          const data = {
            jobId,
            status: updatedJob.status,
            progress: bullProgress ?? updatedJob.progress,
            overallProgress: calculateOverallProgress(processingJob.type, bullProgress ?? updatedJob.progress),
            stage: updatedJob.stage,
            message: updatedJob.message,
            error: updatedJob.error,
          };

          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

          // Close connection if job is in terminal state
          if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') {
            clearInterval(pollInterval);
            clearInterval(keepAliveInterval);
            setTimeout(() => controller.close(), 100);
          }
        } catch (err) {
          console.error('[SSE] Error polling job status:', err);
        }
      }, 500); // Poll every 500ms

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(keepAliveInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, { headers });
}

/**
 * Calculate overall progress for the entire job chain
 */
function calculateOverallProgress(type: string, progress: number): number {
  const ranges: Record<string, { min: number; max: number }> = {
    EXTRACT: { min: 0, max: 40 },
    AI_METADATA: { min: 40, max: 70 },
    CONVERT: { min: 70, max: 100 },
  };

  const range = ranges[type] || { min: 0, max: 100 };
  return Math.round(range.min + (progress / 100) * (range.max - range.min));
}
