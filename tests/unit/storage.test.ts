import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageService, StorageError } from '@/lib/services/storage';
import { join } from 'path';
import { rm } from 'fs/promises';

describe('LocalStorageService - Unit Tests', () => {
  let storage: LocalStorageService;
  const testBasePath = join(process.cwd(), 'test-storage');

  beforeEach(() => {
    storage = new LocalStorageService(testBasePath);
  });

  afterEach(async () => {
    // Cleanup test files
    await rm(testBasePath, { recursive: true, force: true });
  });

  describe('saveFile', () => {
    it('should save file and return full path', async () => {
      const buffer = Buffer.from('test content');
      const path = 'test/file.txt';

      const fullPath = await storage.saveFile(path, buffer);

      expect(fullPath).toBe(join(testBasePath, path));
      expect(await storage.fileExists(path)).toBe(true);
    });

    it('should create directories automatically', async () => {
      const buffer = Buffer.from('test');
      const path = 'deeply/nested/dir/file.txt';

      await expect(storage.saveFile(path, buffer)).resolves.toBeTruthy();
      expect(await storage.fileExists(path)).toBe(true);
    });

    it('should throw StorageError on invalid path', async () => {
      const buffer = Buffer.from('test');
      // Invalid path with null bytes
      const invalidPath = 'invalid\x00path.txt';

      await expect(storage.saveFile(invalidPath, buffer))
        .rejects.toThrow(StorageError);
    });

    it('should save empty file', async () => {
      const buffer = Buffer.from('');
      const path = 'empty/file.txt';

      await storage.saveFile(path, buffer);
      expect(await storage.fileExists(path)).toBe(true);

      const size = await storage.getFileSize(path);
      expect(size).toBe(0);
    });
  });

  describe('getFile', () => {
    it('should retrieve saved file correctly', async () => {
      const content = 'test content';
      const buffer = Buffer.from(content);
      const path = 'test/file.txt';

      await storage.saveFile(path, buffer);
      const retrieved = await storage.getFile(path);

      expect(retrieved.toString()).toBe(content);
    });

    it('should throw StorageError for non-existent file', async () => {
      await expect(storage.getFile('non/existent.txt'))
        .rejects.toThrow(StorageError);
    });

    it('should retrieve binary file correctly', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const path = 'binary/file.png';

      await storage.saveFile(path, binaryData);
      const retrieved = await storage.getFile(path);

      expect(retrieved).toEqual(binaryData);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const buffer = Buffer.from('test');
      const path = 'test/file.txt';

      await storage.saveFile(path, buffer);
      expect(await storage.fileExists(path)).toBe(true);

      await storage.deleteFile(path);
      expect(await storage.fileExists(path)).toBe(false);
    });

    it('should throw StorageError when deleting non-existent file', async () => {
      await expect(storage.deleteFile('non/existent.txt'))
        .rejects.toThrow(StorageError);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing files', async () => {
      const buffer = Buffer.from('test');
      const path = 'test/file.txt';

      await storage.saveFile(path, buffer);
      expect(await storage.fileExists(path)).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      expect(await storage.fileExists('non/existent.txt')).toBe(false);
    });

    it('should return false for directories', async () => {
      const buffer = Buffer.from('test');
      const path = 'test/dir/file.txt';

      await storage.saveFile(path, buffer);
      expect(await storage.fileExists('test/dir')).toBe(true);
    });
  });

  describe('getFileSize', () => {
    it('should return correct file size', async () => {
      const content = 'test content with specific length';
      const buffer = Buffer.from(content);
      const path = 'test/file.txt';

      await storage.saveFile(path, buffer);
      const size = await storage.getFileSize(path);

      expect(size).toBe(buffer.length);
    });

    it('should return 0 for empty file', async () => {
      const buffer = Buffer.from('');
      const path = 'test/empty.txt';

      await storage.saveFile(path, buffer);
      const size = await storage.getFileSize(path);

      expect(size).toBe(0);
    });

    it('should throw StorageError for non-existent file', async () => {
      await expect(storage.getFileSize('non/existent.txt'))
        .rejects.toThrow(StorageError);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      await storage.saveFile('test/file1.txt', Buffer.from('1'));
      await storage.saveFile('test/file2.txt', Buffer.from('2'));
      await storage.saveFile('test/file3.txt', Buffer.from('3'));

      const files = await storage.listFiles('test');

      expect(files).toHaveLength(3);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('file3.txt');
    });

    it('should return empty array for empty directory', async () => {
      // Create directory by saving and deleting a file
      await storage.saveFile('empty/temp.txt', Buffer.from('temp'));
      await storage.deleteFile('empty/temp.txt');

      const files = await storage.listFiles('empty');
      expect(files).toHaveLength(0);
    });

    it('should throw StorageError for non-existent directory', async () => {
      await expect(storage.listFiles('non/existent'))
        .rejects.toThrow(StorageError);
    });
  });

  describe('deleteBookFiles', () => {
    it('should delete all PDF and image files for a book', async () => {
      const bookId = 'test-book-123';

      // Create PDF files
      await storage.saveFile(join('pdfs', bookId, 'original.pdf'), Buffer.from('pdf'));
      await storage.saveFile(join('pdfs', bookId, 'metadata.json'), Buffer.from('{}'));

      // Create image files
      await storage.saveFile(join('images', bookId, 'chapter1', 'img1.png'), Buffer.from('img1'));
      await storage.saveFile(join('images', bookId, 'chapter2', 'img2.png'), Buffer.from('img2'));

      // Verify files exist
      expect(await storage.fileExists(join('pdfs', bookId, 'original.pdf'))).toBe(true);
      expect(await storage.fileExists(join('images', bookId, 'chapter1', 'img1.png'))).toBe(true);

      // Delete all book files
      await storage.deleteBookFiles(bookId);

      // Verify files are deleted
      expect(await storage.fileExists(join('pdfs', bookId, 'original.pdf'))).toBe(false);
      expect(await storage.fileExists(join('images', bookId, 'chapter1', 'img1.png'))).toBe(false);
    });

    it('should not throw error when deleting non-existent book files', async () => {
      await expect(storage.deleteBookFiles('non-existent-book'))
        .resolves.not.toThrow();
    });

    it('should only delete files for specified book', async () => {
      const bookId1 = 'book-1';
      const bookId2 = 'book-2';

      // Create files for two books
      await storage.saveFile(join('pdfs', bookId1, 'file.pdf'), Buffer.from('pdf1'));
      await storage.saveFile(join('pdfs', bookId2, 'file.pdf'), Buffer.from('pdf2'));

      // Delete only book 1
      await storage.deleteBookFiles(bookId1);

      // Verify book 1 deleted, book 2 still exists
      expect(await storage.fileExists(join('pdfs', bookId1, 'file.pdf'))).toBe(false);
      expect(await storage.fileExists(join('pdfs', bookId2, 'file.pdf'))).toBe(true);
    });
  });

  describe('StorageError', () => {
    it('should include operation, path, and original error', async () => {
      try {
        await storage.getFile('non-existent.txt');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).operation).toBe('getFile');
        expect((error as StorageError).path).toBe('non-existent.txt');
        expect((error as StorageError).originalError).toBeDefined();
      }
    });
  });
});
