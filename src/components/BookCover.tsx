import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BookCoverProps {
  coverURL?: string;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: { width: 60, height: 90 },
  medium: { width: 100, height: 150 },
  large: { width: 150, height: 225 },
};

export function BookCover({ coverURL, size = 'medium' }: BookCoverProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const dimensions = SIZES[size];

  if (!coverURL || error) {
    return (
      <View style={[styles.placeholder, dimensions]}>
        <Ionicons name="book-outline" size={dimensions.width * 0.4} color="#999" />
      </View>
    );
  }

  return (
    <View style={[styles.container, dimensions]}>
      {loading && (
        <View style={[styles.loadingContainer, dimensions]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      <Image
        source={{ uri: coverURL }}
        style={[styles.image, dimensions]}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    borderRadius: 8,
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    zIndex: 1,
  },
});
