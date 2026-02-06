// Import from lib directly to bypass debug code that references missing test files
// See: https://github.com/albertyeh/pdf-parse/issues/2
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import fs from 'fs/promises';
import path from 'path';

/**
 * Maximum PDF file size for image extraction (100MB)
 * Larger files may cause memory issues
 */
const MAX_PDF_SIZE_BYTES = 100 * 1024 * 1024;

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
 * Metadata for extracted images
 */
export interface ExtractedImage {
  /** Filename of the saved image */
  filename: string;
  /** Page number where image was found */
  pageNumber: number;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

/**
 * Metadata for extracted tables
 */
export interface ExtractedTable {
  /** HTML representation of the table */
  html: string;
  /** Page number where table was found */
  pageNumber: number;
  /** Row count */
  rowCount: number;
  /** Column count */
  colCount: number;
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
 * Checks if file size is within limits
 * @param pdfPath - Path to PDF file
 * @throws PDFExtractionError if file too large
 */
async function validateFileSize(pdfPath: string): Promise<void> {
  try {
    const stats = await fs.stat(pdfPath);
    if (stats.size > MAX_PDF_SIZE_BYTES) {
      throw new PDFExtractionError(
        `PDF file too large (${(stats.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: ${MAX_PDF_SIZE_BYTES / 1024 / 1024}MB`,
        pdfPath
      );
    }
  } catch (error) {
    if (error instanceof PDFExtractionError) throw error;
    
    // Check if it's a "file not found" error
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new PDFExtractionError(
        'PDF file not found',
        pdfPath,
        error
      );
    }
    
    throw new PDFExtractionError(
      'Failed to check PDF file size',
      pdfPath,
      error instanceof Error ? error : undefined
    );
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
    // Validate file size
    await validateFileSize(pdfPath);
    
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
 * Extracts images from a PDF file and saves them to storage
 * @param pdfPath - Absolute path to the PDF file
 * @param bookId - Book ID for creating storage directory
 * @param storageBasePath - Base path for storage (default: ./storage)
 * @returns Array of extracted image metadata
 * @throws PDFExtractionError if extraction fails
 */
export async function extractImagesFromPDF(
  pdfPath: string, 
  bookId: string,
  storageBasePath: string = './storage'
): Promise<ExtractedImage[]> {
  try {
    // Validate file size first
    await validateFileSize(pdfPath);
    
    const images: ExtractedImage[] = [];
    
    // Read PDF file
    const buffer = await fs.readFile(pdfPath);
    const data = new Uint8Array(buffer);
    
    // Load PDF document
    const pdf = await pdfjs.getDocument({ data }).promise;
    
    // Create images directory
    const imagesDir = path.join(storageBasePath, 'images', bookId);
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get viewport for rendering
      const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better quality
      
      // Create canvas using node-canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      // Render page to canvas
      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport: viewport
      }).promise;
      
      // Convert to PNG buffer
      const imageBuffer = canvas.toBuffer('image/png');
      
      // Only save if we got actual image data
      if (imageBuffer && imageBuffer.length > 100) { // Min 100 bytes for valid PNG
        const filename = `page-${pageNum}.png`;
        const imagePath = path.join(imagesDir, filename);
        
        await fs.writeFile(imagePath, imageBuffer);
        
        images.push({
          filename,
          pageNumber: pageNum,
          width: Math.round(viewport.width),
          height: Math.round(viewport.height)
        });
        
        console.log(`[PDF] Extracted image from page ${pageNum}: ${filename} (${viewport.width}x${viewport.height})`);
      }
      
      // Clean up page resources
      page.cleanup();
    }
    
