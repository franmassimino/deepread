"use client";

import { create } from 'zustand';

export interface Book {
  id: string;
  title: string;
  author?: string;
  progress: number;
  status: 'reading' | 'consolidating' | 'completed';
  lastActivity: string;
  coverColor: string;
}

interface BooksStore {
  books: Book[];
  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
}

export const useBooksStore = create<BooksStore>((set) => ({
  books: [],

  addBook: (book: Book) => {
    set((state) => ({
      books: [...state.books, book],
    }));
  },

  removeBook: (id: string) => {
    set((state) => ({
      books: state.books.filter((book) => book.id !== id),
    }));
  },
}));
