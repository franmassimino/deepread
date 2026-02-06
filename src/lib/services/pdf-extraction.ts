// Import from lib directly to bypass debug code that references missing test files
// See: https://github.com/albertyeh/pdf-parse/issues/2
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs/promises';

/**
 * Maximum PDF file size for extraction (100MB)
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
    
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new PDFExtractionError('PDF file not found', pdfPath, error);
    }
    
    throw new PDFExtractionError('Failed to check PDF file size', pdfPath, error instanceof Error ? error : undefined);
  }
}

/**
 * Extracts text content from a PDF file
 */
export async function extractTextFromPDF(pdfPath: string): Promise<PDFExtractionResult> {
  try {
    await validateFileSize(pdfPath);
    const buffer = await fs.readFile(pdfPath);
    const data = await pdfParse(buffer);
    
    return {
      text: data.text || '',
      pageCount: data.numpages || 0,
      info: data.info as Record<string, unknown> || {},
    };
  } catch (error) {
    if (error instanceof PDFExtractionError) throw error;
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new PDFExtractionError('Invalid or corrupted PDF file', pdfPath, error);
      }
      if (error.message.includes('ENOENT')) {
        throw new PDFExtractionError('PDF file not found', pdfPath, error);
      }
      throw new PDFExtractionError(`Failed to extract text from PDF: ${error.message}`, pdfPath, error);
    }
    
    throw new PDFExtractionError('Unknown error during PDF extraction', pdfPath, error instanceof Error ? error : undefined);
  }
}

/**
 * Extracts tables from a PDF file by analyzing text positions
 */
export async function extractTablesFromPDF(pdfPath: string): Promise<ExtractedTable[]> {
  try {
    await validateFileSize(pdfPath);
    const tables: ExtractedTable[] = [];
    const buffer = await fs.readFile(pdfPath);
    let pageNum = 0;
    
    await pdfParse(buffer, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pagerender: function(pageData: any) {
        pageNum++;
        // Use a promise chain to handle async operations
        // Return empty string to satisfy type, actual processing happens in promise
        pageData.getTextContent().then((textContent: { items: Array<{ str?: string; transform?: number[]; y?: number }> }) => {
          const items = textContent.items || [];
          
          const validItems = items.filter((item) => (item.str?.trim().length ?? 0) > 0);
          if (validItems.length === 0) return;
          
          // Group by Y position (rows)
          const rowGroups = new Map<number, typeof validItems>();
          for (const item of validItems) {
            const yPos = item.transform?.[5] || item.y || 0;
            const yKey = Math.round(yPos / 3) * 3;
            if (!rowGroups.has(yKey)) rowGroups.set(yKey, []);
            rowGroups.get(yKey)!.push(item);
          }
          
          // Sort rows top to bottom and map to expected type
          const sortedRows: { str: string; transform?: number[]; x?: number }[][] = Array.from(rowGroups.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([_, rowItems]) => rowItems
              .filter((item): item is typeof item & { str: string } => !!item.str)
              .map((item) => ({
                str: item.str,
                transform: item.transform,
                x: item.transform?.[4],
              }))
            );
          
          // Detect tables
          const detectedTables = detectTables(sortedRows, pageNum);
          tables.push(...detectedTables);
        }).catch((err: Error) => {
          console.warn(`[PDF] Error processing page ${pageNum} for tables:`, err);
        });
        
        // Return empty string as required by pdf-parse type
        return '';
      }
    });
    
    console.log(`[PDF] Total tables detected: ${tables.length}`);
    return tables;
  } catch (error) {
    if (error instanceof PDFExtractionError) throw error;
    if (error instanceof Error) {
      throw new PDFExtractionError(`Failed to extract tables from PDF: ${error.message}`, pdfPath, error);
    }
    throw new PDFExtractionError('Unknown error during table extraction', pdfPath, error instanceof Error ? error : undefined);
  }
}

/**
 * Detects tables from row groups
 */
function detectTables(
  sortedRows: { str: string; transform?: number[]; x?: number }[][],
  pageNum: number
): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  let currentTable: typeof sortedRows = [];
  
  for (const row of sortedRows) {
    const sortedItems = row.sort((a, b) => {
      const xA = a.transform?.[4] || a.x || 0;
      const xB = b.transform?.[4] || b.x || 0;
      return xA - xB;
    });
    
    if (sortedItems.length >= 2) {
      currentTable.push(sortedItems);
    } else {
      if (isValidTable(currentTable)) {
        const tableHtml = generateTableHTML(currentTable);
        tables.push({
          html: tableHtml,
          pageNumber: pageNum,
          rowCount: currentTable.length,
          colCount: Math.max(...currentTable.map(r => r.length))
        });
      }
      currentTable = [];
    }
  }
  
  if (isValidTable(currentTable)) {
    const tableHtml = generateTableHTML(currentTable);
    tables.push({
      html: tableHtml,
      pageNumber: pageNum,
      rowCount: currentTable.length,
      colCount: Math.max(...currentTable.map(r => r.length))
    });
  }
  
  return tables;
}

/**
 * Validates if rows form a real table
 */
function isValidTable(rows: { str: string }[][]): boolean {
  if (rows.length < 2) return false;
  const colCounts = rows.map(r => r.length);
  const avgCols = colCounts.reduce((a, b) => a + b, 0) / colCounts.length;
  if (avgCols < 2) return false;
  const variance = colCounts.map(c => Math.abs(c - avgCols));
  return Math.max(...variance) <= 1.5;
}

/**
 * Generates HTML table
 */
function generateTableHTML(rows: { str: string }[][]): string {
  const htmlRows = rows.map((row, idx) => {
    const tag = idx === 0 ? 'th' : 'td';
    const cells = row.map(item => `<${tag}>${escapeHtml(item.str)}</${tag}>`).join('');
    return `<tr>${cells}</tr>`;
  });
  return `<table class="extracted-table">${htmlRows.join('')}</table>`;
}

/**
 * Checks if text is from a scanned PDF
 */
export function isScannedPDF(text: string): boolean {
  if (!text) return true;
  const cleaned = text.replace(/\s+/g, '');
  if (cleaned.length < 100) return true;
  return text.trim().split(/\s+/).length < 20;
}

/**
 * Gets word count
 */
export function getWordCount(text: string): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Escapes HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}
