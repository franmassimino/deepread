import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

/**
 * Result of PDF text extraction
 */
export interface PDFExtractionResult {
  /** Extracted text content */
  text: string;
  /** Number of pages in the PDF */
  pageCount: number;
  /** PDF metadata/info */
  info: Record<string, unknown>;
}

/**
 * Custom error for PDF extraction failures
 */
export class PDFExtractionError extends Error {
  constructor(
    message: string,
    public readonly pdfPath: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PDFExtractionError';
  }
}

/**
 * Extracts text content from a PDF file
 * @param pdfPath - Absolute path to the PDF file
 * @returns Extraction result with text, page count, and metadata
 * @throws PDFExtractionError if extraction fails
 */
export async function extractTextFromPDF(pdfPath: string): Promise<PDFExtractionResult> {
  try {
    // Read PDF file into buffer
    const buffer = await fs.readFile(pdfPath);
    
    // Parse PDF content using pdf-parse
    const data = await pdfParse(buffer);
    
    return {
      text: data.text || '',
      pageCount: data.numpages || 0,
      info: data.info as Record<string, unknown> || {},
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof PDFExtractionError) {
      throw error;
    }
    
    if (error instanceof Error) {
      // Check for common PDF errors
      if (error.message.includes('Invalid PDF')) {
        throw new PDFExtractionError(
          'Invalid or corrupted PDF file',
          pdfPath,
          error
        );
      }
      
      if (error.message.includes('ENOENT')) {
        throw new PDFExtractionError(
          'PDF file not found',
          pdfPath,
          error
        );
      }
      
      throw new PDFExtractionError(
        `Failed to extract text from PDF: ${error.message}`,
        pdfPath,
        error
      );
    }
    
    throw new PDFExtractionError(
      'Unknown error during PDF extraction',
      pdfPath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Checks if extracted text is likely from a scanned/image-based PDF
 * @param text - Extracted text
 * @returns true if text appears to be from a scanned PDF
 */
export function isScannedPDF(text: string): boolean {
  if (!text) return true;
  
  // Remove whitespace and check if anything meaningful remains
  const cleanedText = text.replace(/\s+/g, '');
  
  // If less than 100 characters of non-whitespace content, likely scanned
  if (cleanedText.length < 100) {
    return true;
  }
  
  // Check for common indicators of scanned PDFs
  // Scanned PDFs often have very little text or garbled content
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 20) {
    return true;
  }
  
  return false;
}

/**
 * Gets word count from extracted text
 * @param text - Extracted text
 * @returns Number of words
 */
export function getWordCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  return text.trim().split(/\s+/).length;
}
