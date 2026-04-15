import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { COLORS, ROUNDNESS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface CourseCardProps {
  title: string;
  count: string;
  image?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({ title, count }) => {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <Text style={TYPOGRAPHY.label}>{count}</Text>
        <Text style={TYPOGRAPHY.cardTitle}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDNESS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 5,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: COLORS.primaryContainer,
  },
  content: {
    padding: SPACING.md,
  },
});
