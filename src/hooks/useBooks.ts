import { useState, useEffect, useCallback, useMemo } from 'react';
import { Book, ReadingGoal, UserSettings } from '../types/book';
import { createUserStorage, defaultSettings } from '../storage/bookStorage';
import { useAuth } from '../context/AuthContext';

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user-specific storage based on current user
  const storage = useMemo(() => {
    return createUserStorage(user?.uid || null);
  }, [user?.uid]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    const data = await storage.getBooks();
    setBooks(data);
    setLoading(false);
  }, [storage]);

  // Reload books when user changes
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const addBook = async (book: Book) => {
    await storage.addBook(book);
    setBooks(prev => [book, ...prev]);
  };

  const updateBook = async (book: Book) => {
    await storage.updateBook(book);
    setBooks(prev => prev.map(b => b.id === book.id ? book : b));
  };

  const deleteBook = async (bookId: string) => {
    await storage.deleteBook(bookId);
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  const getBooksByStatus = (status: Book['status']) => {
    return books.filter(b => b.status === status);
  };

  const getBooksBySource = (source: Book['source']) => {
    return books.filter(b => b.source === source);
  };

  const isBookInLibrary = (title: string, isbn?: string) => {
    return books.some(b => 
      b.title.toLowerCase() === title.toLowerCase() ||
      (isbn && b.isbn === isbn)
    );
  };

  return {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    refreshBooks: loadBooks,
    getBooksByStatus,
    getBooksBySource,
    isBookInLibrary,
  };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create user-specific storage based on current user
  const storage = useMemo(() => {
    return createUserStorage(user?.uid || null);
  }, [user?.uid]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await storage.getGoals();
      setGoals(data);
      setLoading(false);
    };
    load();
  }, [storage]);

  const saveGoal = async (goal: ReadingGoal) => {
    await storage.saveGoal(goal);
    setGoals(prev => {
      const index = prev.findIndex(g => g.year === goal.year);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = goal;
        return updated;
      }
      return [...prev, goal];
    });
  };

  const getCurrentYearGoal = () => {
    const year = new Date().getFullYear();
    return goals.find(g => g.year === year);
  };

  return { goals, loading, saveGoal, getCurrentYearGoal };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Create user-specific storage based on current user
  const storage = useMemo(() => {
    return createUserStorage(user?.uid || null);
  }, [user?.uid]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await storage.getSettings();
      setSettings(data);
      setLoading(false);
    };
    load();
  }, [storage]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    await storage.saveSettings(updated);
    setSettings(updated);
  };

  return { settings, loading, updateSettings };
}
