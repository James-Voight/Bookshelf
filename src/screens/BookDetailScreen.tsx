import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Book, ReadingStatus, STATUS_LABELS, SOURCE_LABELS, BookSource } from '../types/book';
import { useBooks } from '../hooks/useBooks';
import { BookCover } from '../components/BookCover';

export function BookDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { updateBook, deleteBook } = useBooks();
  const [book, setBook] = useState<Book>(route.params.book);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressInput, setProgressInput] = useState(book.currentPage.toString());

  const handleStatusChange = (status: ReadingStatus) => {
    const updatedBook = { ...book, status };
    
    if (status === 'reading' && !book.dateStarted) {
      updatedBook.dateStarted = new Date().toISOString();
    } else if (status === 'completed') {
      updatedBook.dateCompleted = new Date().toISOString();
      if (book.pageCount) {
        updatedBook.currentPage = book.pageCount;
      }
    }
    
    setBook(updatedBook);
    updateBook(updatedBook);
  };

  const handleProgressUpdate = () => {
    const newPage = parseInt(progressInput) || 0;
    const updatedBook = { 
      ...book, 
      currentPage: Math.min(newPage, book.pageCount || newPage)
    };
    
    if (updatedBook.currentPage > 0 && book.status === 'wantToRead') {
      updatedBook.status = 'reading';
      if (!book.dateStarted) {
        updatedBook.dateStarted = new Date().toISOString();
      }
    }
    
    setBook(updatedBook);
    updateBook(updatedBook);
    setShowProgressInput(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Book?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBook(book.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const progress = book.pageCount ? book.currentPage / book.pageCount : 0;
  
  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.coverSection}>
        <BookCover coverURL={book.coverURL} size="large" />
        <Text style={[styles.title, isDark && styles.textDark]}>{book.title}</Text>
        <Text style={styles.author}>{book.authors.join(', ') || 'Unknown Author'}</Text>
        
        <View style={styles.metaRow}>
          {book.genres[0] && (
            <View style={styles.metaBadge}>
              <Ionicons name="pricetag-outline" size={12} color="#888" />
              <Text style={styles.metaText}>{book.genres[0]}</Text>
            </View>
          )}
          {book.pageCount && (
            <View style={styles.metaBadge}>
              <Ionicons name="document-text-outline" size={12} color="#888" />
              <Text style={styles.metaText}>{book.pageCount} pages</Text>
            </View>
          )}
          {book.publishedDate && (
            <View style={styles.metaBadge}>
              <Ionicons name="calendar-outline" size={12} color="#888" />
              <Text style={styles.metaText}>{book.publishedDate.substring(0, 4)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]}>Status</Text>
        <View style={styles.statusButtons}>
          {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                book.status === status && styles.statusButtonActive,
              ]}
              onPress={() => handleStatusChange(status)}
            >
              <Text style={[
                styles.statusButtonText,
                book.status === status && styles.statusButtonTextActive,
              ]}>
                {STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Progress</Text>
          <TouchableOpacity onPress={() => setShowProgressInput(true)}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>
        
        {book.pageCount ? (
          <View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Page {book.currentPage} of {book.pageCount} ({Math.round(progress * 100)}%)
            </Text>
          </View>
        ) : (
          <Text style={styles.progressText}>Page count unknown</Text>
        )}
        
        {showProgressInput && (
          <View style={styles.progressInputRow}>
            <TextInput
              style={[styles.progressInput, isDark && styles.inputDark]}
              value={progressInput}
              onChangeText={setProgressInput}
              keyboardType="number-pad"
              placeholder="Page number"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleProgressUpdate}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowProgressInput(false)}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]}>Details</Text>
        
        <DetailRow 
          icon="layers-outline" 
          label="Source" 
          value={SOURCE_LABELS[book.source]} 
          isDark={isDark}
        />
        <DetailRow 
          icon="add-circle-outline" 
          label="Added" 
          value={new Date(book.dateAdded).toLocaleDateString()} 
          isDark={isDark}
        />
        {book.dateStarted && (
          <DetailRow 
            icon="play-circle-outline" 
            label="Started" 
            value={new Date(book.dateStarted).toLocaleDateString()} 
            isDark={isDark}
          />
        )}
        {book.dateCompleted && (
          <DetailRow 
            icon="checkmark-circle-outline" 
            label="Completed" 
            value={new Date(book.dateCompleted).toLocaleDateString()} 
            isDark={isDark}
          />
        )}
        {book.isbn && (
          <DetailRow icon="barcode-outline" label="ISBN" value={book.isbn} isDark={isDark} />
        )}
        {book.publisher && (
          <DetailRow icon="business-outline" label="Publisher" value={book.publisher} isDark={isDark} />
        )}
      </View>

      {book.source === 'library' && (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Library Info</Text>
          
          {book.dueDate ? (
            <>
              <DetailRow 
                icon="calendar-outline" 
                label="Due Date" 
                value={new Date(book.dueDate).toLocaleDateString()}
                isDark={isDark}
              />
              {new Date(book.dueDate) < new Date() && book.status !== 'completed' && (
                <View style={styles.overdueBadge}>
                  <Ionicons name="warning" size={16} color="#FF3B30" />
                  <Text style={styles.overdueText}>This book is overdue!</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noDateText}>No due date set</Text>
          )}
        </View>
      )}

      {book.description && (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Description</Text>
          <Text style={[styles.description, isDark && styles.textMuted]}>
            {book.description}
          </Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, isDark }: any) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailRowLeft}>
        <Ionicons name={icon} size={18} color="#888" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, isDark && styles.textDark]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  coverSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    color: '#000',
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardDark: {
    backgroundColor: '#1c1c1e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  updateButton: {
    color: '#007AFF',
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
  },
  progressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  progressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  inputDark: {
    borderColor: '#333',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  overdueText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  noDateText: {
    color: '#888',
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  textDark: {
    color: '#fff',
  },
  textMuted: {
    color: '#aaa',
  },
});
