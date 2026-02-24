import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book, STATUS_LABELS, SOURCE_ICONS } from '../types/book';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  variant?: 'grid' | 'list';
}

export function BookCard({ book, onPress, variant = 'grid' }: BookCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const progress = book.pageCount ? book.currentPage / book.pageCount : 0;

  if (variant === 'list') {
    return (
      <TouchableOpacity 
        style={[styles.listContainer, isDark && styles.listContainerDark]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <BookCover coverURL={book.coverURL} size="small" />
        <View style={styles.listContent}>
          <Text style={[styles.listTitle, isDark && styles.textDark]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.listAuthor} numberOfLines={1}>
            {book.authors.join(', ') || 'Unknown Author'}
          </Text>
          <View style={styles.listMeta}>
            <Ionicons 
              name={SOURCE_ICONS[book.source] as any} 
              size={14} 
              color="#888" 
            />
            <Text style={styles.metaText}>{book.source}</Text>
            {book.pageCount && (
              <Text style={styles.metaText}>• {book.pageCount} pages</Text>
            )}
          </View>
          {book.status === 'reading' && book.pageCount ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          ) : (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{STATUS_LABELS[book.status]}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridContainer} onPress={onPress} activeOpacity={0.7}>
      <BookCover coverURL={book.coverURL} size="medium" />
      <Text style={[styles.gridTitle, isDark && styles.textDark]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.gridAuthor} numberOfLines={1}>
        {book.authors.join(', ') || 'Unknown'}
      </Text>
      {book.status === 'reading' && book.pageCount ? (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      ) : (
        <Text style={styles.gridStatus}>{STATUS_LABELS[book.status]}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: 110,
    marginRight: 12,
    marginBottom: 16,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    color: '#000',
  },
  gridAuthor: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  gridStatus: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  listContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listContainerDark: {
    backgroundColor: '#1c1c1e',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#007AFF',
  },
  textDark: {
    color: '#fff',
  },
});
