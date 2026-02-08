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

// Processing steps shown during PDF extraction
// Progress allocation: upload = 0-30%, processing = 30-100%
// Processing stages: text (50% -> 30-65%), tables (100% -> 65-100%)
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

          // Mark as processing and start real PDF extraction
          get().updateUpload(id, {
            status: 'processing',
            progress: UPLOAD_PROGRESS_MAX, // Upload complete = 30%
            currentStep: 1,
            bookId
          });

          // Trigger PDF processing and start polling
          triggerProcessing(id, bookId, file.name, get);

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
 * Triggers PDF processing and polls for status updates.
 * Replaces the simulated processing with real extraction.
 */
async function triggerProcessing(
  uploadId: string,
  bookId: string,
  fileName: string,
  get: () => UploadStore
) {
  const bookTitle = fileName.replace('.pdf', '');

  try {
    // Step 1: Trigger PDF processing
    console.log(`[Upload] Triggering processing for book: ${bookId}`);
    const triggerResponse = await fetch(`/api/process/${bookId}`, {
      method: 'POST',
    });

    if (!triggerResponse.ok) {
      throw new Error('Failed to trigger PDF processing');
    }

    // Step 2: Poll for status every 2 seconds
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 150; // 5 minutes max (150 * 2s)
    let attempts = 0;

    const pollStatus = async (): Promise<void> => {
      // Check if upload was cancelled
      const currentBook = get().uploadingBooks.find(b => b.id === uploadId);
      if (!currentBook || currentBook.status === 'cancelled') {
        return;
      }

      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Processing timeout');
      }

      // Fetch current status with error handling
      let statusResponse;
      try {
        statusResponse = await fetch(`/api/books/${bookId}/status`);
      } catch (fetchError) {
        console.warn(`[Upload] Network error polling status (attempt ${attempts}), retrying...`, fetchError);
        setTimeout(pollStatus, pollInterval);
        return;
      }
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text().catch(() => 'Unknown error');
        console.warn(`[Upload] Status fetch failed: ${statusResponse.status} - ${errorText}`);
        
        // If 404, maybe the book isn't created yet, keep polling
        if (statusResponse.status === 404) {
          setTimeout(pollStatus, pollInterval);
          return;
        }
        
        throw new Error(`Failed to fetch status: ${statusResponse.status}`);
      }

      let statusData;
      try {
        statusData = await statusResponse.json();
      } catch (parseError) {
        console.warn('[Upload] Failed to parse status response, retrying...', parseError);
        setTimeout(pollStatus, pollInterval);
        return;
      }
      const { status, error, metadata } = statusData;

      // Calculate progress: 30% (upload) + 70% * (status progress / 100)
      const processingProgress = statusData.progress || 0;
      const totalProgress = PROCESSING_PROGRESS_START + 
        (processingProgress / 100) * PROCESSING_PROGRESS_RANGE;

      // Update UI based on status
      if (status === 'READY') {
        // Processing complete
        get().updateUpload(uploadId, { 
          status: 'ready', 
          currentStep: processingSteps.length, 
          progress: 100 
        });

        // Add book to library with real metadata
        const colors = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        useBooksStore.getState().addBook({
          id: bookId,
          title: metadata.title || bookTitle,
          author: metadata.author || 'Unknown Author',
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

        // Process next queued upload
        get().processQueue();
        
      } else if (status === 'ERROR') {
        // Processing failed
        throw new Error(error || 'PDF processing failed');
        
      } else {
        // Still processing - update progress
        const currentStep = Math.min(
          Math.floor((processingProgress / 100) * processingSteps.length) + 1,
          processingSteps.length
        );
        
        get().updateUpload(uploadId, {
          currentStep,
          progress: Math.round(totalProgress)
        });

        // Poll again after interval
        setTimeout(pollStatus, pollInterval);
      }
    };

    // Start polling
    await pollStatus();

  } catch (error) {
    console.error('[Upload] Processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Processing failed';
    
    get().updateUpload(uploadId, {
      status: 'error',
      error: errorMessage
    });

    toast.error(`Failed to process "${fileName}"`, {
      description: errorMessage,
      duration: 5000,
    });

    // Process next queued upload
    get().processQueue();
  }
}
