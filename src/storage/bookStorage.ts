import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, ReadingGoal, UserSettings } from '../types/book';

// Base keys - will be prefixed with user ID
const BOOKS_KEY = '@bookshelf_books';
const GOALS_KEY = '@bookshelf_goals';
const SETTINGS_KEY = '@bookshelf_settings';

// Guest user ID for non-logged in users
const GUEST_USER_ID = 'guest';

export const defaultSettings: UserSettings = {
  libraryDueReminders: true,
  seriesReleaseReminders: true,
  readingReminders: false,
  reminderDaysBefore: 2,
  defaultView: 'grid',
  theme: 'system',
};

// Helper to get user-specific keys
const getUserKey = (baseKey: string, userId: string | null) => {
  const uid = userId || GUEST_USER_ID;
  return `${baseKey}_${uid}`;
};

// Create a storage instance for a specific user
export const createUserStorage = (userId: string | null) => {
  const booksKey = getUserKey(BOOKS_KEY, userId);
  const goalsKey = getUserKey(GOALS_KEY, userId);
  const settingsKey = getUserKey(SETTINGS_KEY, userId);

  return {
    async getBooks(): Promise<Book[]> {
      try {
        const data = await AsyncStorage.getItem(booksKey);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error loading books:', error);
        return [];
      }
    },

    async saveBooks(books: Book[]): Promise<void> {
      try {
        await AsyncStorage.setItem(booksKey, JSON.stringify(books));
      } catch (error) {
        console.error('Error saving books:', error);
      }
    },

    async addBook(book: Book): Promise<void> {
      const books = await this.getBooks();
      books.unshift(book);
      await this.saveBooks(books);
    },

    async updateBook(updatedBook: Book): Promise<void> {
      const books = await this.getBooks();
      const index = books.findIndex(b => b.id === updatedBook.id);
      if (index !== -1) {
        books[index] = updatedBook;
        await this.saveBooks(books);
      }
    },

    async deleteBook(bookId: string): Promise<void> {
      const books = await this.getBooks();
      const filtered = books.filter(b => b.id !== bookId);
      await this.saveBooks(filtered);
    },

    async getGoals(): Promise<ReadingGoal[]> {
      try {
        const data = await AsyncStorage.getItem(goalsKey);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error loading goals:', error);
        return [];
      }
    },

    async saveGoal(goal: ReadingGoal): Promise<void> {
      const goals = await this.getGoals();
      const index = goals.findIndex(g => g.year === goal.year);
      if (index !== -1) {
        goals[index] = goal;
      } else {
        goals.push(goal);
      }
      await AsyncStorage.setItem(goalsKey, JSON.stringify(goals));
    },

    async getSettings(): Promise<UserSettings> {
      try {
        const data = await AsyncStorage.getItem(settingsKey);
        return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
      } catch (error) {
        console.error('Error loading settings:', error);
        return defaultSettings;
      }
    },

    async saveSettings(settings: UserSettings): Promise<void> {
      try {
        await AsyncStorage.setItem(settingsKey, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    },

    async clearAll(): Promise<void> {
      try {
        await AsyncStorage.multiRemove([booksKey, goalsKey, settingsKey]);
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    },

    async exportData(): Promise<string> {
      const books = await this.getBooks();
      const goals = await this.getGoals();
      const settings = await this.getSettings();
      return JSON.stringify({ books, goals, settings }, null, 2);
    },

    async importData(jsonString: string): Promise<number> {
      try {
        const data = JSON.parse(jsonString);
        if (data.books && Array.isArray(data.books)) {
          await this.saveBooks(data.books);
          return data.books.length;
        }
        return 0;
      } catch (error) {
        console.error('Error importing data:', error);
        return 0;
      }
    },
  };
};

// Default storage for backward compatibility (guest user)
export const bookStorage = createUserStorage(null);
