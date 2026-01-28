import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db';

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

    return NextResponse.json({ books });
  } catch (error) {
    console.error('[Books API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
