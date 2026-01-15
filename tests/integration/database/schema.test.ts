/**
 * Database Schema Validation Tests
 * Tests Book, Chapter, and ReadingProgress models
 */

import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('Database Schema', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Book Model', () => {
    it('should create Book record with all fields', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book: The Art of Programming',
          author: 'Test Author',
          summary: 'A comprehensive guide to programming best practices and patterns.',
          pdfPath: '/storage/pdfs/test-book-001/original.pdf',
          totalPages: 350,
          wordCount: 75000,
          readingTimeMinutes: 375,
          status: 'PROCESSING',
        },
      });

      expect(book).toBeDefined();
      expect(book.id).toBeDefined();
      expect(book.title).toBe('Test Book: The Art of Programming');
      expect(book.status).toBe('PROCESSING');
      expect(book.createdAt).toBeInstanceOf(Date);

      // Cleanup
      await prisma.book.delete({ where: { id: book.id } });
    });
  });

  describe('Chapter Model and Relationships', () => {
    it('should create Chapter records linked to Book', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book for Chapters',
          pdfPath: '/test/chapters.pdf',
          summary: 'Test',
          status: 'PROCESSING',
        },
      });

      const chapter1 = await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: 1,
          title: 'Introduction to Programming',
          content: '<h1>Introduction to Programming</h1><p>This chapter covers the fundamentals...</p>',
          wordCount: 2500,
          startPage: 1,
          endPage: 15,
        },
      });

      const chapter2 = await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: 2,
          title: 'Variables and Data Types',
          content: '<h1>Variables and Data Types</h1><p>Understanding variables...</p>',
          wordCount: 3200,
          startPage: 16,
          endPage: 30,
        },
      });

      expect(chapter1).toBeDefined();
      expect(chapter1.id).toBeDefined();
      expect(chapter1.bookId).toBe(book.id);
      expect(chapter2).toBeDefined();
      expect(chapter2.id).toBeDefined();
      expect(chapter2.bookId).toBe(book.id);

      // Cleanup
      await prisma.book.delete({ where: { id: book.id } });
    });

    it('should verify Book → Chapters relationship', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book with Relationships',
          pdfPath: '/test/relationships.pdf',
          summary: 'Test',
          status: 'READY',
        },
      });

      await prisma.chapter.createMany({
        data: [
          {
            bookId: book.id,
            chapterNumber: 1,
            title: 'Chapter 1',
            content: 'Content 1',
            wordCount: 1000,
            startPage: 1,
            endPage: 10,
          },
          {
            bookId: book.id,
            chapterNumber: 2,
            title: 'Chapter 2',
            content: 'Content 2',
            wordCount: 1500,
            startPage: 11,
            endPage: 20,
          },
        ],
      });

      const bookWithChapters = await prisma.book.findUnique({
        where: { id: book.id },
        include: {
          chapters: {
            orderBy: { chapterNumber: 'asc' },
          },
        },
      });

      expect(bookWithChapters).toBeDefined();
      expect(bookWithChapters?.chapters).toHaveLength(2);
      expect(bookWithChapters?.chapters[0].chapterNumber).toBe(1);
      expect(bookWithChapters?.chapters[1].chapterNumber).toBe(2);

      // Cleanup
      await prisma.book.delete({ where: { id: book.id } });
    });
  });

  describe('ReadingProgress Model', () => {
    it('should create ReadingProgress record', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book for Progress',
          pdfPath: '/test/progress.pdf',
          summary: 'Test',
          status: 'READY',
        },
      });

      const chapter = await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: 1,
          title: 'Chapter 1',
          content: 'Content',
          wordCount: 1000,
          startPage: 1,
          endPage: 10,
        },
      });

      const progress = await prisma.readingProgress.create({
        data: {
          bookId: book.id,
          chapterId: chapter.id,
          position: 45,
        },
      });

      expect(progress).toBeDefined();
      expect(progress.id).toBeDefined();
      expect(progress.position).toBe(45);
      expect(progress.lastReadAt).toBeInstanceOf(Date);

      // Cleanup
      await prisma.book.delete({ where: { id: book.id } });
    });

    it('should enforce unique constraint on (bookId, chapterId)', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book for Unique Constraint',
          pdfPath: '/test/unique.pdf',
          summary: 'Test',
          status: 'READY',
        },
      });

      const chapter = await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: 1,
          title: 'Chapter 1',
          content: 'Content',
          wordCount: 1000,
          startPage: 1,
          endPage: 10,
        },
      });

      await prisma.readingProgress.create({
        data: {
          bookId: book.id,
          chapterId: chapter.id,
          position: 45,
        },
      });

      // Attempt to create duplicate
      await expect(
        prisma.readingProgress.create({
          data: {
            bookId: book.id,
            chapterId: chapter.id,
            position: 75,
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.book.delete({ where: { id: book.id } });
    });

    it('should update lastReadAt when position changes', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book for Update',
          pdfPath: '/test/update.pdf',
          summary: 'Test',
          status: 'READY',
        },
      });

      const chapter = await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: 1,
          title: 'Chapter 1',
          content: 'Content',
          wordCount: 1000,
          startPage: 1,
          endPage: 10,
        },
      });

      const progress = await prisma.readingProgress.create({
        data: {
          bookId: book.id,
          chapterId: chapter.id,
          position: 45,
        },
      });

      const originalLastReadAt = progress.lastReadAt;

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedProgress = await prisma.readingProgress.update({
        where: { id: progress.id },
        data: { position: 85 },
      });

      expect(updatedProgress.position).toBe(85);
      expect(updatedProgress.lastReadAt.getTime()).toBeGreaterThan(originalLastReadAt.getTime());

      // Cleanup
      await prisma.book.delete({ where: { id: book.id } });
    });
  });

  describe('Cascade Delete', () => {
    it('should cascade delete Chapters and ReadingProgress when Book is deleted', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Test Book for Cascade Delete',
          pdfPath: '/test/cascade.pdf',
          summary: 'Test',
          status: 'READY',
        },
      });

      const chapter = await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: 1,
          title: 'Chapter 1',
          content: 'Content',
          wordCount: 1000,
          startPage: 1,
          endPage: 10,
        },
      });

      await prisma.readingProgress.create({
        data: {
          bookId: book.id,
          chapterId: chapter.id,
          position: 50,
        },
      });

      const chapterCountBefore = await prisma.chapter.count({ where: { bookId: book.id } });
      const progressCountBefore = await prisma.readingProgress.count({ where: { bookId: book.id } });

      expect(chapterCountBefore).toBe(1);
      expect(progressCountBefore).toBe(1);

      // Delete book
      await prisma.book.delete({ where: { id: book.id } });

      const chaptersAfter = await prisma.chapter.count({ where: { bookId: book.id } });
      const progressAfter = await prisma.readingProgress.count({ where: { bookId: book.id } });

      expect(chaptersAfter).toBe(0);
      expect(progressAfter).toBe(0);
    });
  });

  describe('BookStatus Enum', () => {
    it('should support all BookStatus enum values', async () => {
      const processingBook = await prisma.book.create({
        data: {
          title: 'Processing Book',
          pdfPath: '/test/processing.pdf',
          summary: 'Test',
          status: 'PROCESSING',
        },
      });
      expect(processingBook.status).toBe('PROCESSING');

      const readyBook = await prisma.book.create({
        data: {
          title: 'Ready Book',
          pdfPath: '/test/ready.pdf',
          summary: 'Test',
          status: 'READY',
        },
      });
      expect(readyBook.status).toBe('READY');

      const errorBook = await prisma.book.create({
        data: {
          title: 'Error Book',
          pdfPath: '/test/error.pdf',
          summary: 'Test',
          status: 'ERROR',
        },
      });
      expect(errorBook.status).toBe('ERROR');

      // Cleanup
      await prisma.book.deleteMany({
        where: {
          id: { in: [processingBook.id, readyBook.id, errorBook.id] },
        },
      });
    });
  });
});
