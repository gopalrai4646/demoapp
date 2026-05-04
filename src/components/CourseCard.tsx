import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { COLORS, ROUNDNESS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface CourseCardProps {
  title: string;
  count: string;
  image?: string;
  price?: number;
  onPress?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ title, count, image, price, onPress }) => {
  const isFree = price === 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {isFree && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={TYPOGRAPHY.label}>{count}</Text>
        <Text style={TYPOGRAPHY.cardTitle} numberOfLines={1}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDNESS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  imageContainer: {
    height: 140,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
  },
  content: {
    padding: SPACING.md,
  },
  freeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});
