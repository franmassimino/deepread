import { NextResponse } from 'next/server'
import { storageService } from '@/src/lib/services/storage'
import { prisma } from '@/lib/db/db'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Validates PDF by checking magic bytes (%PDF)
 */
function isPDF(buffer: Buffer): boolean {
  const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF
  return buffer.slice(0, 4).equals(pdfMagic)
}

export async function POST(request: Request) {
  console.log('--- UPLOAD START ---')
  console.log('runtime:', process.env.NEXT_RUNTIME)
  console.log('content-type:', request.headers.get('content-type'))
  console.log('content-length:', request.headers.get('content-length'))

  try {
    console.time('formData')
    const formData = await request.formData()
    console.timeEnd('formData')

    const keys = Array.from(formData.keys())
    console.log('formData keys:', keys)

    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      console.error('No file in formData')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('file name:', file.name)
    console.log('file size:', file.size)
    console.log('file type:', file.type)

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds 50MB limit' },
        { status: 413 }
      )
    }

    console.time('arrayBuffer')
    const buffer = Buffer.from(await file.arrayBuffer())
    console.timeEnd('arrayBuffer')

    console.log('buffer length:', buffer.length)

    if (!isPDF(buffer)) {
      console.error('Invalid PDF magic bytes')
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      )
    }

    const bookId = crypto.randomUUID()
    const pdfPath = `pdfs/${bookId}/${file.name}`

    console.time('storage')
    await storageService.saveFile(pdfPath, buffer)
    console.timeEnd('storage')

    console.time('db')
    const book = await prisma.book.create({
      data: {
        id: bookId,
        title: file.name.replace(/\.pdf$/i, ''),
        pdfPath,
        summary: '',
        status: 'PROCESSING',
      },
    })
    console.timeEnd('db')

    console.log('UPLOAD OK', book.id)
    console.log('--- UPLOAD END ---')

    return NextResponse.json(
      { success: true, bookId: book.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('UPLOAD ERROR', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
