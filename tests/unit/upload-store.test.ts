import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock XMLHttpRequest
class MockXHR {
  static instances: MockXHR[] = [];

  status = 0;
  responseText = '';
  readyState = 0;

  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload = {
    onprogress: null as ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null,
  };

  open = vi.fn();
  send = vi.fn();
  abort = vi.fn();

  constructor() {
    MockXHR.instances.push(this);
  }

  // Helpers to simulate events
  simulateProgress(loaded: number, total: number) {
    if (this.upload.onprogress) {
      this.upload.onprogress({ lengthComputable: true, loaded, total });
    }
  }

  simulateSuccess(bookId: string) {
    this.status = 201;
    this.responseText = JSON.stringify({ success: true, bookId });
    if (this.onload) this.onload();
  }

  simulateError(status: number, error: string) {
    this.status = status;
    this.responseText = JSON.stringify({ error });
    if (this.onload) this.onload();
  }

  simulateNetworkError() {
    if (this.onerror) this.onerror();
  }

  simulateAbort() {
    if (this.onabort) this.onabort();
  }
}

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock books store
vi.mock('@/lib/stores/books-store', () => ({
  useBooksStore: {
    getState: () => ({
      addBook: vi.fn(),
    }),
  },
}));

describe('Upload Store', () => {
  let useUploadStore: typeof import('@/lib/stores/upload-store').useUploadStore;

  beforeEach(async () => {
    vi.resetModules();
    MockXHR.instances = [];

    // Mock XMLHttpRequest globally
    vi.stubGlobal('XMLHttpRequest', MockXHR);

    // Import fresh module
    const module = await import('@/lib/stores/upload-store');
    useUploadStore = module.useUploadStore;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('startUpload', () => {
    it('should add upload to store immediately', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const state = useUploadStore.getState();
      expect(state.uploadingBooks).toHaveLength(1);
      expect(state.uploadingBooks[0].fileName).toBe('test.pdf');
      expect(state.uploadingBooks[0].status).toBe('uploading');
      expect(state.uploadingBooks[0].progress).toBe(0);
    });

    it('should create XHR and send FormData', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      expect(MockXHR.instances).toHaveLength(1);
      const xhr = MockXHR.instances[0];
      expect(xhr.open).toHaveBeenCalledWith('POST', '/api/upload');
      expect(xhr.send).toHaveBeenCalled();
    });

    it('should track progress via upload.onprogress', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];
      xhr.simulateProgress(50, 100);

      const state = useUploadStore.getState();
      expect(state.uploadingBooks[0].progress).toBe(50);
    });

    it('should handle successful upload', async () => {
      vi.useFakeTimers();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];
      xhr.simulateSuccess('book-123');

      let state = useUploadStore.getState();
      expect(state.uploadingBooks[0].status).toBe('success');
      expect(state.uploadingBooks[0].bookId).toBe('book-123');

      // After delay, should be removed
      await vi.advanceTimersByTimeAsync(1600);

      state = useUploadStore.getState();
      expect(state.uploadingBooks).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should handle error response with specific message', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];
      xhr.simulateError(400, 'Invalid PDF file');

      const state = useUploadStore.getState();
      expect(state.uploadingBooks[0].status).toBe('error');
      expect(state.uploadingBooks[0].error).toBe('Invalid PDF file');
    });

    it('should handle 413 file too large error', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];
      xhr.status = 413;
      xhr.responseText = JSON.stringify({ error: 'File exceeds 50MB limit' });

      if (xhr.onload) xhr.onload();

      const state = useUploadStore.getState();
      expect(state.uploadingBooks[0].status).toBe('error');
      expect(state.uploadingBooks[0].error).toBe('File exceeds 50MB limit');
    });

    it('should handle network error', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];
      xhr.simulateNetworkError();

      const state = useUploadStore.getState();
      expect(state.uploadingBooks[0].status).toBe('error');
      expect(state.uploadingBooks[0].error).toBe('Upload failed - check connection');
    });
  });

  describe('cancelUpload', () => {
    it('should abort XHR and set status to cancelled', async () => {
      vi.useFakeTimers();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const uploadId = useUploadStore.getState().uploadingBooks[0].id;
      const xhr = MockXHR.instances[0];

      useUploadStore.getState().cancelUpload(uploadId);

      expect(xhr.abort).toHaveBeenCalled();

      const state = useUploadStore.getState();
      expect(state.uploadingBooks[0].status).toBe('cancelled');

      // After delay, should be removed
      await vi.advanceTimersByTimeAsync(1600);

      expect(useUploadStore.getState().uploadingBooks).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should not cancel if upload is not in uploading status', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];

      // Simulate error first
      xhr.simulateError(400, 'Invalid PDF');

      const uploadId = useUploadStore.getState().uploadingBooks[0].id;

      useUploadStore.getState().cancelUpload(uploadId);

      // Abort should not be called (status is already error)
      expect(xhr.abort).not.toHaveBeenCalled();
    });
  });

  describe('retryUpload', () => {
    it('should remove failed upload and start new one', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const xhr = MockXHR.instances[0];
      xhr.simulateError(500, 'Server error');

      const uploadId = useUploadStore.getState().uploadingBooks[0].id;

      useUploadStore.getState().retryUpload(uploadId);

      // Should have created new XHR
      expect(MockXHR.instances).toHaveLength(2);

      // Should have new upload with same file
      const state = useUploadStore.getState();
      expect(state.uploadingBooks).toHaveLength(1);
      expect(state.uploadingBooks[0].fileName).toBe('test.pdf');
      expect(state.uploadingBooks[0].status).toBe('uploading');
      expect(state.uploadingBooks[0].id).not.toBe(uploadId);
    });

    it('should not retry if upload is still in progress', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const uploadId = useUploadStore.getState().uploadingBooks[0].id;

      useUploadStore.getState().retryUpload(uploadId);

      // Should not have created new XHR
      expect(MockXHR.instances).toHaveLength(1);
    });
  });

  describe('removeUpload', () => {
    it('should remove upload from store', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file);

      const uploadId = useUploadStore.getState().uploadingBooks[0].id;

      useUploadStore.getState().removeUpload(uploadId);

      expect(useUploadStore.getState().uploadingBooks).toHaveLength(0);
    });
  });

  describe('multiple uploads', () => {
    it('should handle multiple concurrent uploads', () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);

      expect(MockXHR.instances).toHaveLength(3);

      const state = useUploadStore.getState();
      expect(state.uploadingBooks).toHaveLength(3);
      expect(state.uploadingBooks[0].fileName).toBe('test1.pdf');
      expect(state.uploadingBooks[1].fileName).toBe('test2.pdf');
      expect(state.uploadingBooks[2].fileName).toBe('test3.pdf');
    });

    it('should update correct upload when progress changes', () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });

      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);

      const xhr2 = MockXHR.instances[1];
      xhr2.simulateProgress(75, 100);

      const state = useUploadStore.getState();
      expect(state.uploadingBooks[0].progress).toBe(0); // First upload unchanged
      expect(state.uploadingBooks[1].progress).toBe(75); // Second upload updated
    });
  });

  describe('Upload Queue Management', () => {
    it('should limit concurrent uploads to 3', () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });
      const file4 = new File(['test 4'], 'test4.pdf', { type: 'application/pdf' });

      // Start 4 uploads
      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);
      useUploadStore.getState().startUpload(file4);

      const state = useUploadStore.getState();

      // Only 3 should be actively uploading
      expect(state.uploadingBooks).toHaveLength(3);
      expect(state.uploadingBooks[0].fileName).toBe('test1.pdf');
      expect(state.uploadingBooks[1].fileName).toBe('test2.pdf');
      expect(state.uploadingBooks[2].fileName).toBe('test3.pdf');

      // 4th should be in pending queue
      expect(state.pendingUploads).toHaveLength(1);
      expect(state.pendingUploads[0].name).toBe('test4.pdf');
    });

    it('should start queued upload when one completes', async () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });
      const file4 = new File(['test 4'], 'test4.pdf', { type: 'application/pdf' });

      // Start 4 uploads - 3 active, 1 pending
      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);
      useUploadStore.getState().startUpload(file4);

      // Verify initial state
      expect(useUploadStore.getState().uploadingBooks).toHaveLength(3);
      expect(useUploadStore.getState().pendingUploads).toHaveLength(1);

      // Complete first upload (this triggers processQueue)
      const xhr1 = MockXHR.instances[0];
      xhr1.simulateSuccess('book-1');

      // Wait for processing simulation to complete and trigger processQueue
      await vi.waitFor(() => {
        const state = useUploadStore.getState();
        return state.uploadingBooks.some(b => b.fileName === 'test4.pdf');
      }, { timeout: 100 });

      const state = useUploadStore.getState();

      // 4th upload should now be active
      expect(state.pendingUploads).toHaveLength(0);
      expect(state.uploadingBooks.some(b => b.fileName === 'test4.pdf')).toBe(true);
    });

    it('should handle 5+ uploads with proper queueing', () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        new File([`test ${i + 1}`], `test${i + 1}.pdf`, { type: 'application/pdf' })
      );

      // Start 6 uploads
      files.forEach(file => useUploadStore.getState().startUpload(file));

      const state = useUploadStore.getState();

      // 3 active, 3 pending
      expect(state.uploadingBooks).toHaveLength(3);
      expect(state.pendingUploads).toHaveLength(3);

      // Verify queue order (FIFO)
      expect(state.pendingUploads[0].name).toBe('test4.pdf');
      expect(state.pendingUploads[1].name).toBe('test5.pdf');
      expect(state.pendingUploads[2].name).toBe('test6.pdf');
    });

    it('should start next queued upload when one fails', async () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });
      const file4 = new File(['test 4'], 'test4.pdf', { type: 'application/pdf' });

      // Start 4 uploads
      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);
      useUploadStore.getState().startUpload(file4);

      // Fail first upload (this should trigger processQueue)
      const xhr1 = MockXHR.instances[0];
      xhr1.simulateError(500, 'Server error');

      await vi.waitFor(() => {
        const state = useUploadStore.getState();
        return state.uploadingBooks.some(b => b.fileName === 'test4.pdf');
      }, { timeout: 100 });

      const state = useUploadStore.getState();

      // 4th upload should be active, pending should be empty
      expect(state.pendingUploads).toHaveLength(0);
      expect(state.uploadingBooks.some(b => b.fileName === 'test4.pdf')).toBe(true);

      // Failed upload should still be in list with error state
      expect(state.uploadingBooks.some(b => b.fileName === 'test1.pdf' && b.status === 'error')).toBe(true);
    });

    it('should start next queued upload when one is cancelled', async () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });
      const file4 = new File(['test 4'], 'test4.pdf', { type: 'application/pdf' });

      // Start 4 uploads
      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);
      useUploadStore.getState().startUpload(file4);

      const firstUploadId = useUploadStore.getState().uploadingBooks[0].id;

      // Cancel first upload (this should trigger processQueue)
      useUploadStore.getState().cancelUpload(firstUploadId);

      await vi.waitFor(() => {
        const state = useUploadStore.getState();
        return state.uploadingBooks.some(b => b.fileName === 'test4.pdf');
      }, { timeout: 100 });

      const state = useUploadStore.getState();

      // 4th upload should be active, pending should be empty
      expect(state.pendingUploads).toHaveLength(0);
      expect(state.uploadingBooks.some(b => b.fileName === 'test4.pdf')).toBe(true);
    });

    it('should handle uploads completing out of order', async () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });
      const file4 = new File(['test 4'], 'test4.pdf', { type: 'application/pdf' });
      const file5 = new File(['test 5'], 'test5.pdf', { type: 'application/pdf' });

      // Start 5 uploads - 3 active, 2 pending
      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);
      useUploadStore.getState().startUpload(file4);
      useUploadStore.getState().startUpload(file5);

      // Complete 2nd upload first (out of order)
      const xhr2 = MockXHR.instances[1];
      xhr2.simulateSuccess('book-2');

      await vi.waitFor(() => {
        const state = useUploadStore.getState();
        return state.uploadingBooks.some(b => b.fileName === 'test4.pdf');
      }, { timeout: 100 });

      let state = useUploadStore.getState();

      // test4 should be active, one still pending
      expect(state.uploadingBooks.some(b => b.fileName === 'test4.pdf')).toBe(true);
      expect(state.pendingUploads).toHaveLength(1);
      expect(state.pendingUploads[0].name).toBe('test5.pdf');

      // Complete 3rd upload
      const xhr3 = MockXHR.instances[2];
      xhr3.simulateSuccess('book-3');

      await vi.waitFor(() => {
        const state = useUploadStore.getState();
        return state.uploadingBooks.some(b => b.fileName === 'test5.pdf');
      }, { timeout: 100 });

      state = useUploadStore.getState();

      // test5 should now be active, pending should be empty
      expect(state.uploadingBooks.some(b => b.fileName === 'test5.pdf')).toBe(true);
      expect(state.pendingUploads).toHaveLength(0);
    });

    it('should not start queued uploads when slots are still full', () => {
      const file1 = new File(['test 1'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test 2'], 'test2.pdf', { type: 'application/pdf' });
      const file3 = new File(['test 3'], 'test3.pdf', { type: 'application/pdf' });
      const file4 = new File(['test 4'], 'test4.pdf', { type: 'application/pdf' });

      // Start 4 uploads
      useUploadStore.getState().startUpload(file1);
      useUploadStore.getState().startUpload(file2);
      useUploadStore.getState().startUpload(file3);
      useUploadStore.getState().startUpload(file4);

      // Manually call processQueue (shouldn't do anything)
      useUploadStore.getState().processQueue();

      const state = useUploadStore.getState();

      // Should remain unchanged - 3 active, 1 pending
      expect(state.uploadingBooks).toHaveLength(3);
      expect(state.pendingUploads).toHaveLength(1);
    });
  });
});
