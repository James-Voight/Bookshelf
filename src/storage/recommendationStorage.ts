import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwipedBook } from '../types/recommendation';

const SWIPED_BOOKS_KEY = '@bookshelf_swiped_books';

export async function getSwipedBooks(userId: string): Promise<SwipedBook[]> {
  try {
    const key = `${SWIPED_BOOKS_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting swiped books:', error);
    return [];
  }
}

export async function saveSwipedBook(userId: string, book: SwipedBook): Promise<void> {
  try {
    const key = `${SWIPED_BOOKS_KEY}_${userId}`;
    const existing = await getSwipedBooks(userId);
    const updated = [...existing.filter(b => b.id !== book.id), book];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving swiped book:', error);
  }
}

export async function getSwipedBookIds(userId: string): Promise<Set<string>> {
  const books = await getSwipedBooks(userId);
  return new Set(books.map(b => b.id));
}

export async function getLikedBooks(userId: string): Promise<SwipedBook[]> {
  const books = await getSwipedBooks(userId);
  return books.filter(b => b.liked);
}

export async function clearSwipedBooks(userId: string): Promise<void> {
  try {
    const key = `${SWIPED_BOOKS_KEY}_${userId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing swiped books:', error);
  }
}
