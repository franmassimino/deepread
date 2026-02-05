import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db';

/**
 * GET /api/books/[id]/status
 * Returns the processing status of a book
 * Used for polling during PDF extraction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch book status from database
    const book = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        errorMessage: true,
        totalPages: true,
        wordCount: true,
        title: true,
        author: true,
      }
    });
    
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    // Return status information
    return NextResponse.json({
      id: book.id,
      status: book.status,
      error: book.errorMessage,
      progress: calculateProgress(book.status),
      metadata: {
        totalPages: book.totalPages,
        wordCount: book.wordCount,
        title: book.title,
        author: book.author,
      }
    });
    
  } catch (error) {
    console.error('[Status] Error fetching book status:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch book status' },
      { status: 500 }
    );
  }
}

/**
 * Calculate a simple progress percentage based on status
 * Note: This is a simplified version. In the future, we could track
 * actual extraction progress with more granular updates.
 */
function calculateProgress(status: string): number {
  switch (status) {
    case 'PROCESSING':
      return 50; // Processing in progress
    case 'READY':
      return 100; // Complete
    case 'ERROR':
      return 0; // Failed
    default:
      return 0;
  }
}
