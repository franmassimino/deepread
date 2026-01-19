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
  console.log('[Upload] --- START ---');
  console.log('[Upload] NODE_ENV:', process.env.NODE_ENV);

  try {
    console.log('[Upload] Parsing formData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('[Upload] ERROR: No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('[Upload] File received:', file.name, 'size:', file.size);

    if (file.size > MAX_FILE_SIZE) {
      console.log('[Upload] ERROR: File too large');
      return NextResponse.json(
        { error: 'File exceeds 50MB limit' },
        { status: 413 }
      );
    }

    console.log('[Upload] Converting to buffer...');
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('[Upload] Buffer length:', buffer.length);

    if (!isPDF(buffer)) {
      console.log('[Upload] ERROR: Invalid PDF magic bytes');
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const bookId = crypto.randomUUID();
    const pdfPath = `pdfs/${bookId}/${file.name}`;
    console.log('[Upload] Saving to storage:', pdfPath);

    await storageService.saveFile(pdfPath, buffer);
    console.log('[Upload] Storage save OK');

    console.log('[Upload] Creating DB record...');
    const book = await prisma.book.create({
      data: {
        id: bookId,
        title: file.name.replace('.pdf', ''),
        pdfPath,
        summary: '',
        status: 'PROCESSING',
      },
    });
    console.log('[Upload] DB record created:', book.id);

    console.log('[Upload] --- SUCCESS ---');
    return NextResponse.json(
      {
        success: true,
        bookId: book.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Upload] --- ERROR ---');
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
