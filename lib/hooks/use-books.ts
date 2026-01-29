'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function useBooks(): UseBooksReturn {
  const [books, setBooks] = useState<BookFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/books');
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const data = await response.json();
      setBooks(data.books);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const deleteBook = useCallback(async (bookId: string) => {
    // Optimistic update - remove book immediately from UI
    const bookToDelete = books.find(b => b.id === bookId);
    setBooks(prevBooks => prevBooks.filter(b => b.id !== bookId));

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
        setBooks(prevBooks => [...prevBooks, bookToDelete].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      throw err; // Re-throw so caller can handle error
    }
  }, [books]);

  return { books, isLoading, error, refetch: fetchBooks, deleteBook };
}
