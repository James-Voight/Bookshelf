import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBooks, useGoals } from '../hooks/useBooks';
import { useAuth } from '../context/AuthContext';
import { Book, SOURCE_LABELS } from '../types/book';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function InsightsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation<any>();
  const { hasFeature } = useAuth();
  
  const { books } = useBooks();
  const { goals, getCurrentYearGoal, saveGoal } = useGoals();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const stats = useMemo(() => {
    const completedThisYear = books.filter(b => {
      if (!b.dateCompleted) return false;
      return new Date(b.dateCompleted).getFullYear() === selectedYear;
    });

    const totalPages = completedThisYear.reduce((sum, b) => sum + (b.pageCount || 0), 0);
    const currentlyReading = books.filter(b => b.status === 'reading').length;

    const monthCounts = Array(12).fill(0);
    completedThisYear.forEach(b => {
      if (b.dateCompleted) {
        const month = new Date(b.dateCompleted).getMonth();
        monthCounts[month]++;
      }
    });

    const genreCounts: Record<string, number> = {};
    completedThisYear.forEach(b => {
      const genre = b.genres[0] || 'Unknown';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const sourceCounts: Record<string, number> = {};
    completedThisYear.forEach(b => {
      sourceCounts[b.source] = (sourceCounts[b.source] || 0) + 1;
    });

    const seriesProgress: Record<string, { read: number; total: number }> = {};
    books.forEach(b => {
      if (b.seriesName) {
        if (!seriesProgress[b.seriesName]) {
          seriesProgress[b.seriesName] = { read: 0, total: 0 };
        }
        seriesProgress[b.seriesName].total++;
        if (b.status === 'completed') {
          seriesProgress[b.seriesName].read++;
        }
      }
    });

    return {
      booksRead: completedThisYear.length,
      totalPages,
      currentlyReading,
      monthCounts,
      topGenres,
      sourceCounts,
      seriesProgress: Object.entries(seriesProgress).filter(([_, v]) => v.total > 1),
    };
  }, [books, selectedYear]);

  const currentGoal = getCurrentYearGoal();
  const goalProgress = currentGoal ? stats.booksRead / currentGoal.targetBooks : 0;

  const maxMonthCount = Math.max(...stats.monthCounts, 1);
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  const handleSetGoal = () => {
    const goal = {
      id: `goal_${currentYear}`,
      year: currentYear,
      targetBooks: 12,
      createdAt: new Date().toISOString(),
    };
    saveGoal(goal);
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Insights</Text>
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
            <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.yearText, isDark && styles.textDark]}>{selectedYear}</Text>
          <TouchableOpacity 
            onPress={() => setSelectedYear(y => Math.min(y + 1, currentYear))}
            disabled={selectedYear >= currentYear}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={selectedYear >= currentYear ? '#888' : (isDark ? '#fff' : '#000')} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.discoverCard, isDark && styles.cardDark]}
        onPress={() => navigation.navigate('Recommendations')}
        activeOpacity={0.7}
      >
        <View style={styles.discoverIcon}>
          <Ionicons name="sparkles" size={28} color="#fff" />
        </View>
        <View style={styles.discoverContent}>
          <Text style={[styles.discoverTitle, isDark && styles.textDark]}>
            Discover New Books
          </Text>
          <Text style={styles.discoverSubtitle}>
            {hasFeature('ai') 
              ? 'Get AI-powered recommendations based on your library' 
              : 'Upgrade to Bookworm to unlock AI recommendations'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#888" />
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <StatCard
          icon="book"
          value={stats.booksRead}
          label="Books Read"
          color="#007AFF"
          isDark={isDark}
        />
        <StatCard
          icon="document-text"
          value={stats.totalPages > 999 ? `${(stats.totalPages / 1000).toFixed(1)}K` : stats.totalPages}
          label="Pages"
          color="#34C759"
          isDark={isDark}
        />
        <StatCard
          icon="book-outline"
          value={stats.currentlyReading}
          label="Reading"
          color="#FF9500"
          isDark={isDark}
        />
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Reading Goal</Text>
          {!currentGoal && (
            <TouchableOpacity onPress={handleSetGoal}>
              <Text style={styles.setGoalText}>Set Goal</Text>
            </TouchableOpacity>
          )}
        </View>
        {currentGoal ? (
          <>
            <View style={styles.goalProgress}>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min(goalProgress * 100, 100)}%` },
                    goalProgress >= 1 && styles.progressBarComplete
                  ]} 
                />
              </View>
              <Text style={styles.goalText}>
                {stats.booksRead} / {currentGoal.targetBooks}
              </Text>
            </View>
            {goalProgress >= 1 && (
              <View style={styles.achievedBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.achievedText}>Goal Achieved!</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noGoalText}>Set a goal to track your progress</Text>
        )}
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]}>Books by Month</Text>
        <View style={styles.chart}>
          {stats.monthCounts.map((count, index) => (
            <View key={index} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { height: Math.max((count / maxMonthCount) * 80, 4) }
                ]} 
              />
              <Text style={styles.barLabel}>{months[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]}>Top Genres</Text>
        {stats.topGenres.length > 0 ? (
          stats.topGenres.map(([genre, count], index) => (
            <View key={genre} style={styles.genreRow}>
              <View style={[styles.genreDot, { backgroundColor: GENRE_COLORS[index] }]} />
              <Text style={[styles.genreName, isDark && styles.textDark]}>{genre}</Text>
              <Text style={styles.genreCount}>{count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No completed books yet</Text>
        )}
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <Text style={[styles.cardTitle, isDark && styles.textDark]}>By Format</Text>
        {Object.entries(stats.sourceCounts).length > 0 ? (
          Object.entries(stats.sourceCounts).map(([source, count]) => (
            <View key={source} style={styles.sourceRow}>
              <Ionicons 
                name={
                  source === 'kindle' ? 'phone-portrait-outline' :
                  source === 'physical' ? 'book-outline' :
                  source === 'library' ? 'library-outline' : 'headset-outline'
                } 
                size={20} 
                color="#888" 
              />
              <Text style={[styles.sourceName, isDark && styles.textDark]}>
                {SOURCE_LABELS[source as keyof typeof SOURCE_LABELS]}
              </Text>
              <Text style={styles.sourceCount}>{count} books</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No completed books yet</Text>
        )}
      </View>

      <View style={[styles.card, isDark && styles.cardDark]}>
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={32} color="#FF9500" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Currently Reading</Text>
            <Text style={[styles.streakValue, isDark && styles.textDark]}>
              {stats.currentlyReading} books
            </Text>
          </View>
        </View>
      </View>

      {stats.seriesProgress.length > 0 && (
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Series Progress</Text>
          {stats.seriesProgress.map(([name, { read, total }]) => (
            <View key={name} style={styles.seriesRow}>
              <View style={styles.seriesInfo}>
                <Text style={[styles.seriesName, isDark && styles.textDark]}>{name}</Text>
                <Text style={styles.seriesCount}>{read}/{total}</Text>
              </View>
              <View style={styles.seriesBar}>
                <View 
                  style={[
                    styles.seriesBarFill, 
                    { width: `${(read / total) * 100}%` },
                    read === total && styles.seriesBarComplete
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const GENRE_COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

function StatCard({ icon, value, label, color, isDark }: any) {
  return (
    <View style={[styles.statCard, isDark && styles.statCardDark]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, isDark && styles.textDark]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  discoverIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discoverContent: {
    flex: 1,
    marginLeft: 12,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  discoverSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardDark: {
    backgroundColor: '#1c1c1e',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
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
  setGoalText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: '#34C759',
  },
  goalText: {
    fontSize: 14,
    color: '#888',
    width: 50,
    textAlign: 'right',
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  achievedText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  noGoalText: {
    color: '#888',
    fontSize: 14,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 16,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  genreDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  genreName: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  genreCount: {
    fontSize: 14,
    color: '#888',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  sourceName: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  sourceCount: {
    fontSize: 14,
    color: '#888',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 12,
    color: '#888',
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  seriesRow: {
    marginBottom: 12,
  },
  seriesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  seriesName: {
    fontSize: 14,
    color: '#000',
  },
  seriesCount: {
    fontSize: 12,
    color: '#888',
  },
  seriesBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  seriesBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  seriesBarComplete: {
    backgroundColor: '#34C759',
  },
  textDark: {
    color: '#fff',
  },
});
