import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterChipProps {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, icon, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={14}
          color={selected ? '#fff' : '#666'}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface FilterChipGroupProps {
  children: React.ReactNode;
}

export function FilterChipGroup({ children }: FilterChipGroupProps) {
  return (
    <View style={styles.group}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  labelSelected: {
    color: '#fff',
  },
  group: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
