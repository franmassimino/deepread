"use client";

import { create } from 'zustand';
import { toast } from 'sonner';
import { useBooksStore } from './books-store';

export interface UploadingBook {
  id: string;
  fileName: string;
  progress: number;
  currentStep: number;
  file: File;
}

interface UploadStore {
  uploadingBooks: UploadingBook[];
  addUpload: (file: File) => void;
  updateUpload: (id: string, progress: number, currentStep: number) => void;
  removeUpload: (id: string) => void;
  startUpload: (file: File) => void;
}

const uploadSteps = [
  { label: "Uploading file...", duration: 1000 },
  { label: "Parsing PDF...", duration: 1500 },
  { label: "Extracting text...", duration: 1200 },
  { label: "Generating metadata...", duration: 1000 },
  { label: "Creating chapters...", duration: 800 },
  { label: "Finalizing...", duration: 500 },
];

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploadingBooks: [],

  addUpload: (file: File) => {
    const id = `${file.name}-${Date.now()}`;
    const newUpload: UploadingBook = {
      id,
      fileName: file.name,
      progress: 0,
      currentStep: 0,
      file,
    };

    set((state) => ({
      uploadingBooks: [...state.uploadingBooks, newUpload],
    }));

    return id;
  },

  updateUpload: (id: string, progress: number, currentStep: number) => {
    set((state) => ({
      uploadingBooks: state.uploadingBooks.map((book) =>
        book.id === id ? { ...book, progress, currentStep } : book
      ),
    }));
  },

  removeUpload: (id: string) => {
    set((state) => ({
      uploadingBooks: state.uploadingBooks.filter((book) => book.id !== id),
    }));
  },

  startUpload: async (file: File) => {
    const id = `${file.name}-${Date.now()}`;
    const newUpload: UploadingBook = {
      id,
      fileName: file.name,
      progress: 0,
      currentStep: 0,
      file,
    };

    // Add to store
    set((state) => ({
      uploadingBooks: [...state.uploadingBooks, newUpload],
    }));

    try {
      // Simulate upload process
      for (let i = 0; i < uploadSteps.length; i++) {
        const stepProgress = ((i + 1) / uploadSteps.length) * 100;
        const startProgress = (i / uploadSteps.length) * 100;
        const duration = uploadSteps[i].duration;
        const steps = 20;
        const increment = (stepProgress - startProgress) / steps;

        for (let j = 0; j <= steps; j++) {
          await new Promise((resolve) => setTimeout(resolve, duration / steps));
          get().updateUpload(id, startProgress + (increment * j), i);
        }
      }

      // Success! Add book to library
      get().removeUpload(id);

      // Generate a random color for the book cover
      const colors = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // Add the book to the books store
      const bookTitle = file.name.replace('.pdf', '');
      useBooksStore.getState().addBook({
        id: `book-${Date.now()}`,
        title: bookTitle,
        author: 'Unknown Author',
        progress: 0,
        status: 'reading',
        lastActivity: 'Just added',
        coverColor: randomColor,
      });

      toast.success(`"${bookTitle}" uploaded successfully!`, {
        description: 'Your book is now available in your library',
        duration: 4000,
      });

    } catch (error) {
      // Error handling
      get().removeUpload(id);
      toast.error(`Failed to upload "${file.name}"`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });
    }
  },
}));
