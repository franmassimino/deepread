import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/jobs/[jobId]/progress/route';
import { prisma } from '@/lib/db/db';
import { pdfQueue } from '@/lib/services/queue';

// Mock dependencies
vi.mock('@/lib/db/db', () => ({
  prisma: {
    processingJob: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/queue', () => ({
  pdfQueue: {
    getJob: vi.fn(),
  },
}));

describe('GET /api/jobs/[jobId]/progress', () => {
  const mockJob = {
    id: 'test-job-id',
    bookId: 'test-book-id',
    type: 'EXTRACT' as const,
    status: 'ACTIVE' as const,
    progress: 50,
    stage: 'extract-text',
    message: 'Extracting text...',
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 if job not found', async () => {
    vi.mocked(prisma.processingJob.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/jobs/non-existent/progress');
    const response = await GET(request, { params: Promise.resolve({ jobId: 'non-existent' }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Job not found');
  });

  it('should return SSE stream with correct headers', async () => {
    vi.mocked(prisma.processingJob.findUnique).mockResolvedValue(mockJob);
    vi.mocked(pdfQueue.getJob).mockResolvedValue(null);

    const request = new Request('http://localhost/api/jobs/test-job-id/progress');
    const response = await GET(request, { params: Promise.resolve({ jobId: 'test-job-id' }) });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('should have a readable body stream', async () => {
    vi.mocked(prisma.processingJob.findUnique).mockResolvedValue(mockJob);
    vi.mocked(pdfQueue.getJob).mockResolvedValue(null);

    const request = new Request('http://localhost/api/jobs/test-job-id/progress');
    const response = await GET(request, { params: Promise.resolve({ jobId: 'test-job-id' }) });

    expect(response.body).toBeDefined();
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  it('should query the database for job details', async () => {
    vi.mocked(prisma.processingJob.findUnique).mockResolvedValue(mockJob);
    vi.mocked(pdfQueue.getJob).mockResolvedValue(null);

    const request = new Request('http://localhost/api/jobs/test-job-id/progress');
    await GET(request, { params: Promise.resolve({ jobId: 'test-job-id' }) });

    expect(prisma.processingJob.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-job-id' },
      select: {
        id: true,
        bookId: true,
        type: true,
        status: true,
        progress: true,
        stage: true,
        message: true,
        error: true,
      },
    });
  });

  it('should handle aborted request', async () => {
    vi.mocked(prisma.processingJob.findUnique).mockResolvedValue(mockJob);
    vi.mocked(pdfQueue.getJob).mockResolvedValue(null);

    const controller = new AbortController();
    const request = new Request('http://localhost/api/jobs/test-job-id/progress', {
      signal: controller.signal,
    });

    // Start the request
    const responsePromise = GET(request, { params: Promise.resolve({ jobId: 'test-job-id' }) });
    
    // Abort it immediately
    controller.abort();

    const response = await responsePromise;
    expect(response.status).toBe(200); // Response is still created
  });
});
