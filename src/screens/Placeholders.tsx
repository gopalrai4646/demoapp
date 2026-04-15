import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={styles.container}>
    <Text style={TYPOGRAPHY.headline}>{name}</Text>
    <Text style={TYPOGRAPHY.subHeadline}>This feature is coming soon!</Text>
  </View>
);

export const CoursesScreen = () => <PlaceholderScreen name="Courses" />;
export const PlansScreen = () => <PlaceholderScreen name="Training Plans" />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
