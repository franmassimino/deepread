import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db';
import { storageService } from '@/lib/services/storage';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate book exists and get book data
    const book = await prisma.book.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Delete storage files (PDF and images)
    // This happens before DB deletion so we can still access book data
    try {
      await storageService.deleteBookFiles(id);
      console.log(`[Books API] Deleted storage files for book: ${id}`);
    } catch (storageError) {
      // Log warning but continue - files may not exist
      console.warn(`[Books API] Storage deletion warning for ${id}:`, storageError);
    }

    // Delete book from database (cascades to chapters and readingProgress)
    await prisma.book.delete({
      where: { id },
    });

    console.log(`[Books API] Successfully deleted book: ${id} (${book.title})`);

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('[Books API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
