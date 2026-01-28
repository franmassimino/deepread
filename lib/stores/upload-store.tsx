"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import { useBooksStore } from './books-store';

export type UploadStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'cancelled';

export interface UploadingBook {
  id: string;
  fileName: string;
  progress: number;        // Unified progress: 0-100% (upload = 0-30%, processing = 30-100%)
  currentStep: number;     // Current processing step (0 = uploading, 1-5 = processing steps)
  file: File;
  status: UploadStatus;
  error: string | null;
  xhr: XMLHttpRequest | null;
  bookId: string | null;
}

interface UploadStore {
  uploadingBooks: UploadingBook[];
  pendingUploads: File[];
  startUpload: (file: File) => void;
  cancelUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  updateUpload: (id: string, updates: Partial<UploadingBook>) => void;
  processQueue: () => void;
  _startUploadImmediate: (file: File) => void;
}

// Maximum number of concurrent uploads
const MAX_CONCURRENT_UPLOADS = 3;

// Progress allocation: upload = 0-30%, processing = 30-100%
const UPLOAD_PROGRESS_MAX = 30;
const PROCESSING_PROGRESS_START = 30;
const PROCESSING_PROGRESS_RANGE = 70; // 100 - 30 = 70%

// Processing steps shown during "AI processing" simulation
const processingSteps = [
  { label: "Parsing PDF...", duration: 800 },
  { label: "Extracting text...", duration: 1000 },
  { label: "Generating metadata...", duration: 1200 },
  { label: "Creating chapters...", duration: 800 },
  { label: "Finalizing...", duration: 600 },
];

/**
 * Maps API error status codes to user-friendly messages
 */
function getErrorMessage(status: number, responseText: string): string {
  try {
    const response = JSON.parse(responseText);
    if (response.error) return response.error;
  } catch {
    // Ignore parse errors
  }

  switch (status) {
    case 400:
      return 'Invalid PDF file';
    case 413:
      return 'File exceeds 50MB limit';
    case 500:
      return 'Server error - please try again';
    default:
      return 'Upload failed - please try again';
  }
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploadingBooks: [],
  pendingUploads: [],

  updateUpload: (id: string, updates: Partial<UploadingBook>) => {
    set((state) => ({
      uploadingBooks: state.uploadingBooks.map((book) =>
        book.id === id ? { ...book, ...updates } : book
      ),
    }));
  },

  removeUpload: (id: string) => {
    set((state) => ({
      uploadingBooks: state.uploadingBooks.filter((book) => book.id !== id),
    }));
  },

  cancelUpload: (id: string) => {
    const book = get().uploadingBooks.find((b) => b.id === id);
    if (book?.xhr && book.status === 'uploading') {
      book.xhr.abort();
      get().updateUpload(id, { status: 'cancelled', error: 'Upload cancelled' });

      // Remove from list after a brief delay
      setTimeout(() => {
        get().removeUpload(id);
      }, 1500);

      toast.info(`Upload cancelled: "${book.fileName}"`);

      // Process next queued upload
      get().processQueue();
    }
  },

  retryUpload: (id: string) => {
    const book = get().uploadingBooks.find((b) => b.id === id);
    if (book && (book.status === 'error' || book.status === 'cancelled')) {
      // Remove the failed upload
      get().removeUpload(id);
      // Start a new upload with the same file
      get().startUpload(book.file);
    }
  },

  startUpload: (file: File) => {
    const { uploadingBooks, pendingUploads } = get();

    // Count active uploads (uploading or processing status)
    const activeUploads = uploadingBooks.filter(
      book => book.status === 'uploading' || book.status === 'processing'
    ).length;

    // If we have available slots, start immediately
    if (activeUploads < MAX_CONCURRENT_UPLOADS) {
      get()._startUploadImmediate(file);
    } else {
      // Otherwise, add to pending queue
      set({ pendingUploads: [...pendingUploads, file] });
    }
  },

  processQueue: () => {
    const { uploadingBooks, pendingUploads } = get();

    // Count active uploads (uploading or processing status)
    const activeUploads = uploadingBooks.filter(
      book => book.status === 'uploading' || book.status === 'processing'
    ).length;

    // Calculate how many slots are available
    const availableSlots = MAX_CONCURRENT_UPLOADS - activeUploads;

    // Start uploads for available slots
    if (availableSlots > 0 && pendingUploads.length > 0) {
      const filesToStart = pendingUploads.slice(0, availableSlots);
      const remainingPending = pendingUploads.slice(availableSlots);

      // Update pending queue
      set({ pendingUploads: remainingPending });

      // Start each upload immediately (bypass queue check)
      filesToStart.forEach(file => get()._startUploadImmediate(file));
    }
  },

  _startUploadImmediate: (file: File) => {
    const id = `${file.name}-${Date.now()}`;
    const xhr = new XMLHttpRequest();

    const newUpload: UploadingBook = {
      id,
      fileName: file.name,
      progress: 0,
      currentStep: 0,
      file,
      status: 'uploading',
      error: null,
      xhr,
      bookId: null,
    };

    // Add to store immediately
    set((state) => ({
      uploadingBooks: [...state.uploadingBooks, newUpload],
    }));

    // Track upload progress (0-30% of total)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const uploadPercent = (event.loaded / event.total);
        const progress = Math.round(uploadPercent * UPLOAD_PROGRESS_MAX);
        get().updateUpload(id, { progress, currentStep: 0 });
      }
    };

    // Handle successful upload completion
    xhr.onload = () => {
      if (xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          const bookId = response.bookId;

          // Mark as processing and start simulated AI processing
          get().updateUpload(id, {
            status: 'processing',
            progress: UPLOAD_PROGRESS_MAX, // Upload complete = 30%
            currentStep: 1,
            bookId
          });

          // Simulate AI processing steps
          // TODO: Replace with real SSE/polling in Epic 3
          simulateProcessing(id, bookId, file.name, get);

          // Note: processQueue is called when processing completes, not here

        } catch {
          get().updateUpload(id, {
            status: 'error',
            error: 'Invalid server response'
          });

          // Process next queued upload
          get().processQueue();
        }
      } else {
        // Handle error responses
        const errorMessage = getErrorMessage(xhr.status, xhr.responseText);
        get().updateUpload(id, {
          status: 'error',
          error: errorMessage
        });

        toast.error(`Failed to upload "${file.name}"`, {
          description: errorMessage,
          duration: 5000,
        });

        // Process next queued upload
        get().processQueue();
      }
    };

    // Handle network errors
    xhr.onerror = () => {
      get().updateUpload(id, {
        status: 'error',
        error: 'Upload failed - check connection'
      });

      toast.error(`Failed to upload "${file.name}"`, {
        description: 'Network error - check your connection',
        duration: 5000,
      });

      // Process next queued upload
      get().processQueue();
    };

    // Handle abort (cancel)
    xhr.onabort = () => {
      // Already handled in cancelUpload
    };

    // Send the request
    const formData = new FormData();
    formData.append('file', file);
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  },
}));

