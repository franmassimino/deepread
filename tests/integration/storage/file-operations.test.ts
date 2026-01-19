import { describe, it, expect, afterAll } from 'vitest';
import { storageService, getPdfPath, getImagePath } from '@/lib/services/storage';
import { rm } from 'fs/promises';
import { join } from 'path';

describe('Storage Service Integration', () => {
  const testBookId = 'test-book-integration-123';
  const testChapterId = 'test-chapter-456';

  afterAll(async () => {
    // Cleanup test files
    const storagePath = process.env.STORAGE_PATH || join(process.cwd(), 'storage');
    await rm(join(storagePath, 'pdfs', testBookId), { recursive: true, force: true });
    await rm(join(storagePath, 'images', testBookId), { recursive: true, force: true });
  });

  describe('PDF Operations', () => {
    it('should save and retrieve PDF using helper paths', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 mock PDF content');
      const pdfPath = getPdfPath(testBookId);

      const savedPath = await storageService.saveFile(pdfPath, pdfContent);
      expect(savedPath).toContain(testBookId);
      expect(savedPath).toContain('original.pdf');

      const retrieved = await storageService.getFile(pdfPath);
      expect(retrieved.toString()).toBe(pdfContent.toString());
    });

    it('should save PDF with custom filename', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 custom');
      const pdfPath = getPdfPath(testBookId, 'custom.pdf');

      await storageService.saveFile(pdfPath, pdfContent);

      expect(await storageService.fileExists(pdfPath)).toBe(true);
      const retrieved = await storageService.getFile(pdfPath);
      expect(retrieved.toString()).toBe(pdfContent.toString());
    });

    it('should get PDF file size', async () => {
      const pdfContent = Buffer.from('%PDF-1.4 test content for size check');
      const pdfPath = getPdfPath(testBookId, 'size-test.pdf');

      await storageService.saveFile(pdfPath, pdfContent);
      const size = await storageService.getFileSize(pdfPath);

      expect(size).toBe(pdfContent.length);
    });
  });

  describe('Image Operations', () => {
    it('should save and retrieve images using helper paths', async () => {
      const imageContent = Buffer.from('fake PNG image data');
      const imagePath = getImagePath(testBookId, testChapterId, 'test-image.png');

      await storageService.saveFile(imagePath, imageContent);

      const retrieved = await storageService.getFile(imagePath);
      expect(retrieved.toString()).toBe(imageContent.toString());
    });

    it('should save multiple images for different chapters', async () => {
      const chapter1Id = 'chapter-1';
      const chapter2Id = 'chapter-2';

      const img1Path = getImagePath(testBookId, chapter1Id, 'image-1.png');
      const img2Path = getImagePath(testBookId, chapter2Id, 'image-1.png');

      await storageService.saveFile(img1Path, Buffer.from('image 1'));
      await storageService.saveFile(img2Path, Buffer.from('image 2'));

      expect(await storageService.fileExists(img1Path)).toBe(true);
      expect(await storageService.fileExists(img2Path)).toBe(true);

      const content1 = await storageService.getFile(img1Path);
      const content2 = await storageService.getFile(img2Path);

      expect(content1.toString()).toBe('image 1');
      expect(content2.toString()).toBe('image 2');
    });

    it('should list all images in a chapter directory', async () => {
      const chapterId = 'chapter-with-images';
      const basePath = join('images', testBookId, chapterId);

      await storageService.saveFile(join(basePath, 'img1.png'), Buffer.from('1'));
      await storageService.saveFile(join(basePath, 'img2.png'), Buffer.from('2'));
      await storageService.saveFile(join(basePath, 'img3.png'), Buffer.from('3'));

      const files = await storageService.listFiles(basePath);

      expect(files).toHaveLength(3);
      expect(files).toContain('img1.png');
      expect(files).toContain('img2.png');
      expect(files).toContain('img3.png');
    });
  });

  describe('Book Cleanup', () => {
    it('should delete all book files (PDFs and images)', async () => {
      const bookId = 'cleanup-test-book';
      const pdfPath = getPdfPath(bookId);
      const imagePath1 = getImagePath(bookId, 'ch1', 'image1.png');
      const imagePath2 = getImagePath(bookId, 'ch2', 'image2.png');

      // Create files
      await storageService.saveFile(pdfPath, Buffer.from('pdf'));
      await storageService.saveFile(imagePath1, Buffer.from('img1'));
      await storageService.saveFile(imagePath2, Buffer.from('img2'));

      // Verify files exist
      expect(await storageService.fileExists(pdfPath)).toBe(true);
      expect(await storageService.fileExists(imagePath1)).toBe(true);
      expect(await storageService.fileExists(imagePath2)).toBe(true);

      // Delete all book files
      await storageService.deleteBookFiles(bookId);

      // Verify all files are deleted
      expect(await storageService.fileExists(pdfPath)).toBe(false);
      expect(await storageService.fileExists(imagePath1)).toBe(false);
      expect(await storageService.fileExists(imagePath2)).toBe(false);
    });

    it('should isolate book files (one book deletion should not affect others)', async () => {
      const bookId1 = 'book-isolation-1';
      const bookId2 = 'book-isolation-2';

      const pdf1 = getPdfPath(bookId1);
      const pdf2 = getPdfPath(bookId2);
      const img1 = getImagePath(bookId1, 'ch1', 'img.png');
      const img2 = getImagePath(bookId2, 'ch1', 'img.png');

      // Create files for both books
      await storageService.saveFile(pdf1, Buffer.from('pdf1'));
      await storageService.saveFile(pdf2, Buffer.from('pdf2'));
      await storageService.saveFile(img1, Buffer.from('img1'));
      await storageService.saveFile(img2, Buffer.from('img2'));

      // Delete only book 1
      await storageService.deleteBookFiles(bookId1);

      // Verify book 1 is deleted, book 2 still exists
      expect(await storageService.fileExists(pdf1)).toBe(false);
      expect(await storageService.fileExists(img1)).toBe(false);
      expect(await storageService.fileExists(pdf2)).toBe(true);
      expect(await storageService.fileExists(img2)).toBe(true);

      // Cleanup book 2
      await storageService.deleteBookFiles(bookId2);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle full book upload workflow', async () => {
      const bookId = 'workflow-test-book';

      // Step 1: Upload PDF
      const pdfContent = Buffer.from('%PDF-1.4 Full Book Content');
      const pdfPath = getPdfPath(bookId);
      await storageService.saveFile(pdfPath, pdfContent);

      // Step 2: Extract and save multiple chapter images
      const chapters = ['chapter-1', 'chapter-2', 'chapter-3'];
      for (const chapterId of chapters) {
        for (let i = 1; i <= 3; i++) {
          const imgPath = getImagePath(bookId, chapterId, `image-${i}.png`);
          await storageService.saveFile(imgPath, Buffer.from(`Image ${i} for ${chapterId}`));
        }
      }

      // Step 3: Verify all files exist
      expect(await storageService.fileExists(pdfPath)).toBe(true);

      for (const chapterId of chapters) {
        for (let i = 1; i <= 3; i++) {
          const imgPath = getImagePath(bookId, chapterId, `image-${i}.png`);
          expect(await storageService.fileExists(imgPath)).toBe(true);
        }
      }

      // Step 4: List images in chapter 1
      const chapter1Images = await storageService.listFiles(
        join('images', bookId, 'chapter-1')
      );
      expect(chapter1Images).toHaveLength(3);

      // Step 5: Delete book (cleanup)
      await storageService.deleteBookFiles(bookId);

      // Step 6: Verify cleanup
      expect(await storageService.fileExists(pdfPath)).toBe(false);
    });

    it('should handle large file operations', async () => {
      const bookId = 'large-file-test';

      // Simulate 5MB PDF (5 * 1024 * 1024 bytes)
      const largeContent = Buffer.alloc(5 * 1024 * 1024, 'x');
      const pdfPath = getPdfPath(bookId, 'large.pdf');

      await storageService.saveFile(pdfPath, largeContent);

      const size = await storageService.getFileSize(pdfPath);
      expect(size).toBe(largeContent.length);

      const retrieved = await storageService.getFile(pdfPath);
      expect(retrieved.length).toBe(largeContent.length);

      // Cleanup
      await storageService.deleteBookFiles(bookId);
    });

    it('should handle concurrent file operations', async () => {
      const bookId = 'concurrent-test';

      // Simulate concurrent uploads
      const operations = [];
      for (let i = 1; i <= 10; i++) {
        const path = getImagePath(bookId, `ch${i}`, `image.png`);
        operations.push(
          storageService.saveFile(path, Buffer.from(`Image ${i}`))
        );
      }

      await Promise.all(operations);

      // Verify all files were saved
      for (let i = 1; i <= 10; i++) {
        const path = getImagePath(bookId, `ch${i}`, `image.png`);
        expect(await storageService.fileExists(path)).toBe(true);
      }

      // Cleanup
      await storageService.deleteBookFiles(bookId);
    });
  });
});
