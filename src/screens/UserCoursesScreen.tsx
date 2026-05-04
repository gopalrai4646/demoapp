import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { Search, BookOpen, CheckCircle2, RotateCw, PauseCircle } from 'lucide-react-native';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserCourseStackParamList } from '../navigation/types';

type TabFilter = 'all' | 'in-progress' | 'completed';
type NavigationProp = NativeStackNavigationProp<UserCourseStackParamList, 'UserCourses'>;

const UserCoursesScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  const { progress } = useAppSelector((state) => state.progress);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  // Progress Calculation Logic
  const getCourseProgress = (course: any) => {
    const p = progress[course.id];
    if (!p || !course.videos?.length) return 0;
    
    let totalDuration = 0;
    let totalWatched = 0;

    course.videos.forEach((video: any, index: number) => {
      const vidId = `video_${index}`;
      const duration = video.duration || 0;
      const watched = p.watchedDurations?.[vidId] || 0;
      const isCompleted = p.completedVideos?.includes(vidId);

      if (duration > 0) {
        totalDuration += duration;
        totalWatched += isCompleted ? duration : Math.min(watched, duration);
      } else {
        totalDuration += 100;
        totalWatched += isCompleted ? 100 : 0;
      }
    });

    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.round((totalWatched / totalDuration) * 100));
  };

  const filteredCourses = useMemo(() => {
    // 1. Get enrolled courses
    let filtered = courses.filter(c => user?.enrolledCourses?.includes(c.id));
    
    // 2. Tab filter
    if (activeTab === 'in-progress') {
      filtered = filtered.filter(c => {
        const p = getCourseProgress(c);
        return p > 0 && p < 100;
      });
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(c => getCourseProgress(c) >= 100);
    }

    // 3. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.instructor.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [courses, user?.enrolledCourses, activeTab, searchQuery, progress]);

  // Stat counts for badges
  const enrolledCoursesList = courses.filter(c => user?.enrolledCourses?.includes(c.id));
  const counts = {
    all: enrolledCoursesList.length,
    inProgress: enrolledCoursesList.filter(c => { const p = getCourseProgress(c); return p > 0 && p < 100; }).length,
    completed: enrolledCoursesList.filter(c => getCourseProgress(c) >= 100).length,
  };

  const renderCourseCard = ({ item }: { item: any }) => {
    const pct = getCourseProgress(item);
    const isCompleted = pct >= 100;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('CoursePlayer', { courseId: item.id })}
      >
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <BookOpen size={48} color={COLORS.outlineVariant} />
            </View>
          )}
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isCompleted ? '#e8f5e9' : '#ffffff' }
          ]}>
            {isCompleted ? (
              <View style={styles.badgeRow}>
                <CheckCircle2 size={12} color="#4caf50" />
                <Text style={[styles.statusText, { color: '#4caf50' }]}>COMPLETED</Text>
              </View>
            ) : (
              <Text style={[styles.statusText, { color: COLORS.primary }]}>IN PROGRESS</Text>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.instructorName}>Instructor: {item.instructor}</Text>

          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, isCompleted && { color: '#4caf50' }]}>
              {isCompleted ? 'Final Grade: A+' : 'Progress'}
            </Text>
            <Text style={[styles.progressValue, { color: isCompleted ? '#4caf50' : COLORS.primary }]}>
              {pct}%
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[
              styles.progressBarFill, 
              { width: `${pct}%`, backgroundColor: isCompleted ? '#4caf50' : COLORS.primary }
            ]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>My Courses</Text>
        <Text style={styles.subtitle}>Track your learning progress</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.outline}
        />
      </View>

      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'in-progress', label: 'In Progress', count: counts.inProgress },
            { id: 'completed', label: 'Completed', count: counts.completed },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabPill,
                activeTab === tab.id && styles.activeTabPill
              ]}
              onPress={() => setActiveTab(tab.id as TabFilter)}
            >
              <Text style={[
                styles.tabLabel,
                activeTab === tab.id && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.countBadge,
                activeTab === tab.id ? styles.activeCountBadge : styles.inactiveCountBadge
              ]}>
                <Text style={[
                  styles.countText,
                  activeTab === tab.id && styles.activeCountText
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={64} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all' 
                ? "You haven't enrolled in any courses yet." 
                : `You don't have any courses marked as ${activeTab}.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.subHeadline,
    color: COLORS.secondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: ROUNDNESS.xl,
    height: 48,
    marginBottom: SPACING.lg,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    paddingVertical: 0,
  },
  tabWrapper: {
    marginBottom: SPACING.lg,
  },
  tabsContainer: {
    paddingHorizontal: SPACING.lg,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: ROUNDNESS.full,
    marginRight: SPACING.sm,
  },
  activeTabPill: {
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  activeTabLabel: {
    color: COLORS.onPrimary,
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inactiveCountBadge: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  activeCountText: {
    color: COLORS.onPrimary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  cardContent: {
    padding: 24,
  },
  courseTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 4,
  },
  instructorName: {
    ...TYPOGRAPHY.subHeadline,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '700',
  },
  progressValue: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    ...TYPOGRAPHY.headline,
    marginTop: SPACING.md,
    color: COLORS.onSurface,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: SPACING.xl,
  },
});

export default UserCoursesScreen;
