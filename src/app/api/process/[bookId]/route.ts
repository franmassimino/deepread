import { NextRequest, NextResponse } from 'next/server';
import { pdfQueue } from '@/lib/services/queue';
import { prisma } from '@/lib/db/db';
import { storageService } from '@/lib/services/storage';
import { PDFExtractionError } from '@/lib/services/pdf-extraction';

/**
 * POST /api/process/[bookId]
 * Triggers job chain for PDF processing (EXTRACT → AI_METADATA → CONVERT)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  console.log(`[Process] Starting job chain for book: ${bookId}`);
  
  try {
    // Verify book exists and PDF is available
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    if (!await storageService.fileExists(book.pdfPath)) {
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      );
    }
    
    // Create ProcessingJob record for EXTRACT job
    const processingJob = await prisma.processingJob.create({
      data: {
        bookId,
        type: 'EXTRACT',
        status: 'PENDING',
        progress: 0,
      },
    });
    
    // Add EXTRACT job to queue
    const job = await pdfQueue.add('EXTRACT', {
      bookId,
      processingJobId: processingJob.id,
    });
    
    console.log(`[Process] Queued EXTRACT job ${job.id} for book ${bookId}`);
    
    return NextResponse.json({
      accepted: true,
      bookId,
      jobId: job.id,
      processingJobId: processingJob.id,
      message: 'PDF processing started',
    });
    
  } catch (error) {
    console.error(`[Process] Error starting job chain for book ${bookId}:`, error);
    
    const errorMessage = error instanceof PDFExtractionError
      ? error.message
      : error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/process/[bookId]
 * Get processing status for a book
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  
  try {
    // Get all processing jobs for this book
    const jobs = await prisma.processingJob.findMany({
      where: { bookId },
      orderBy: { createdAt: 'asc' },
    });
    
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { status: true, errorMessage: true },
    });
    
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    // Calculate overall progress
    const totalProgress = jobs.length > 0
      ? Math.round(jobs.reduce((acc, j) => acc + j.progress, 0) / (jobs.length * 3))
      : 0;
    
    return NextResponse.json({
      bookId,
      bookStatus: book.status,
      bookError: book.errorMessage,
      overallProgress: Math.min(totalProgress, 100),
      jobs: jobs.map(j => ({
        id: j.id,
        type: j.type,
        status: j.status,
        progress: j.progress,
        error: j.error,
        retryCount: j.retryCount,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
      })),
    });
    
  } catch (error) {
    console.error(`[Process] Error getting status for book ${bookId}:`, error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}
