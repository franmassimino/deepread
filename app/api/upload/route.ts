import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storage';
import { prisma } from '@/lib/db/db';
import crypto from 'crypto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validates PDF by checking magic bytes (%PDF)
 */
function isPDF(buffer: Buffer): boolean {
  const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
  return buffer.slice(0, 4).equals(pdfMagic);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds 50MB limit' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isPDF(buffer)) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const bookId = crypto.randomUUID();
    const pdfPath = `pdfs/${bookId}/${file.name}`;

    await storageService.saveFile(pdfPath, buffer);

    const book = await prisma.book.create({
      data: {
        id: bookId,
        title: file.name.replace('.pdf', ''),
        pdfPath,
        summary: '', // Will be populated by AI in Epic 4
        status: 'PROCESSING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        bookId: book.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
