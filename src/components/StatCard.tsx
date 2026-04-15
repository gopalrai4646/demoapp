import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, ROUNDNESS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string; // We'll skip real icons for now to avoid dependency issues
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <View style={styles.card}>
      <Text style={TYPOGRAPHY.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.lg,
    flex: 1,
    marginHorizontal: SPACING.xs,
    // Ambient Shadow spec from Lucid Learner
    shadowColor: COLORS.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  value: {
    ...TYPOGRAPHY.headline,
    fontSize: 20,
    marginTop: SPACING.xs,
  },
});
