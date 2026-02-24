import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { googleBooksService, GoogleBookItem } from '../services/googleBooks';
import { useBooks } from '../hooks/useBooks';
import { BookCover } from '../components/BookCover';
import { Book, BookSource, ReadingStatus } from '../types/book';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { addBook, isBookInLibrary } = useBooks();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<GoogleBookItem | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const items = await googleBooksService.searchBooks(query);
      setResults(items);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner', {
      onScan: async (isbn: string) => {
        setQuery(isbn);
        setLoading(true);
        try {
          const result = await googleBooksService.searchByISBN(isbn);
          if (result) {
            setResults([result]);
            setSelectedBook(result);
          } else {
            setError('No book found for this ISBN');
          }
        } catch (err) {
          setError('Search failed');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAddBook = (item: GoogleBookItem, source: BookSource, status: ReadingStatus) => {
    const book = googleBooksService.convertToBook(item, source);
    book.status = status;
    
    if (status === 'reading') {
      book.dateStarted = new Date().toISOString();
    } else if (status === 'completed') {
      book.dateStarted = new Date().toISOString();
      book.dateCompleted = new Date().toISOString();
      if (book.pageCount) {
        book.currentPage = book.pageCount;
      }
    }
    
    addBook(book);
    Alert.alert('Added!', `"${book.title}" has been added to your library.`);
    setSelectedBook(null);
  };

  const showAddOptions = (item: GoogleBookItem) => {
    const info = item.volumeInfo;
    const inLibrary = isBookInLibrary(info.title, info.industryIdentifiers?.[0]?.identifier);
    
    if (inLibrary) {
      Alert.alert('Already Added', 'This book is already in your library.');
      return;
    }
    
    setSelectedBook(item);
  };

  const renderSearchResult = ({ item }: { item: GoogleBookItem }) => {
    const info = item.volumeInfo;
    const inLibrary = isBookInLibrary(info.title, info.industryIdentifiers?.[0]?.identifier);
    let coverURL = info.imageLinks?.thumbnail?.replace('http://', 'https://');
    
    return (
      <TouchableOpacity
        style={[styles.resultItem, isDark && styles.resultItemDark]}
        onPress={() => showAddOptions(item)}
      >
        <BookCover coverURL={coverURL} size="small" />
        <View style={styles.resultInfo}>
          <Text style={[styles.resultTitle, isDark && styles.textDark]} numberOfLines={2}>
            {info.title}
          </Text>
          <Text style={styles.resultAuthor} numberOfLines={1}>
            {info.authors?.join(', ') || 'Unknown Author'}
          </Text>
          <View style={styles.resultMeta}>
            {info.publishedDate && (
              <Text style={styles.metaText}>{info.publishedDate.substring(0, 4)}</Text>
            )}
            {info.pageCount && (
              <Text style={styles.metaText}>• {info.pageCount} pages</Text>
            )}
          </View>
          {info.categories?.[0] && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{info.categories[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.addButtonContainer}>
          {inLibrary ? (
            <Ionicons name="checkmark-circle" size={28} color="#34C759" />
          ) : (
            <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddModal = () => {
    if (!selectedBook) return null;
    const info = selectedBook.volumeInfo;
    let coverURL = info.imageLinks?.thumbnail?.replace('http://', 'https://');
    
    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedBook(null)}>
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          
          <BookCover coverURL={coverURL} size="medium" />
          <Text style={[styles.modalTitle, isDark && styles.textDark]} numberOfLines={2}>
            {info.title}
          </Text>
          <Text style={styles.modalAuthor}>
            {info.authors?.join(', ') || 'Unknown Author'}
          </Text>
          
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Source</Text>
          <View style={styles.optionRow}>
            {(['physical', 'kindle', 'library', 'audible'] as BookSource[]).map(source => (
              <TouchableOpacity
                key={source}
                style={styles.sourceButton}
                onPress={() => handleAddBook(selectedBook, source, 'wantToRead')}
              >
                <Ionicons
                  name={
                    source === 'physical' ? 'book-outline' :
                    source === 'kindle' ? 'phone-portrait-outline' :
                    source === 'library' ? 'library-outline' : 'headset-outline'
                  }
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.sourceLabel}>{source}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Quick Add As</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleAddBook(selectedBook, 'physical', 'wantToRead')}
            >
              <Text style={styles.statusButtonText}>Want to Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#FF9500' }]}
              onPress={() => handleAddBook(selectedBook, 'physical', 'reading')}
            >
              <Text style={styles.statusButtonText}>Reading</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#34C759' }]}
              onPress={() => handleAddBook(selectedBook, 'physical', 'completed')}
            >
              <Text style={styles.statusButtonText}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Search</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={[styles.searchInput, isDark && styles.textDark]}
            placeholder="Search by title, author, or ISBN..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode}>
          <Ionicons name="barcode-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, isDark && styles.textDark]}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Search for Books</Text>
          <Text style={styles.emptySubtitle}>
            Search by title, author, or scan an ISBN barcode
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderSearchResult}
          contentContainerStyle={styles.resultsList}
        />
      )}

      {selectedBook && renderAddModal()}
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchContainerDark: {
    backgroundColor: '#1c1c1e',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  scanButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#000',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#000',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  resultItemDark: {
    backgroundColor: '#1c1c1e',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  resultAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
  },
  addButtonContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalContentDark: {
    backgroundColor: '#1c1c1e',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    color: '#000',
  },
  modalAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 12,
    color: '#000',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  sourceButton: {
    alignItems: 'center',
    padding: 12,
  },
  sourceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  textDark: {
    color: '#fff',
  },
});
