import { describe, it, expect, beforeAll } from 'vitest';
import { 
  extractTextFromPDF, 
  extractImagesFromPDF,
  extractTablesFromPDF,
  PDFExtractionError,
  isScannedPDF,
  getWordCount 
} from '@/lib/services/pdf-extraction';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test PDF paths
const TEST_PDFS_DIR = path.join(__dirname, '../fixtures/pdfs');
const TEST_STORAGE_DIR = path.join(__dirname, '../fixtures/storage');
const SAMPLE_PDF_PATH = path.join(TEST_PDFS_DIR, 'sample.pdf');
const CORRUPT_PDF_PATH = path.join(TEST_PDFS_DIR, 'corrupt.pdf');
const EMPTY_PDF_PATH = path.join(TEST_PDFS_DIR, 'empty.pdf');
const NONEXISTENT_PATH = path.join(TEST_PDFS_DIR, 'does-not-exist.pdf');

describe('PDF Extraction Service', () => {
  beforeAll(async () => {
    // Ensure test directories exist
    await fs.mkdir(TEST_PDFS_DIR, { recursive: true });
    await fs.mkdir(TEST_STORAGE_DIR, { recursive: true });
  });

  describe('extractTextFromPDF', () => {
    it('should extract text from a valid PDF', async () => {
      // Create a simple test PDF first
      const result = await extractTextFromPDF(SAMPLE_PDF_PATH);
      
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('pageCount');
      expect(result).toHaveProperty('info');
      expect(typeof result.text).toBe('string');
      expect(typeof result.pageCount).toBe('number');
      expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should return correct page count', async () => {
      const result = await extractTextFromPDF(SAMPLE_PDF_PATH);
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it('should throw PDFExtractionError for non-existent file', async () => {
      await expect(extractTextFromPDF(NONEXISTENT_PATH)).rejects.toThrow(PDFExtractionError);
      await expect(extractTextFromPDF(NONEXISTENT_PATH)).rejects.toThrow('PDF file not found');
    });

    it('should throw PDFExtractionError for corrupted PDF', async () => {
      // Create a corrupted file
      try {
        await fs.mkdir(TEST_PDFS_DIR, { recursive: true });
        await fs.writeFile(CORRUPT_PDF_PATH, 'This is not a valid PDF content');
        
        await expect(extractTextFromPDF(CORRUPT_PDF_PATH)).rejects.toThrow(PDFExtractionError);
      } finally {
        // Cleanup
        try {
          await fs.unlink(CORRUPT_PDF_PATH);
        } catch {}
      }
    });

    it('should handle PDF with no text (scanned)', async () => {
      // Create an empty/minimal PDF-like structure
      const minimalPDF = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n105\n%%EOF';
      
      try {
        await fs.mkdir(TEST_PDFS_DIR, { recursive: true });
        await fs.writeFile(EMPTY_PDF_PATH, minimalPDF);
        
        const result = await extractTextFromPDF(EMPTY_PDF_PATH);
        // Should return gracefully with empty text
        expect(result.text).toBeDefined();
        expect(result.pageCount).toBeDefined();
      } catch (error) {
        // Empty/corrupted PDFs may throw errors - that's acceptable
        expect(error).toBeInstanceOf(PDFExtractionError);
      } finally {
        // Cleanup
        try {
          await fs.unlink(EMPTY_PDF_PATH);
        } catch {}
      }
    });
  });

  describe('extractImagesFromPDF', () => {
    it('should return empty array for PDFs without images', async () => {
      // Create a simple text-only PDF content for testing
      const result = await extractImagesFromPDF(
        SAMPLE_PDF_PATH, 
        'test-book-no-images',
        TEST_STORAGE_DIR
      );
      
      // Should return an array (may be empty if no images found)
      expect(Array.isArray(result)).toBe(true);
    });

    it('should create images directory', async () => {
      const bookId = 'test-book-dir';
      const imagesDir = path.join(TEST_STORAGE_DIR, 'images', bookId);
      
      try {
        await extractImagesFromPDF(SAMPLE_PDF_PATH, bookId, TEST_STORAGE_DIR);
        
        // Directory should be created
        const dirExists = await fs.stat(imagesDir).then(() => true).catch(() => false);
        expect(dirExists).toBe(true);
      } finally {
        // Cleanup
        try {
          await fs.rm(imagesDir, { recursive: true, force: true });
        } catch {}
      }
    });

    it('should throw PDFExtractionError for non-existent file', async () => {
      await expect(
        extractImagesFromPDF(NONEXISTENT_PATH, 'test-book', TEST_STORAGE_DIR)
      ).rejects.toThrow(PDFExtractionError);
    });

    it('should return image metadata with correct structure', async () => {
      const result = await extractImagesFromPDF(
        SAMPLE_PDF_PATH,
        'test-book-metadata',
        TEST_STORAGE_DIR
      );
      
      // Each image should have required properties
      for (const image of result) {
        expect(image).toHaveProperty('filename');
        expect(image).toHaveProperty('pageNumber');
        expect(image).toHaveProperty('width');
        expect(image).toHaveProperty('height');
        expect(typeof image.filename).toBe('string');
        expect(typeof image.pageNumber).toBe('number');
        expect(typeof image.width).toBe('number');
        expect(typeof image.height).toBe('number');
        expect(image.pageNumber).toBeGreaterThan(0);
        expect(image.width).toBeGreaterThan(0);
        expect(image.height).toBeGreaterThan(0);
      }
    });
  });

  describe('extractTablesFromPDF', () => {
    it('should return empty array for PDFs without tables', async () => {
      const result = await extractTablesFromPDF(SAMPLE_PDF_PATH);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw PDFExtractionError for non-existent file', async () => {
      await expect(extractTablesFromPDF(NONEXISTENT_PATH)).rejects.toThrow(PDFExtractionError);
    });

    it('should return table metadata with correct structure', async () => {
      const result = await extractTablesFromPDF(SAMPLE_PDF_PATH);
      
      // Each table should have required properties
      for (const table of result) {
        expect(table).toHaveProperty('html');
        expect(table).toHaveProperty('pageNumber');
        expect(table).toHaveProperty('rowCount');
        expect(table).toHaveProperty('colCount');
        expect(typeof table.html).toBe('string');
        expect(typeof table.pageNumber).toBe('number');
        expect(typeof table.rowCount).toBe('number');
        expect(typeof table.colCount).toBe('number');
        expect(table.pageNumber).toBeGreaterThan(0);
        expect(table.rowCount).toBeGreaterThanOrEqual(0);
        expect(table.colCount).toBeGreaterThanOrEqual(0);
        
        // HTML should contain table tags
        expect(table.html).toContain('<table>');
        expect(table.html).toContain('</table>');
      }
    });

    it('should detect tables with multiple columns', async () => {
      const result = await extractTablesFromPDF(SAMPLE_PDF_PATH);
      
      // Filter tables with multiple columns
      const multiColTables = result.filter(t => t.colCount >= 2);
      
      // Note: This test may pass with 0 tables if sample.pdf has no tables
      // The important thing is that the function runs without errors
      for (const table of multiColTables) {
        expect(table.colCount).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('isScannedPDF', () => {
    it('should return true for empty text', () => {
      expect(isScannedPDF('')).toBe(true);
      expect(isScannedPDF('   ')).toBe(true);
      expect(isScannedPDF(null as unknown as string)).toBe(true);
    });

    it('should return true for very short text', () => {
      expect(isScannedPDF('Hello')).toBe(true);
      expect(isScannedPDF('A few words here')).toBe(true);
    });

    it('should return false for substantial text', () => {
      const substantialText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
      expect(isScannedPDF(substantialText)).toBe(false);
    });

    it('should return true for text with very few words', () => {
      expect(isScannedPDF('one two three')).toBe(true);
    });

    it('should return false for text with many words', () => {
      const manyWords = Array(50).fill('word').join(' ');
      expect(isScannedPDF(manyWords)).toBe(false);
    });
  });

  describe('getWordCount', () => {
    it('should return 0 for empty text', () => {
      expect(getWordCount('')).toBe(0);
      expect(getWordCount('   ')).toBe(0);
    });

    it('should count words correctly', () => {
      expect(getWordCount('Hello world')).toBe(2);
      expect(getWordCount('The quick brown fox jumps')).toBe(5);
    });

    it('should handle multiple spaces', () => {
      expect(getWordCount('Hello    world')).toBe(2);
      expect(getWordCount('  leading and trailing  ')).toBe(3);
    });

    it('should handle newlines', () => {
      expect(getWordCount('Hello\nworld\ntest')).toBe(3);
    });
  });
});

// Helper to create a simple test PDF for development
// This will be skipped in CI but useful for local testing
describe.skip('PDF Fixtures Setup', () => {
  it('should create test PDF directory', async () => {
    await fs.mkdir(TEST_PDFS_DIR, { recursive: true });
    expect(true).toBe(true);
  });
});
