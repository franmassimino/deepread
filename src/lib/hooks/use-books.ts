'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface BookFromAPI {
  id: string;
  title: string;
  author: string | null;
  status: 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
}

interface UseBooksReturn {
  books: BookFromAPI[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteBook: (bookId: string) => Promise<void>;
}

// In-memory cache with timestamp
let cachedBooks: BookFromAPI[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5000; // 5 seconds

export function useBooks(): UseBooksReturn {
  const [books, setBooks] = useState<BookFromAPI[]>(() => cachedBooks || []);
  const [isLoading, setIsLoading] = useState(() => !cachedBooks);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchBooks = useCallback(async (force = false) => {
    // Check cache first
    const now = Date.now();
    if (!force && cachedBooks && (now - cacheTimestamp < CACHE_DURATION)) {
      setBooks(cachedBooks);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/books', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const data = await response.json();

      // Update cache
      cachedBooks = data.books;
      cacheTimestamp = Date.now();
      setBooks(data.books);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchBooks();
    }
  }, [fetchBooks]);

  const deleteBook = useCallback(async (bookId: string) => {
    // Optimistic update - remove book immediately from UI
    const bookToDelete = books.find(b => b.id === bookId);
    const newBooks = books.filter(b => b.id !== bookId);
    setBooks(newBooks);

    // Update cache
    cachedBooks = newBooks;
    cacheTimestamp = Date.now();

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete book');
      }

      // Success - optimistic update already applied
    } catch (err) {
      // Revert optimistic update on error
      if (bookToDelete) {
        const revertedBooks = [...newBooks, bookToDelete].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setBooks(revertedBooks);
        cachedBooks = revertedBooks;
        cacheTimestamp = Date.now();
      }
      throw err; // Re-throw so caller can handle error
    }
  }, [books]);

  const refetch = useCallback(() => {
    fetchBooks(true); // Force fetch, bypass cache
  }, [fetchBooks]);

  return { books, isLoading, error, refetch, deleteBook };
}