    console.log(`[PDF] Total images extracted: ${images.length} from ${pdf.numPages} pages`);
    return images;
    
  } catch (error) {
    if (error instanceof PDFExtractionError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new PDFExtractionError(
        `Failed to extract images from PDF: ${error.message}`,
        pdfPath,
        error
      );
    }
    
    throw new PDFExtractionError(
      'Unknown error during image extraction',
      pdfPath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Analyzes text positions to detect table structures
 * Uses heuristics: consistent column alignment across multiple rows
 * @param pdfPath - Absolute path to the PDF file
 * @returns Array of extracted tables as HTML
 * @throws PDFExtractionError if extraction fails
 */
export async function extractTablesFromPDF(pdfPath: string): Promise<ExtractedTable[]> {
  try {
    // Validate file size
    await validateFileSize(pdfPath);
    
    const tables: ExtractedTable[] = [];
    
    // Read PDF file
    const buffer = await fs.readFile(pdfPath);
    
    // Use pdf-parse with custom renderer to get text positions
    let pageNum = 0;
    
    await pdfParse(buffer, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pagerender: async function(pageData: any) {
        pageNum++;
        
        try {
          // Get text content with positions
          const textContent = await pageData.getTextContent();
          const items = textContent.items || [];
          
          // Filter valid text items
          const validItems = items.filter((item: { str?: string }) => 
            item.str && item.str.trim().length > 0
          );
          
          if (validItems.length === 0) return textContent;
          
          // Group text items by Y position (rows)
          // Use tolerance of 3 points for vertical alignment
          const rowGroups = new Map<number, typeof validItems>();
          
          for (const item of validItems) {
            const yPos = item.transform?.[5] || item.y || 0;
            const yKey = Math.round(yPos / 3) * 3; // Group within 3pt tolerance
            
            if (!rowGroups.has(yKey)) {
              rowGroups.set(yKey, []);
            }
            rowGroups.get(yKey)!.push(item);
          }
          
          // Sort rows by Y position (top to bottom)
          const sortedRows = Array.from(rowGroups.entries())
            .sort((a, b) => b[0] - a[0]) // Higher Y = higher on page
            .map(([_, items]) => items);
          
          // Detect tables using improved heuristics
          const detectedTables = detectTables(sortedRows, pageNum);
          tables.push(...detectedTables);
          
          return textContent;
        } catch (err) {
          console.warn(`[PDF] Error processing page ${pageNum} for tables:`, err);
          return { items: [] };
        }
      }
    });
    
    console.log(`[PDF] Total tables detected: ${tables.length}`);
    return tables;
    
  } catch (error) {
    if (error instanceof PDFExtractionError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new PDFExtractionError(
        `Failed to extract tables from PDF: ${error.message}`,
        pdfPath,
        error
      );
    }
    
    throw new PDFExtractionError(
      'Unknown error during table extraction',
      pdfPath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Detects tables from row groups using structural analysis
 * Requirements for a table:
 * - At least 2 rows
 * - At least 2 columns
 * - Consistent column structure across rows
 */
function detectTables(
  sortedRows: { str: string; transform?: number[]; x?: number }[][],
  pageNum: number
): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  let currentTable: typeof sortedRows = [];
  
  for (const row of sortedRows) {
    // Sort items in row by X position (left to right)
    const sortedItems = row.sort((a, b) => {
      const xA = a.transform?.[4] || a.x || 0;
      const xB = b.transform?.[4] || b.x || 0;
      return xA - xB;
    });
    
    // A row with 2+ items might be part of a table
    if (sortedItems.length >= 2) {
      currentTable.push(sortedItems);
    } else {
      // End of potential table - validate and save if it's a real table
      if (isValidTable(currentTable)) {
        const tableHtml = generateTableHTML(currentTable);
        const maxCols = Math.max(...currentTable.map(r => r.length));
        
        tables.push({
          html: tableHtml,
          pageNumber: pageNum,
          rowCount: currentTable.length,
          colCount: maxCols
        });
      }
      currentTable = [];
    }
  }
  
  // Don't forget last table
  if (isValidTable(currentTable)) {
    const tableHtml = generateTableHTML(currentTable);
    const maxCols = Math.max(...currentTable.map(r => r.length));
    
    tables.push({
      html: tableHtml,
      pageNumber: pageNum,
      rowCount: currentTable.length,
      colCount: maxCols
    });
  }
  
  return tables;
}

/**
 * Validates if a group of rows constitutes a real table
 * Requirements:
 * - At least 2 rows
 * - At least 2 columns in most rows
 * - Consistent column count (±1 variance allowed)
 */
function isValidTable(rows: { str: string }[][]): boolean {
  if (rows.length < 2) return false;
  
  const colCounts = rows.map(r => r.length);
  const avgCols = colCounts.reduce((a, b) => a + b, 0) / colCounts.length;
  
  // Must have at least 2 columns on average
  if (avgCols < 2) return false;
  
  // Most rows should have similar column count (within 1)
  const variance = colCounts.map(c => Math.abs(c - avgCols));
  const maxVariance = Math.max(...variance);
  
  return maxVariance <= 1.5; // Allow some variance for merged cells
}

/**
 * Generates HTML table from row data
 */
function generateTableHTML(rows: { str: string }[][]): string {
  const htmlRows = rows.map((row, rowIndex) => {
    // First row might be header
    const cellTag = rowIndex === 0 ? 'th' : 'td';
    const cells = row.map(item => `<${cellTag}>${escapeHtml(item.str)}</${cellTag}>`).join('');
    return `<tr>${cells}</tr>`;
  });
  
  return `<table class="extracted-table">${htmlRows.join('')}</table>`;
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

/**
 * Escapes HTML special characters
 * @param text - Raw text
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}
