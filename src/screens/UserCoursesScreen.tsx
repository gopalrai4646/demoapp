import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const UserCoursesScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🎓</Text>
        <Text style={styles.heading}>Welcome to the Course!</Text>
        <Text style={styles.subtext}>
          We're preparing your personalized learning dashboard. Check back soon for your specialized modules and progress tracking.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: SPACING.lg,
  },
  heading: {
    ...TYPOGRAPHY.headline,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default UserCoursesScreen;
