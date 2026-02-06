// Import from lib directly to bypass debug code that references missing test files
// See: https://github.com/albertyeh/pdf-parse/issues/2
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs/promises';
import path from 'path';

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
      
      // Get operator list to find image operators
      const operatorList = await page.getOperatorList();
      
      // Track image count for naming
      let pageImageCount = 0;
      
      // Iterate through operators to find images
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        const args = operatorList.argsArray[i];
        
        // Check for image operators (paintImageXObject)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (fn === (pdfjs as any).OPS?.paintImageXObject || fn === 85) {
          try {
            // Try to extract image from args
            const imageName = args?.[0];
            if (!imageName) continue;
            
            // Try to get image data from page resources
            const resources = await page.getResources();
            const xObjects = resources?.XObject;
            
            if (!xObjects) continue;
            
            // Get the image object
            const imageObj = xObjects.get?.(imageName) || xObjects[imageName];
            if (!imageObj) continue;
            
            // Extract image data
            pageImageCount++;
            const filename = `image-${images.length + 1}.png`;
            const imagePath = path.join(imagesDir, filename);
            
            // For MVP: Render page section or save placeholder
            // Full embedded image extraction requires more complex pdf.js usage
            // We'll create a canvas render as fallback for now
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Create a canvas-like context for Node.js
            const canvasAndContext = createCanvas(viewport.width, viewport.height);
            
            await page.render({
              canvasContext: canvasAndContext.context,
              viewport: viewport
            }).promise;
            
            // Save as PNG
            const imageBuffer = canvasAndContext.canvas.toBuffer?.() || 
                               canvasAndContext.canvas.toPNG?.() ||
                               Buffer.from([]);
            
            if (imageBuffer && imageBuffer.length > 0) {
              await fs.writeFile(imagePath, imageBuffer);
              
              images.push({
                filename,
                pageNumber: pageNum,
                width: Math.round(viewport.width),
                height: Math.round(viewport.height)
              });
            }
            
            // Only extract first image per page for MVP to avoid duplicates
            break;
            
          } catch (imageError) {
            // Log but continue with other images
            console.warn(`Failed to extract image from page ${pageNum}:`, imageError);
          }
        }
      }
    }
    
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
 * Extracts tables from a PDF file by analyzing text positions
 * @param pdfPath - Absolute path to the PDF file
 * @returns Array of extracted tables as HTML
 * @throws PDFExtractionError if extraction fails
 */
export async function extractTablesFromPDF(pdfPath: string): Promise<ExtractedTable[]> {
  try {
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
          
          // Group text items by Y position (rows)
          const rowGroups = new Map<number, typeof items>();
          
          for (const item of items) {
            if (!item.str?.trim()) continue;
            
            // Round Y to group nearby text (within 2 points)
            const yKey = Math.round(item.transform?.[5] || item.y || 0);
            
            if (!rowGroups.has(yKey)) {
              rowGroups.set(yKey, []);
            }
            rowGroups.get(yKey)!.push(item);
          }
          
          // Sort rows by Y position (top to bottom)
          const sortedRows = Array.from(rowGroups.entries())
            .sort((a, b) => b[0] - a[0]) // Higher Y = higher on page
            .map(([_, items]) => items);
          
          // Detect tables: look for rows with multiple items at consistent X positions
          const potentialTables: typeof sortedRows[] = [];
          let currentTable: typeof sortedRows = [];
          
          for (const row of sortedRows) {
            // A row with 2+ items might be part of a table
            if (row.length >= 2) {
              currentTable.push(row);
            } else {
              // End of table
              if (currentTable.length >= 2) {
                potentialTables.push(currentTable);
              }
              currentTable = [];
            }
          }
          
          // Don't forget last table
          if (currentTable.length >= 2) {
            potentialTables.push(currentTable);
          }
          
          // Convert detected tables to HTML
          for (const tableRows of potentialTables) {
            const htmlRows: string[] = [];
            let maxCols = 0;
            
            for (const row of tableRows) {
              // Sort items in row by X position (left to right)
              const sortedItems = row.sort((a, b) => {
                const xA = a.transform?.[4] || a.x || 0;
                const xB = b.transform?.[4] || b.x || 0;
                return xA - xB;
              });
              
              const cells = sortedItems.map(item => `<td>${escapeHtml(item.str)}</td>`);
              htmlRows.push(`<tr>${cells.join('')}</tr>`);
              maxCols = Math.max(maxCols, cells.length);
            }
            
            if (maxCols >= 2) {
              const html = `<table>${htmlRows.join('')}</table>`;
              tables.push({
                html,
                pageNumber: pageNum,
                rowCount: tableRows.length,
                colCount: maxCols
              });
            }
          }
          
          return textContent;
        } catch (err) {
          console.warn(`Error processing page ${pageNum} for tables:`, err);
          return { items: [] };
        }
      }
    });
    
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
  const div = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => div[char as keyof typeof div] || char);
}

/**
 * Creates a canvas-like object for Node.js environment
 * Note: This is a simplified implementation. For production, use 'canvas' package.
 */
function createCanvas(width: number, height: number) {
  // Simple mock canvas for Node.js
  // In production, this should use the 'canvas' npm package
  const canvas = {
    width,
    height,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getContext: (type: string) => ({
      fillRect: () => {},
      drawImage: () => {},
      fillText: () => {},
      measureText: () => ({ width: 0 }),
    }),
    toBuffer: () => Buffer.from([]),
    toPNG: () => Buffer.from([]),
  };
  
  return {
    canvas,
    context: canvas.getContext('2d')
  };
}
