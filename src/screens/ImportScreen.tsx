import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useBooks } from '../hooks/useBooks';
import { googleBooksService } from '../services/googleBooks';
import { Book } from '../types/book';

interface ImportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

const IMPORT_OPTIONS: ImportOption[] = [
  {
    id: 'kindle',
    title: 'Import from Kindle',
    subtitle: 'Export your Amazon library data',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'libby',
    title: 'Import from Libby',
    subtitle: 'Export your library borrowing history',
    icon: 'library-outline',
  },
  {
    id: 'csv',
    title: 'Import CSV/JSON',
    subtitle: 'Goodreads export or custom format',
    icon: 'document-text-outline',
  },
];

export function ImportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addBook } = useBooks();
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleOptionPress = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'text/plain'],
      });

      if (result.canceled) return;

      setImporting(true);
      const file = result.assets[0];
      
      const response = await fetch(file.uri);
      const content = await response.text();
      
      let books: Array<{ title: string; author: string }> = [];
      
      if (file.name?.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          books = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          Alert.alert('Error', 'Invalid JSON file');
          return;
        }
      } else if (file.name?.endsWith('.csv')) {
        const lines = content.split('\n');
        books = lines.slice(1).filter(line => line.trim()).map(line => {
          const parts = line.split(',');
          return {
            title: parts[0]?.replace(/"/g, '').trim() || '',
            author: parts[1]?.replace(/"/g, '').trim() || '',
          };
        });
      }

      let imported = 0;
      for (const bookData of books) {
        if (!bookData.title) continue;
        
        try {
          const results = await googleBooksService.searchBooks(
            `${bookData.title} ${bookData.author || ''}`
          );
          
          if (results.length > 0) {
            const book = googleBooksService.convertToBook(
              results[0], 
              selectedOption === 'kindle' ? 'kindle' : 
              selectedOption === 'libby' ? 'library' : 'physical'
            );
            await addBook(book);
          } else {
            const book: Book = {
              id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: bookData.title,
              authors: bookData.author ? [bookData.author] : [],
              source: selectedOption === 'kindle' ? 'kindle' : 
                      selectedOption === 'libby' ? 'library' : 'physical',
              status: 'wantToRead',
              currentPage: 0,
              dateAdded: new Date().toISOString(),
              dueDateReminderEnabled: false,
              genres: [],
              tags: [],
            };
            await addBook(book);
          }
          imported++;
        } catch (err) {
          console.error('Error importing book:', bookData.title);
        }
      }

      Alert.alert('Import Complete', `Successfully imported ${imported} books`);
      setSelectedOption(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const renderKindleInstructions = () => (
    <View style={[styles.instructionsCard, isDark && styles.cardDark]}>
      <Text style={[styles.instructionsTitle, isDark && styles.textDark]}>
        How to export your Kindle library:
      </Text>
      
      <InstructionStep number={1} text="Go to Amazon Privacy Center" isDark={isDark} />
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => Linking.openURL('https://www.amazon.com/hz/privacy-central/data-requests/preview.html')}
      >
        <Text style={styles.linkButtonText}>Open Amazon Privacy</Text>
        <Ionicons name="open-outline" size={16} color="#fff" />
      </TouchableOpacity>
      
      <InstructionStep number={2} text='Click "Request Your Data"' isDark={isDark} />
      <InstructionStep number={3} text='Select "Kindle" and submit the request' isDark={isDark} />
      <InstructionStep number={4} text="Wait for email (usually 1-2 days)" isDark={isDark} />
      <InstructionStep number={5} text="Download the ZIP file from the email" isDark={isDark} />
      <InstructionStep number={6} text="Come back here and upload the file" isDark={isDark} />
      
      <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile} disabled={importing}>
        <Ionicons name="folder-outline" size={20} color="#fff" />
        <Text style={styles.uploadButtonText}>
          {importing ? 'Importing...' : 'Select Export File'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLibbyInstructions = () => (
    <View style={[styles.instructionsCard, isDark && styles.cardDark]}>
      <Text style={[styles.instructionsTitle, isDark && styles.textDark]}>
        How to export from Libby:
      </Text>
      
      <InstructionStep number={1} text="Open the Libby app on your device" isDark={isDark} />
      <InstructionStep number={2} text="Go to Shelf → Activity" isDark={isDark} />
      <InstructionStep number={3} text="Tap the export/share button" isDark={isDark} />
      <InstructionStep number={4} text='Choose "Export to CSV"' isDark={isDark} />
      <InstructionStep number={5} text="Save the file and upload here" isDark={isDark} />
      
      <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile} disabled={importing}>
        <Ionicons name="folder-outline" size={20} color="#fff" />
        <Text style={styles.uploadButtonText}>
          {importing ? 'Importing...' : 'Select Export File'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCSVInstructions = () => (
    <View style={[styles.instructionsCard, isDark && styles.cardDark]}>
      <Text style={[styles.instructionsTitle, isDark && styles.textDark]}>
        Import from CSV or JSON
      </Text>
      
      <Text style={[styles.supportedFormats, isDark && styles.textDark]}>
        Supported formats:
      </Text>
      <Text style={styles.formatItem}>• Goodreads export (CSV)</Text>
      <Text style={styles.formatItem}>• Custom CSV with columns: Title, Author</Text>
      <Text style={styles.formatItem}>• JSON array with title and author fields</Text>
      
      <View style={styles.divider} />
      
      <Text style={[styles.instructionsTitle, isDark && styles.textDark]}>
        Goodreads Export Instructions:
      </Text>
      
      <InstructionStep number={1} text="Go to goodreads.com/review/import" isDark={isDark} />
      <InstructionStep number={2} text='Click "Export Library"' isDark={isDark} />
      <InstructionStep number={3} text="Download the CSV file" isDark={isDark} />
      <InstructionStep number={4} text="Upload the file here" isDark={isDark} />
      
      <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile} disabled={importing}>
        <Ionicons name="folder-outline" size={20} color="#fff" />
        <Text style={styles.uploadButtonText}>
          {importing ? 'Importing...' : 'Select File'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Import</Text>
      </View>

      {!selectedOption ? (
        <View style={styles.optionsList}>
          {IMPORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isDark && styles.cardDark]}
              onPress={() => handleOptionPress(option.id)}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon as any} size={28} color="#007AFF" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, isDark && styles.textDark]}>
                  {option.title}
                </Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.instructionsContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedOption(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          {selectedOption === 'kindle' && renderKindleInstructions()}
          {selectedOption === 'libby' && renderLibbyInstructions()}
          {selectedOption === 'csv' && renderCSVInstructions()}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function InstructionStep({ number, text, isDark }: { number: number; text: string; isDark: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={[styles.stepText, isDark && styles.textDark]}>{text}</Text>
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
  optionsList: {
    padding: 16,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  cardDark: {
    backgroundColor: '#1c1c1e',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  instructionsContainer: {
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 4,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    gap: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  supportedFormats: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  formatItem: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  textDark: {
    color: '#fff',
  },
});