/**
 * Simulates AI processing with visual progress steps.
 * TODO: Replace with real SSE/polling when Epic 3 is implemented.
 */
async function simulateProcessing(
  uploadId: string,
  bookId: string,
  fileName: string,
  get: () => UploadStore
) {
  const bookTitle = fileName.replace('.pdf', '');

  // Run through each processing step
  for (let i = 0; i < processingSteps.length; i++) {
    const step = processingSteps[i];

    // Check if upload was cancelled
    const currentBook = get().uploadingBooks.find(b => b.id === uploadId);
    if (!currentBook || currentBook.status === 'cancelled') {
      return;
    }

    // Calculate unified progress: 30% + (step / totalSteps) * 70%
    const stepProgress = PROCESSING_PROGRESS_START +
      ((i + 1) / processingSteps.length) * PROCESSING_PROGRESS_RANGE;

    // Update to current step and unified progress
    get().updateUpload(uploadId, {
      currentStep: i + 1,
      progress: Math.round(stepProgress)
    });

    await new Promise(resolve => setTimeout(resolve, step.duration));
  }

  // Mark as ready (100%)
  get().updateUpload(uploadId, { status: 'ready', currentStep: processingSteps.length, progress: 100 });

  // Add book to library
  const colors = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  useBooksStore.getState().addBook({
    id: bookId,
    title: bookTitle,
    author: 'Unknown Author',
    progress: 0,
    status: 'reading',
    lastActivity: 'Just added',
    coverColor: randomColor,
  });

  toast.success(`"${bookTitle}" is ready!`, {
    description: 'Your book is now available in your library',
    duration: 4000,
  });

  // Remove from uploading list after brief delay
  setTimeout(() => {
    get().removeUpload(uploadId);
  }, 1000);

  // Process next queued upload (processing is complete)
  get().processQueue();
}
