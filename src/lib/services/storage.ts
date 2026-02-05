import { mkdir, writeFile, readFile, unlink, access, stat, readdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { constants } from 'fs';

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public operation: string,
    public path: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage service interface for file operations
 * Supports multiple storage backends (local, S3, Vercel Blob, etc.)
 */
export interface StorageService {
  /**
   * Save a file to storage
   * @param path - Relative path where file should be saved
   * @param buffer - File content as Buffer
   * @returns Full path where file was saved
   */
  saveFile(path: string, buffer: Buffer): Promise<string>;

  /**
   * Retrieve a file from storage
   * @param path - Relative path to the file
   * @returns File content as Buffer
   */
  getFile(path: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   * @param path - Relative path to the file
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Check if a file exists in storage
   * @param path - Relative path to the file
   * @returns True if file exists, false otherwise
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Get file size in bytes
   * @param path - Relative path to the file
   * @returns File size in bytes
   */
  getFileSize(path: string): Promise<number>;

  /**
   * List all files in a directory
   * @param directoryPath - Relative path to the directory
   * @returns Array of filenames
   */
  listFiles(directoryPath: string): Promise<string[]>;

  /**
   * Delete all files associated with a book
   * @param bookId - Book identifier
   */
  deleteBookFiles(bookId: string): Promise<void>;

  /**
   * Get the full file path from a relative path
   * @param relativePath - Relative path to the file
   * @returns Full absolute path
   */
  getFilePath(relativePath: string): string;
}

/**
 * Local file system implementation of StorageService
 * Uses Node.js fs/promises for file operations
 */
export class LocalStorageService implements StorageService {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_PATH || join(process.cwd(), 'storage');
  }

  /**
   * Log storage operation (development only)
   */
  private log(operation: string, path: string, details?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Storage] ${operation}:`, path, details || '');
    }
  }

  /**
   * Log storage error
   */
  private logError(operation: string, path: string, error: any): void {
    console.error(`[Storage] ${operation} failed:`, path, error.message);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const directory = dirname(filePath);
    try {
      await access(directory, constants.F_OK);
    } catch {
      // Directory doesn't exist, create it
      await mkdir(directory, { recursive: true });
    }
  }

  /**
   * Get full absolute path from relative path
   */
  private getFullPath(relativePath: string): string {
    return join(this.basePath, relativePath);
  }

  /**
   * Delete a directory recursively
   */
  private async deleteDirectory(path: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    try {
      await rm(fullPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  async saveFile(path: string, buffer: Buffer): Promise<string> {
    try {
      const fullPath = this.getFullPath(path);
      await this.ensureDirectoryExists(fullPath);
      await writeFile(fullPath, buffer);
      this.log('saveFile', path, { size: buffer.length });
      return fullPath;
    } catch (error) {
      this.logError('saveFile', path, error);
      throw new StorageError(
        `Failed to save file: ${path}`,
        'saveFile',
        path,
        error as Error
      );
    }
  }

  async getFile(path: string): Promise<Buffer> {
    try {
      const fullPath = this.getFullPath(path);
      const buffer = await readFile(fullPath);
      this.log('getFile', path, { size: buffer.length });
      return buffer;
    } catch (error) {
      this.logError('getFile', path, error);
      throw new StorageError(
        `Failed to get file: ${path}`,
        'getFile',
        path,
        error as Error
      );
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(path);
      await unlink(fullPath);
      this.log('deleteFile', path);
    } catch (error) {
      this.logError('deleteFile', path, error);
      throw new StorageError(
        `Failed to delete file: ${path}`,
        'deleteFile',
        path,
        error as Error
      );
    }
  }

  async fileExists(path: string): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    try {
      await access(fullPath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(path: string): Promise<number> {
    try {
      const fullPath = this.getFullPath(path);
      const stats = await stat(fullPath);
      return stats.size;
    } catch (error) {
      this.logError('getFileSize', path, error);
      throw new StorageError(
        `Failed to get file size: ${path}`,
        'getFileSize',
        path,
        error as Error
      );
    }
  }

  async listFiles(directoryPath: string): Promise<string[]> {
    try {
      const fullPath = this.getFullPath(directoryPath);
      const files = await readdir(fullPath);
      return files;
    } catch (error) {
      this.logError('listFiles', directoryPath, error);
      throw new StorageError(
        `Failed to list files: ${directoryPath}`,
        'listFiles',
        directoryPath,
        error as Error
      );
    }
  }

  async deleteBookFiles(bookId: string): Promise<void> {
    try {
      const pdfDir = join('pdfs', bookId);
      const imageDir = join('images', bookId);

      await this.deleteDirectory(pdfDir);
      await this.deleteDirectory(imageDir);

      this.log('deleteBookFiles', bookId);
    } catch (error) {
      this.logError('deleteBookFiles', bookId, error);
      throw new StorageError(
        `Failed to delete book files: ${bookId}`,
        'deleteBookFiles',
        bookId,
        error as Error
      );
    }
  }

  getFilePath(relativePath: string): string {
    return this.getFullPath(relativePath);
  }
}

/**
 * Helper functions for generating storage paths
 */

/**
 * Get storage path for a PDF file
 * @param bookId - Unique book identifier
 * @param filename - PDF filename (default: 'original.pdf')
 */
export function getPdfPath(bookId: string, filename: string = 'original.pdf'): string {
  return join('pdfs', bookId, filename);
}

/**
 * Get storage path for an image file
 * @param bookId - Unique book identifier
 * @param chapterId - Unique chapter identifier
 * @param filename - Image filename
 */
export function getImagePath(bookId: string, chapterId: string, filename: string): string {
  return join('images', bookId, chapterId, filename);
}

/**
 * Global singleton pattern (prevents multiple instances in development)
 * Follows the same pattern as Redis and Prisma services
 */
const globalForStorage = globalThis as unknown as {
  storageService: LocalStorageService | undefined;
};

const createStorageService = (): LocalStorageService => {
  // Use /tmp in production (Vercel) since filesystem is read-only except /tmp
  const defaultPath = process.env.NODE_ENV === 'production'
    ? '/tmp/storage'
    : join(process.cwd(), 'storage');
  const basePath = process.env.STORAGE_PATH || defaultPath;
  const service = new LocalStorageService(basePath);

  if (process.env.NODE_ENV === 'development') {
    console.log('✓ Storage service initialized:', basePath);
  }

  return service;
};

/**
 * Singleton instance of LocalStorageService
 * Use this throughout the application
 */
export const storageService = globalForStorage.storageService ?? createStorageService();

if (process.env.NODE_ENV !== 'production') {
  globalForStorage.storageService = storageService;
}
