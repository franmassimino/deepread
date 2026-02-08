import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractProcessor } from '@/lib/jobs/extract-job';
import { prisma } from '@/lib/db/db';
import { storageService } from '@/lib/services/storage';
import * as pdfExtraction from '@/lib/services/pdf-extraction';

// Mocks
vi.mock('@/lib/db/db', () => ({
  prisma: {
    processingJob: {
      update: vi.fn(),
    },
    book: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/storage', () => ({
  storageService: {
    getFilePath: vi.fn(),
    fileExists: vi.fn(),
  },
}));

vi.mock('@/lib/jobs/job-utils', () => ({
  updateProcessingJob: vi.fn(),
  handleJobFailure: vi.fn(),
  createNextJob: vi.fn().mockResolvedValue('next-job-id'),
}));

describe('EXTRACT Job', () => {
  const mockJob = {
    id: 'job-123',
    data: {
      bookId: 'book-123',
      processingJobId: 'proc-123',
    },
    updateProgress: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract text and tables from PDF', async () => {
    const mockBook = {
      id: 'book-123',
      pdfPath: 'test.pdf',
    };

    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook as any);
    vi.mocked(storageService.fileExists).mockResolvedValue(true);
    vi.mocked(storageService.getFilePath).mockReturnValue('/path/to/test.pdf');
    
    vi.spyOn(pdfExtraction, 'extractTextFromPDF').mockResolvedValue({
      text: 'Sample text content',
      pageCount: 10,
      info: {},
    });
    
    vi.spyOn(pdfExtraction, 'extractTablesFromPDF').mockResolvedValue([]);
    vi.spyOn(pdfExtraction, 'isScannedPDF').mockReturnValue(false);
    vi.spyOn(pdfExtraction, 'getWordCount').mockReturnValue(100);

    const result = await extractProcessor(mockJob);

    expect(result.text).toBe('Sample text content');
    expect(result.pageCount).toBe(10);
    expect(result.wordCount).toBe(100);
    expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
  });

  it('should throw error if book not found', async () => {
    vi.mocked(prisma.book.findUnique).mockResolvedValue(null);

    await expect(extractProcessor(mockJob)).rejects.toThrow();
  });

  it('should throw error if PDF file not found', async () => {
    const mockBook = { id: 'book-123', pdfPath: 'test.pdf' };
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook as any);
    vi.mocked(storageService.fileExists).mockResolvedValue(false);

    await expect(extractProcessor(mockJob)).rejects.toThrow('PDF file not found');
  });

  it('should throw error for scanned PDF', async () => {
    const mockBook = { id: 'book-123', pdfPath: 'test.pdf' };
    vi.mocked(prisma.book.findUnique).mockResolvedValue(mockBook as any);
    vi.mocked(storageService.fileExists).mockResolvedValue(true);
    vi.mocked(storageService.getFilePath).mockReturnValue('/path/to/test.pdf');
    
    vi.spyOn(pdfExtraction, 'extractTextFromPDF').mockResolvedValue({
      text: '',
      pageCount: 10,
      info: {},
    });
    vi.spyOn(pdfExtraction, 'isScannedPDF').mockReturnValue(true);

    await expect(extractProcessor(mockJob)).rejects.toThrow('scanned');
  });
});
