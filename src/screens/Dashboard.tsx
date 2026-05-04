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
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { StatCard } from '../components/StatCard';
import { CourseCard } from '../components/CourseCard';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '../store/slices/trainingPlanSlice';
import { fetchUsersRequest } from '../store/slices/userSlice';
import { enrollCourseRequest } from '../store/slices/authSlice';
import { RootState } from '../store';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserCourseStackParamList } from '../navigation/types';
import { TrendingUp, BarChart2, GraduationCap, ChevronRight, ChevronDown } from 'lucide-react-native';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<UserCourseStackParamList, 'UserCourses'>;

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, role } = useAppSelector((state: RootState) => state.auth);
  const { courses, loading } = useAppSelector((state: RootState) => state.courses);
  const { trainingPlans } = useAppSelector((state: RootState) => state.trainingPlans);
  const { users } = useAppSelector((state: RootState) => state.users);
  const { progress } = useAppSelector((state: RootState) => state.progress);
  
  const [activeChart, setActiveChart] = React.useState<'courses' | 'plans' | null>(null);

  useEffect(() => {
    dispatch(fetchCoursesRequest());
    dispatch(fetchTrainingPlansRequest());
    dispatch(fetchUsersRequest());
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

  const trendingData = useMemo(() => {
    const topCourses = [...courses]
      .sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0))
      .slice(0, 5)
      .map(c => ({ 
        label: c.title, 
        value: c.enrolledUsers?.length || 0,
        display: c.title.length > 12 ? c.title.substring(0, 10) + '..' : c.title
      }));

    const planCounts: Record<string, number> = {};
    trainingPlans.forEach(tp => { planCounts[tp.id] = 0; });
    users.forEach(u => {
      u.assignedTrainingPlans?.forEach(tpId => {
        if (planCounts[tpId] !== undefined) planCounts[tpId]++;
      });
    });

    const topPlans = [...trainingPlans]
      .sort((a, b) => (planCounts[b.id] || 0) - (planCounts[a.id] || 0))
      .slice(0, 5)
      .map(tp => ({ 
        label: tp.name, 
        value: planCounts[tp.id] || 0,
        display: tp.name.length > 12 ? tp.name.substring(0, 10) + '..' : tp.name
      }));

    return { topCourses, topPlans };
  }, [courses, trainingPlans, users]);

  const firstName = user?.displayName?.split(' ')[0] || 'User';
  const isAdmin = role === 'admin';

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

        {/* Platform Insights */}
        {!isAdmin && (
          <View style={styles.insightsSection}>
             <View style={styles.sectionHeader}>
              <View style={styles.headerIconTitle}>
                <TrendingUp size={20} color={COLORS.primary} />
                <Text style={[TYPOGRAPHY.cardTitle, { marginLeft: 8 }]}>Platform Insights</Text>
              </View>
            </View>

            <View style={styles.insightToggles}>
              <TouchableOpacity 
                style={[styles.insightCard, activeChart === 'courses' && styles.insightCardActive]}
                onPress={() => setActiveChart(activeChart === 'courses' ? null : 'courses')}
              >
                <View style={styles.insightIconWrapper}>
                  <BarChart2 size={18} color={activeChart === 'courses' ? '#fff' : COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, activeChart === 'courses' && { color: '#fff' }]}>Top 5 Courses</Text>
                  <Text style={[styles.insightSub, activeChart === 'courses' && { color: 'rgba(255,255,255,0.7)' }]}>Popular trends</Text>
                </View>
                {activeChart === 'courses' ? <ChevronDown size={18} color="#fff" /> : <ChevronRight size={18} color={COLORS.outline} />}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.insightCard, activeChart === 'plans' && styles.insightCardActive]}
                onPress={() => setActiveChart(activeChart === 'plans' ? null : 'plans')}
              >
                <View style={styles.insightIconWrapper}>
                  <GraduationCap size={18} color={activeChart === 'plans' ? '#fff' : COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, activeChart === 'plans' && { color: '#fff' }]}>Top 5 Plans</Text>
                  <Text style={[styles.insightSub, activeChart === 'plans' && { color: 'rgba(255,255,255,0.7)' }]}>Curated paths</Text>
                </View>
                {activeChart === 'plans' ? <ChevronDown size={18} color="#fff" /> : <ChevronRight size={18} color={COLORS.outline} />}
              </TouchableOpacity>
            </View>

            {activeChart && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{activeChart === 'courses' ? 'Course Popularity' : 'Training Plan Reach'}</Text>
                <View style={styles.barChartWrapper}>
                   <Svg height="160" width={SCREEN_WIDTH - 64}>
                    {(activeChart === 'courses' ? trendingData.topCourses : trendingData.topPlans).map((item, index) => {
                      const data = activeChart === 'courses' ? trendingData.topCourses : trendingData.topPlans;
                      const maxVal = Math.max(...data.map(d => d.value), 1);
                      const barWidth = ((SCREEN_WIDTH - 80) / data.length) - 10;
                      const barHeight = (item.value / maxVal) * 100;
                      const x = index * (barWidth + 10);
                      
                      return (
                        <G key={index}>
                          <Rect 
                            x={x} 
                            y={110 - barHeight} 
                            width={barWidth} 
                            height={barHeight} 
                            fill={COLORS.primary} 
                            rx={4} 
                          />
                          <SvgText
                            x={x + barWidth / 2}
                            y={125}
                            fontSize="8"
                            fill={COLORS.onSurfaceVariant}
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {item.display}
                          </SvgText>
                          <SvgText
                            x={x + barWidth / 2}
                            y={110 - barHeight - 5}
                            fontSize="9"
                            fill={COLORS.primary}
                            textAnchor="middle"
                            fontWeight="700"
                          >
                            {item.value}
                          </SvgText>
                        </G>
                      );
                    })}
                   </Svg>
                </View>
              </View>
            )}
          </View>
        )}

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
  insightsSection: {
    marginBottom: SPACING.xl,
  },
  headerIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightToggles: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: ROUNDNESS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightCardActive: {
    backgroundColor: COLORS.primary,
  },
  insightIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  insightSub: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: ROUNDNESS.xl,
    marginTop: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  barChartWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
});

export default Dashboard;
