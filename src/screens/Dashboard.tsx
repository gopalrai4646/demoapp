import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { StatCard } from '../components/StatCard';
import { CourseCard } from '../components/CourseCard';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image } from 'react-native';

const Dashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: RootState) => state.auth);
  const firstName = user?.displayName?.split(' ')[0] || 'User';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={TYPOGRAPHY.headline}>Welcome back, {firstName}! 👋</Text>
            <Text style={TYPOGRAPHY.subHeadline}>
              Here's what's happening with your learning today.
            </Text>
          </View>
          <View style={styles.profileContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder} />
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Courses in Progress" value="4" />
          <StatCard label="Saved Courses" value="2" />
          <StatCard label="Learning Hours" value="12" />
        </View>

        {/* Discover Section */}
        <View style={styles.sectionHeader}>
          <Text style={TYPOGRAPHY.cardTitle}>Discover Courses</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <CourseCard title="Python coding basics" count="4 video" />
        <CourseCard title="Advanced UI patterns" count="6 video" />
        <CourseCard title="Data structures 101" count="3 video" />
      </ScrollView>

      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  profileContainer: {
    width: 48,
    height: 48,
    borderRadius: ROUNDNESS.full,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    marginHorizontal: -SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAll: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '600',
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    alignItems: 'center',
  },
  activePill: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginBottom: 4,
  },
  navText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
  },
  navTextActive: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default Dashboard;
