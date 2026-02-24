export type BookSource = 'kindle' | 'physical' | 'library' | 'audible' | 'other';
export type ReadingStatus = 'reading' | 'completed' | 'wantToRead' | 'dnf';

export interface Book {
  id: string;
  title: string;
  authors: string[];
  coverURL?: string;
  isbn?: string;
  pageCount?: number;
  genres: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  
  source: BookSource;
  status: ReadingStatus;
  currentPage: number;
  rating?: number;
  
  dateAdded: string;
  dateStarted?: string;
  dateCompleted?: string;
  dueDate?: string;
  dueDateReminderEnabled: boolean;
  
  seriesName?: string;
  seriesPosition?: number;
  
  tags: string[];
  notes?: string;
}

export interface ReadingGoal {
  id: string;
  year: number;
  targetBooks: number;
  createdAt: string;
}

export interface UserSettings {
  libraryDueReminders: boolean;
  seriesReleaseReminders: boolean;
  readingReminders: boolean;
  reminderDaysBefore: number;
  defaultView: 'grid' | 'list';
  theme: 'system' | 'light' | 'dark';
}

export const SOURCE_LABELS: Record<BookSource, string> = {
  kindle: 'Kindle',
  physical: 'Physical',
  library: 'Library',
  audible: 'Audible',
  other: 'Other',
};

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  reading: 'Reading',
  completed: 'Completed',
  wantToRead: 'Want to Read',
  dnf: 'Did Not Finish',
};

export const SOURCE_ICONS: Record<BookSource, string> = {
  kindle: 'phone-portrait-outline',
  physical: 'book-outline',
  library: 'library-outline',
  audible: 'headset-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

export const STATUS_ICONS: Record<ReadingStatus, string> = {
  reading: 'book',
  completed: 'checkmark-circle',
  wantToRead: 'bookmark-outline',
  dnf: 'close-circle-outline',
};
