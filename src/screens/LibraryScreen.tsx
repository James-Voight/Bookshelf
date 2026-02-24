import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Book, ReadingStatus, BookSource, STATUS_LABELS, SOURCE_LABELS } from '../types/book';
import { useBooks } from '../hooks/useBooks';
import { BookCard } from '../components/BookCard';

type SortOption = 'dateAdded' | 'title' | 'author' | 'progress';

export function LibraryScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { books, loading, refreshBooks } = useBooks();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus | null>(null);
  const [selectedSource, setSelectedSource] = useState<BookSource | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshBooks();
    }, [refreshBooks])
  );

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(query) ||
          b.authors.some(a => a.toLowerCase().includes(query))
      );
    }

    if (selectedStatus) {
      result = result.filter(b => b.status === selectedStatus);
    }

    if (selectedSource) {
      result = result.filter(b => b.source === selectedSource);
    }

    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        result.sort((a, b) => (a.authors[0] || '').localeCompare(b.authors[0] || ''));
        break;
      case 'progress':
        result.sort((a, b) => {
          const progA = a.pageCount ? a.currentPage / a.pageCount : 0;
          const progB = b.pageCount ? b.currentPage / b.pageCount : 0;
          return progB - progA;
        });
        break;
      default:
        result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    }

    return result;
  }, [books, searchQuery, selectedStatus, selectedSource, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBooks();
    setRefreshing(false);
  };

  const handleBookPress = (book: Book) => {
    navigation.navigate('BookDetail', { book });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color="#ccc" />
      <Text style={[styles.emptyTitle, isDark && styles.textDark]}>No Books Yet</Text>
      <Text style={styles.emptySubtitle}>
        Search for books or import your library to get started
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.emptyButtonText}>Search Books</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>My Library</Text>
      </View>

      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Search books..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterDropdown, isDark && styles.filterDropdownDark, selectedStatus && styles.filterDropdownActive]}
          onPress={() => setShowStatusPicker(true)}
        >
          <Text style={[styles.filterDropdownText, isDark && styles.textDark, selectedStatus && styles.filterDropdownTextActive]}>
            {selectedStatus ? STATUS_LABELS[selectedStatus] : 'Status'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={selectedStatus ? '#fff' : (isDark ? '#fff' : '#666')} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterDropdown, isDark && styles.filterDropdownDark, selectedSource && styles.filterDropdownActive]}
          onPress={() => setShowSourcePicker(true)}
        >
          <Text style={[styles.filterDropdownText, isDark && styles.textDark, selectedSource && styles.filterDropdownTextActive]}>
            {selectedSource ? SOURCE_LABELS[selectedSource] : 'Source'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={selectedSource ? '#fff' : (isDark ? '#fff' : '#666')} />
        </TouchableOpacity>
      </View>

      <Modal visible={showStatusPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowStatusPicker(false)}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <TouchableOpacity
              style={[styles.modalOption, !selectedStatus && styles.modalOptionSelected]}
              onPress={() => { setSelectedStatus(null); setShowStatusPicker(false); }}
            >
              <Text style={[styles.modalOptionText, isDark && styles.textDark]}>All Statuses</Text>
              {!selectedStatus && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
            {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.modalOption, selectedStatus === status && styles.modalOptionSelected]}
                onPress={() => { setSelectedStatus(status); setShowStatusPicker(false); }}
              >
                <Text style={[styles.modalOptionText, isDark && styles.textDark]}>{STATUS_LABELS[status]}</Text>
                {selectedStatus === status && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showSourcePicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSourcePicker(false)}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <TouchableOpacity
              style={[styles.modalOption, !selectedSource && styles.modalOptionSelected]}
              onPress={() => { setSelectedSource(null); setShowSourcePicker(false); }}
            >
              <Text style={[styles.modalOptionText, isDark && styles.textDark]}>All Sources</Text>
              {!selectedSource && <Ionicons name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
            {(Object.keys(SOURCE_LABELS) as BookSource[]).map(source => (
              <TouchableOpacity
                key={source}
                style={[styles.modalOption, selectedSource === source && styles.modalOptionSelected]}
                onPress={() => { setSelectedSource(source); setShowSourcePicker(false); }}
              >
                <Text style={[styles.modalOptionText, isDark && styles.textDark]}>{SOURCE_LABELS[source]}</Text>
                {selectedSource === source && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {filteredBooks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <BookCard book={item} variant="grid" onPress={() => handleBookPress(item)} />
          )}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
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
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterDropdownDark: {
    backgroundColor: '#2c2c2e',
  },
  filterDropdownActive: {
    backgroundColor: '#007AFF',
  },
  filterDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  filterDropdownTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#2c2c2e',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  gridContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  textDark: {
    color: '#fff',
  },
});
