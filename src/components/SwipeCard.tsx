import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { RecommendedBook } from '../types/recommendation';

const MAX_MOBILE_WIDTH = 430;

interface SwipeCardProps {
  book: RecommendedBook;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isFirst: boolean;
}

export function SwipeCard({ book, onSwipeLeft, onSwipeRight, isFirst }: SwipeCardProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, MAX_MOBILE_WIDTH) : windowWidth;
  const containerHeight = Platform.OS === 'web' ? Math.min(windowHeight, 932) : windowHeight;
  const cardWidth = containerWidth - 40;
  const cardHeight = containerHeight * 0.72;
  const swipeThreshold = containerWidth * 0.3;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!isFirst) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
    })
    .onEnd((event) => {
      if (!isFirst) return;
      if (translateX.value > swipeThreshold) {
        translateX.value = withTiming(containerWidth * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
      } else if (translateX.value < -swipeThreshold) {
        translateX.value = withTiming(-containerWidth * 1.5, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-containerWidth / 2, 0, containerWidth / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ] as const,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, swipeThreshold], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const renderBackground = () => {
    if (book.coverURL) {
      return (
        <ImageBackground
          source={{ uri: book.coverURL }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            locations={[0.3, 0.6, 1]}
            style={styles.gradient}
          />
        </ImageBackground>
      );
    }
    return <View style={styles.placeholderBackground} />;
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, { width: cardWidth, height: cardHeight }, animatedStyle]}>
        {renderBackground()}
        
        <Animated.View style={[styles.likeLabel, likeOpacityStyle]}>
          <Text style={styles.likeLabelText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.nopeLabel, nopeOpacityStyle]}>
          <Text style={styles.nopeLabelText}>NOPE</Text>
        </Animated.View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {book.authors.join(', ') || 'Unknown Author'}
          </Text>

          <TouchableOpacity
            style={styles.synopsisToggle}
            onPress={() => setSynopsisExpanded(!synopsisExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.synopsisLabel}>Synopsis</Text>
            <Ionicons
              name={synopsisExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>

          {synopsisExpanded && (
            <ScrollView style={styles.synopsisContainer} nestedScrollEnabled>
              <Text style={styles.synopsis}>
                {book.synopsis}
              </Text>
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

interface ActionButtonsProps {
  onReject: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export function ActionButtons({ onReject, onLike, disabled }: ActionButtonsProps) {
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.rejectButton]}
        onPress={onReject}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={36} color="#FF3B30" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.likeButton]}
        onPress={onLike}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={32} color="#34C759" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2c2c2e',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  author: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 6,
  },
  synopsisToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  synopsisLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  synopsisContainer: {
    maxHeight: 120,
    marginTop: 10,
  },
  synopsis: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },
  likeLabel: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#34C759',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    transform: [{ rotate: '-20deg' }],
  },
  likeLabelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  nopeLabel: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    transform: [{ rotate: '20deg' }],
  },
  nopeLabelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  likeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#34C759',
  },
});
