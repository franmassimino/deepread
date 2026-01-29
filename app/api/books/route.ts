import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db';

// Disable Next.js caching for this route - we want fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        author: true,
        status: true,
        createdAt: true,
      },
    });

    // Add cache headers for client-side caching (5 seconds)
    return NextResponse.json({ books }, {
      headers: {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=10',
      },
    });
  } catch (error) {
    console.error('[Books API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
