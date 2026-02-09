"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import { useBooksStore } from './books-store';
import { useJobProgressStore } from './job-progress-store';

export type UploadStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'cancelled';

export interface ProcessingInfo {
  jobId: string;
  processingJobId: string;
}

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
  processingInfo: ProcessingInfo | null; // SSE job tracking info
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

// Processing steps shown during PDF extraction
const processingSteps = [
  { label: "Extracting text...", duration: 1500 },      // 30-65%
  { label: "Extracting tables...", duration: 1500 },    // 65-100%
  { label: "Finalizing...", duration: 500 },
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
      processingInfo: null,
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

          // Get processing job info from response
          const processingInfo: ProcessingInfo = {
            jobId: response.jobId,
            processingJobId: response.processingJobId,
          };

          // Mark as processing and store job info for SSE
          get().updateUpload(id, {
            status: 'processing',
            progress: UPLOAD_PROGRESS_MAX, // Upload complete = 30%
            currentStep: 1,
            bookId,
            processingInfo,
          });

          // Register job in global progress store for SSE tracking
          useJobProgressStore.getState().registerJob({
            jobId: processingInfo.processingJobId,
            bookId,
            fileName: file.name,
            uploadId: id,
            progress: null,
          });

          // Trigger PDF processing
          triggerProcessing(id, bookId, file.name, processingInfo, get);

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
 * Triggers PDF processing and sets up SSE for real-time progress updates.
 * Uses Server-Sent Events instead of polling for better real-time updates.
 */
async function triggerProcessing(
  uploadId: string,
  bookId: string,
  fileName: string,
  processingInfo: ProcessingInfo,
  get: () => UploadStore
) {
  const { processingJobId } = processingInfo;
  const bookTitle = fileName.replace('.pdf', '');
  
  // Set up SSE connection for real-time progress
  const eventSource = new EventSource(`/api/jobs/${processingJobId}/progress`);
  
  eventSource.onopen = () => {
    console.log(`[Upload] SSE connected for job ${processingJobId}`);
  };
  
  eventSource.onmessage = (event) => {
    try {
      // Handle keep-alive comments
      if (event.data.startsWith(':')) {
        return;
      }
      
      const data = JSON.parse(event.data);
      
      // Check if upload was cancelled
      const currentBook = get().uploadingBooks.find(b => b.id === uploadId);
      if (!currentBook || currentBook.status === 'cancelled') {
        eventSource.close();
        return;
      }
      
      const { status, progress, overallProgress, message, error } = data;
      
      // Calculate unified progress: 30% (upload) + 70% * (overallProgress / 100)
      const totalProgress = PROCESSING_PROGRESS_START + 
        ((overallProgress || progress || 0) / 100) * PROCESSING_PROGRESS_RANGE;
      
      // Update global job progress store
      useJobProgressStore.getState().setJobProgress(processingJobId, data);
      
      // Handle terminal states
      if (status === 'COMPLETED') {
        // Processing complete
        eventSource.close();
        
        get().updateUpload(uploadId, { 
          status: 'ready', 
          currentStep: processingSteps.length, 
          progress: 100 
        });

        // Add book to library
        const colors = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        useBooksStore.getState().addBook({
          id: bookId,
          title: bookTitle,
          author: 'Unknown Author', // Will be updated when metadata extraction is complete
          progress: 0,
          status: 'reading',
          lastActivity: 'Just added',
          coverColor: randomColor,
        });

        toast.success(`"${bookTitle}" is ready!`, {
          description: 'Your book is now available in your library',
          duration: 4000,
        });

        // Unregister job and remove from uploading list
        useJobProgressStore.getState().unregisterJob(processingJobId);
        setTimeout(() => {
          get().removeUpload(uploadId);
        }, 1000);

        // Process next queued upload
        get().processQueue();
        
      } else if (status === 'FAILED') {
        // Processing failed
        eventSource.close();
        
        const errorMessage = error || 'PDF processing failed';
        
        get().updateUpload(uploadId, {
          status: 'error',
          error: errorMessage
        });

        toast.error(`Failed to process "${fileName}"`, {
          description: errorMessage,
          duration: 5000,
        });

        // Unregister job
        useJobProgressStore.getState().unregisterJob(processingJobId);
        
        // Process next queued upload
        get().processQueue();
        
      } else {
        // Still processing - update progress
        // Map message to current step
        const stepMap: Record<string, number> = {
          'Waiting to start...': 1,
          'Extracting text...': 1,
          'Extracting tables and images...': 2,
          'Finalizing extraction...': 2,
          'Analyzing content...': 3,
          'Converting to HTML...': 4,
        };
        
        const currentStep = stepMap[message] || 
          Math.min(Math.floor((totalProgress - PROCESSING_PROGRESS_START) / 10) + 1, processingSteps.length);
        
        get().updateUpload(uploadId, {
          currentStep,
          progress: Math.round(totalProgress)
        });
      }
    } catch (error) {
      console.error('[Upload] Error parsing SSE message:', error);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error(`[Upload] SSE error for job ${processingJobId}:`, error);
    
    // Check if we should retry or show error
    const currentBook = get().uploadingBooks.find(b => b.id === uploadId);
    if (currentBook && currentBook.status === 'processing') {
      // Connection lost but processing may still be ongoing
      // The EventSource will auto-reconnect, just update UI
      get().updateUpload(uploadId, {
        error: 'Connection lost. Reconnecting...'
      });
    }
  };
}
