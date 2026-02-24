import { Book, BookSource } from '../types/book';

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems: number;
}

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export const googleBooksService = {
  async searchBooks(query: string): Promise<GoogleBookItem[]> {
    if (!query.trim()) return [];
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`${BASE_URL}?q=${encodedQuery}&maxResults=20`);
      
      if (!response.ok) {
        throw new Error('Network error');
      }
      
      const data: GoogleBooksResponse = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  async searchByISBN(isbn: string): Promise<GoogleBookItem | null> {
    const cleanISBN = isbn.replace(/-/g, '');
    
    try {
      const response = await fetch(`${BASE_URL}?q=isbn:${cleanISBN}`);
      
      if (!response.ok) {
        throw new Error('Network error');
      }
      
      const data: GoogleBooksResponse = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('ISBN search error:', error);
      throw error;
    }
  },

  convertToBook(item: GoogleBookItem, source: BookSource = 'physical'): Book {
    const info = item.volumeInfo;
    
    const isbn = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
      || info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    
    let coverURL = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
    if (coverURL) {
      coverURL = coverURL.replace('http://', 'https://');
    }
    
    return {
      id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: info.title,
      authors: info.authors || [],
      coverURL,
      isbn,
      pageCount: info.pageCount,
      genres: info.categories || [],
      description: info.description,
      publisher: info.publisher,
      publishedDate: info.publishedDate,
      source,
      status: 'wantToRead',
      currentPage: 0,
      dateAdded: new Date().toISOString(),
      dueDateReminderEnabled: false,
      tags: [],
    };
  },

  getSearchResultItem(item: GoogleBookItem) {
    const info = item.volumeInfo;
    let coverURL = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
    if (coverURL) {
      coverURL = coverURL.replace('http://', 'https://');
    }
    
    return {
      id: item.id,
      title: info.title,
      authors: info.authors || [],
      coverURL,
      publishedDate: info.publishedDate,
      pageCount: info.pageCount,
      categories: info.categories,
    };
  },
};

export type { GoogleBookItem };
