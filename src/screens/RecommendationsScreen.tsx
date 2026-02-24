import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../hooks/useBooks';
import { RecommendedBook } from '../types/recommendation';
import { fetchRecommendations } from '../services/recommendations';
import { getSwipedBookIds, saveSwipedBook } from '../storage/recommendationStorage';
import { SwipeCard, ActionButtons } from '../components/SwipeCard';
import { Book } from '../types/book';

export function RecommendationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation<any>();
  const { user, hasFeature } = useAuth();
  const { books, addBook } = useBooks();

  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadRecommendations = useCallback(async (forceReload = false) => {
    if (!user) return;
    if (hasLoaded && !forceReload) return;

    setLoading(true);
    setError(null);

    try {
      const swipedIds = await getSwipedBookIds(user.uid);
      const recs = await fetchRecommendations(books, swipedIds);
      setRecommendations(recs);
      setCurrentIndex(0);
      setHasLoaded(true);
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, books, hasLoaded]);

  useEffect(() => {
    if (hasFeature('ai') && !hasLoaded) {
      loadRecommendations();
    } else if (!hasFeature('ai')) {
      setLoading(false);
    }
  }, [hasFeature]);

  const handleSwipeLeft = useCallback(async () => {
    if (!user || currentIndex >= recommendations.length) return;

    const book = recommendations[currentIndex];
    await saveSwipedBook(user.uid, {
      id: book.id,
      title: book.title,
      liked: false,
      swipedAt: new Date().toISOString(),
    });
    setCurrentIndex(prev => prev + 1);
  }, [user, currentIndex, recommendations]);

  const handleSwipeRight = useCallback(async () => {
    if (!user || currentIndex >= recommendations.length) return;

    const book = recommendations[currentIndex];

    // Save as liked
    await saveSwipedBook(user.uid, {
      id: book.id,
      title: book.title,
      liked: true,
      swipedAt: new Date().toISOString(),
    });

    // Add to "Want to Read" list
    const newBook: Book = {
      id: `rec_${book.id}_${Date.now()}`,
      title: book.title,
      authors: book.authors,
      coverURL: book.coverURL,
      genres: book.genres || [],
      description: book.synopsis,
      source: 'other',
      status: 'wantToRead',
      currentPage: 0,
      dateAdded: new Date().toISOString(),
      tags: ['recommended'],
      dueDateReminderEnabled: false,
    };
    await addBook(newBook);

    setCurrentIndex(prev => prev + 1);
  }, [user, currentIndex, recommendations, addBook]);

  // Show upgrade prompt for non-subscribers
  if (!hasFeature('ai')) {
    return (
      <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
        <View style={styles.upgradeContainer}>
          <Ionicons name="sparkles" size={64} color="#007AFF" />
          <Text style={[styles.upgradeTitle, isDark && styles.textDark]}>
            AI Recommendations
          </Text>
          <Text style={styles.upgradeText}>
            Get personalized book recommendations based on your reading history.
            Upgrade to Bookworm to unlock this feature.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          Finding books you'll love...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, isDark && styles.textDark]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasMoreCards = currentIndex < recommendations.length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textDark]}>Discover</Text>
          <TouchableOpacity onPress={() => loadRecommendations(true)} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardsContainer}>
          {hasMoreCards ? (
            recommendations
              .slice(currentIndex, currentIndex + 3)
              .reverse()
              .map((book, index, arr) => (
                <SwipeCard
                  key={book.id}
                  book={book}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  isFirst={index === arr.length - 1}
                />
              ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#34C759" />
              <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                All caught up!
              </Text>
              <Text style={styles.emptyText}>
                You've seen all recommendations. Check back later for more!
              </Text>
              <TouchableOpacity style={styles.refreshButtonLarge} onPress={() => loadRecommendations(true)}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshButtonLargeText}>Get New Recommendations</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasMoreCards && (
          <ActionButtons
            onReject={handleSwipeLeft}
            onLike={handleSwipeRight}
            disabled={!hasMoreCards}
          />
        )}
      </View>
    </GestureHandlerRootView>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshButton: {
    padding: 8,
  },
  textDark: {
    color: '#fff',
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  refreshButtonLargeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  upgradeContainer: {
    alignItems: 'center',
    padding: 32,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#000',
  },
  upgradeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  upgradeButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
