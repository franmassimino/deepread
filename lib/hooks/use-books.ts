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

  return { books, isLoading, error, refetch: fetchBooks };
}
