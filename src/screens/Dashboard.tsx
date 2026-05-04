import React, { useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { StatCard } from '../components/StatCard';
import { CourseCard } from '../components/CourseCard';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { enrollCourseRequest } from '../store/slices/authSlice';
import { RootState } from '../store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserCourseStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<UserCourseStackParamList, 'UserCourses'>;

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, role } = useAppSelector((state: RootState) => state.auth);
  const { courses, loading } = useAppSelector((state: RootState) => state.courses);
  const { progress } = useAppSelector((state: RootState) => state.progress);
  
  const firstName = user?.displayName?.split(' ')[0] || 'User';
  const isAdmin = role === 'admin';

  useEffect(() => {
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  const stats = useMemo(() => {
    const enrolledIds = user?.enrolledCourses || [];
    const inProgress = enrolledIds.filter(id => {
      const p = progress[id];
      if (!p) return false;
      const watchedCount = Object.keys(p.watchedDurations || {}).length;
      const course = courses.find(c => c.id === id);
      const isCompleted = p.completedVideos?.length === (course?.videos?.length || 0);
      return watchedCount > 0 && !isCompleted;
    }).length;

    const completed = enrolledIds.filter(id => {
      const p = progress[id];
      const course = courses.find(c => c.id === id);
      if (!p || !course || !course.videos) return false;
      return p.completedVideos?.length === course.videos.length;
    }).length;

    return {
      enrolled: enrolledIds.length,
      inProgress,
      completed
    };
  }, [user?.enrolledCourses, progress, courses]);

  const discoverCourses = useMemo(() => {
    return courses
      .filter(c => !user?.enrolledCourses?.includes(c.id))
      .slice(0, 5);
  }, [courses, user?.enrolledCourses]);

  const handleEnroll = useCallback((course: any) => {
    const isFree = course.price === 0;
    
    Alert.alert(
      isFree ? 'Enroll for Free?' : 'Enroll in Course',
      isFree 
        ? `Would you like to enroll in "${course.title}" and start learning now?`
        : `This course costs ₹${course.price}. Proceed to enrollment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enroll Now', 
          onPress: () => {
            dispatch(enrollCourseRequest(course.id));
            // Small delay to allow Firestore to update (or just navigate, the screen will catch up)
            setTimeout(() => {
              navigation.navigate('CoursePlayer', { courseId: course.id });
            }, 500);
          } 
        }
      ]
    );
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={TYPOGRAPHY.headline}>Welcome back, {firstName}! 👋</Text>
          <Text style={TYPOGRAPHY.subHeadline}>
            {isAdmin 
              ? "Here's an overview of your platform's activity."
              : "Here's what's happening with your learning today."}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Enrolled" value={stats.enrolled.toString()} />
          <StatCard label="In Progress" value={stats.inProgress.toString()} />
          <StatCard label="Completed" value={stats.completed.toString()} />
        </View>

        {/* Discover Section */}
        {!isAdmin && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={TYPOGRAPHY.cardTitle}>Discover Courses</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loading && courses.length === 0 ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : discoverCourses.length > 0 ? (
              discoverCourses.map(course => (
                <CourseCard 
                  key={course.id}
                  title={course.title}
                  count={`${course.videos?.length || 0} lessons`}
                  image={course.thumbnail}
                  price={course.price}
                  onPress={() => handleEnroll(course)}
                />
              ))
            ) : (
              <View style={styles.emptyDiscover}>
                <Text style={TYPOGRAPHY.body}>No new courses to discover right now.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
  },
  welcomeSection: {
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
  emptyDiscover: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: ROUNDNESS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
});

export default Dashboard;
