import React, { useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING, ROUNDNESS } from '../constants/Theme';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '../store/slices/trainingPlanSlice';
import { fetchUsersRequest } from '../store/slices/userSlice';
import { saveCourseRequest, enrollCourseRequest } from '../store/slices/authSlice';
import { RootState } from '../store';
import { BookOpen, Search, GraduationCap } from 'lucide-react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList, UserCourseStackParamList } from '../navigation/types';
import Svg, { Circle as SvgCircle, Defs, LinearGradient, Stop, Rect, Text as SvgText, G } from 'react-native-svg';
import { ArrowRight, Heart, Video, Play, Clock } from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';
import {
  selectEnrolledCoursesWithProgress,
  selectDashboardStats,
  selectWeeklyActivity,
  selectLearningTime,
  selectContinueLearning,
  selectAssignedPlans,
  selectSavedCourses
} from '../store/selectors';

const { width } = Dimensions.get('window');

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<UserCourseStackParamList>
>;

const ProgressRing = ({ percentage, size = 48, strokeWidth = 4, color = '#6366f1', bgColor = 'rgba(255,255,255,0.2)' }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg height={size} width={size}>
        <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={bgColor} strokeWidth={strokeWidth} fill="none" />
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { courses } = useAppSelector((state: RootState) => state.courses);

  useEffect(() => {
    dispatch(fetchCoursesRequest());
    dispatch(fetchTrainingPlansRequest());
    dispatch(fetchUsersRequest());
  }, [dispatch]);

  const enrolledCourses = useAppSelector(selectEnrolledCoursesWithProgress);
  const stats = useAppSelector(selectDashboardStats);
  const continueLearning = useAppSelector(selectContinueLearning);
  const assignedPlans = useAppSelector(selectAssignedPlans);
  const weeklyData = useAppSelector(selectWeeklyActivity);
  const learningTime = useAppSelector(selectLearningTime);
  const savedCoursesList = useAppSelector(selectSavedCourses);

  const discoverCourses = useMemo(() => {
    return courses.filter(c => !user?.enrolledCourses?.includes(c.id) && c.visibility !== 'private');
  }, [courses, user?.enrolledCourses]);

  const isNewUser = !user?.enrolledCourses || user.enrolledCourses.length === 0;
  const greeting = isNewUser ? 'Hello' : 'Welcome back';


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AppHeader />

        {/* 1. Hero Banner */}
        <View style={styles.heroContainer}>
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#5b65df" />
                <Stop offset="1" stopColor="#8138b8" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGrad)" rx="32" />
          </Svg>
          <View style={styles.heroContent}>
            <Text style={styles.heroDate}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.heroTitle}>{greeting},{'\n'}{user?.displayName?.split(' ')[0] || 'Learner'}!</Text>

            <Text style={styles.heroSub}>Here's what's happening with{'\n'}your learning today.</Text>
          </View>
        </View>

        {/* 2. Completion Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Completion Overview</Text>
          <Text style={styles.cardSub}>Your overall course completion rate</Text>

          <View style={styles.donutContainer}>
            <Svg height="180" width="180" viewBox="0 0 100 100">
              <SvgCircle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
              <SvgCircle
                cx="50" cy="50" r="40"
                stroke="#7c3aed" strokeWidth="10"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (stats.completionRate / 100) * 251.2}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <View style={styles.donutLabelContainer}>
                <Text style={styles.donutPercent}>{stats.completionRate}%</Text>
                <Text style={styles.donutText}>Completion Rate</Text>
                <Text style={styles.donutFraction}>{stats.completed} of {stats.enrolled}</Text>
              </View>
            </Svg>
          </View>

          <View style={styles.legendContainer}>
            <View style={[styles.legendPill, { backgroundColor: '#ecfdf5' }]}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <Text style={[styles.legendValue, { color: '#10b981' }]}>{stats.completed}</Text>
            </View>
            <View style={[styles.legendPill, { backgroundColor: '#eff6ff' }]}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>In Progress</Text>
              </View>
              <Text style={[styles.legendValue, { color: '#f59e0b' }]}>{stats.inProgress}</Text>
            </View>
            <View style={[styles.legendPill, { backgroundColor: '#f5f3ff' }]}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
                <Text style={styles.legendText}>Courses Enrolled</Text>
              </View>
              <Text style={[styles.legendValue, { color: '#6366f1' }]}>{stats.enrolled}</Text>
            </View>
            <View style={[styles.legendPill, { backgroundColor: '#f8fafc' }]}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: '#cbd5e1' }]} />
                <Text style={styles.legendText}>Not Started</Text>
              </View>
              <Text style={[styles.legendValue, { color: '#64748b' }]}>{stats.notStarted}</Text>
            </View>
          </View>
        </View>

        {/* 3. Weekly Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Activity</Text>
          <Text style={styles.cardSub}>Videos watched per day this week</Text>

          <View style={styles.barChartContainer}>
            <Svg height="160" width="100%">
              {weeklyData.map((d, i) => {
                const barWidth = 24;
                const spacing = (width - 80 - (7 * barWidth)) / 6;
                const x = i * (barWidth + spacing);
                const maxVal = 15; // Set higher than 13
                const height = d.value > 0 ? (d.value / maxVal) * 120 : 0;
                const y = 130 - height;

                return (
                  <G key={i}>
                    {height > 0 && (
                      <Rect x={x} y={y} width={barWidth} height={height} rx={6} fill="#9f7aea" />
                    )}
                    {d.value > 0 && (
                      <SvgText x={x + barWidth / 2} y={y + 12} fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {d.value}
                      </SvgText>
                    )}
                    <SvgText x={x + barWidth / 2} y={150} fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">
                      {d.label}
                    </SvgText>
                  </G>
                )
              })}
            </Svg>
          </View>
        </View>

        {/* 4. Continue Learning */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <Text style={styles.sectionSub}>pick up where you left off</Text>
          </View>
        </View>

        {continueLearning.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.hScroll, { paddingLeft: 16 }]}>
            {continueLearning.map(course => (
              <TouchableOpacity key={course.id} style={[styles.continueCard, { width: width * 0.75, marginHorizontal: 8 }]} onPress={() => navigation.navigate('Courses', { screen: 'CoursePlayer', params: { courseId: course.id } })}>
                <View style={styles.continueCardInner}>
                  <View style={styles.continueIconPlaceholder}>
                    <BookOpen size={22} color="#94a3b8" />
                  </View>
                  <View style={styles.continueInfo}>
                    <Text style={styles.continueTitle} numberOfLines={1}>{course.title}</Text>
                    <Text style={styles.continueInstructor}>{course.instructor}</Text>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${course.progressPercent}%` }]} />
                    </View>
                  </View>
                  <View style={styles.continueRingWrapper}>
                    <ProgressRing percentage={course.progressPercent} size={44} strokeWidth={4} color="#4f46e5" bgColor="#e0e7ff" />
                    <View style={styles.ringLabelAbsolute}>
                      <Text style={styles.ringLabelText}>{course.progressPercent}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>Start a course to see your progress here.</Text>
          </View>
        )}

        {/* 5. Assigned Training Plans */}
        <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 }]}>
          <Text style={styles.sectionTitle}>Assigned Training Plans</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Plans')}>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>
        {assignedPlans.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {assignedPlans.slice(0, 4).map(plan => (
              <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => navigation.navigate('Plans')}>
                <View style={styles.planImageContainer}>
                  <Image source={{ uri: plan.image }} style={styles.planImage} />
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{plan.courseIds?.length || 0} Courses</Text>
                  </View>
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle} numberOfLines={1}>{plan.name}</Text>
                  <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
                  <View style={styles.viewPlanRow}>
                    <Text style={styles.viewPlanText}>View Plan</Text>
                    <ArrowRight size={16} color="#4f46e5" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.emptyStateCard, { marginHorizontal: 16 }]}>
            <Text style={styles.emptyStateText}>No training plans assigned yet.</Text>
          </View>
        )}

        {/* 6. My Courses */}
        <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>My Courses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses', { screen: 'UserCourses' })}>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>
        {enrolledCourses.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {enrolledCourses.slice(0, 4).map((course: any) => (
              <View key={course.id} style={styles.myCourseCard}>
                <View style={styles.myCourseHeader}>
                  <View style={styles.videoBadge}>
                    <Video size={14} color="#fff" />
                    <Text style={styles.videoBadgeText}>{course.videos?.length || 0} videos</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => dispatch(saveCourseRequest(course.id))}
                    style={styles.heartBtn}
                  >
                    <Heart size={20} color={savedCoursesList.some((c: any) => c.id === course.id) ? "#f43f5e" : "#94a3b8"} fill={savedCoursesList.some((c: any) => c.id === course.id) ? "#f43f5e" : "transparent"} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Courses', { screen: 'CoursePlayer', params: { courseId: course.id } })}
                >
                  <View style={styles.myCourseThumbnail}>
                    <Image source={{ uri: course.thumbnail }} style={styles.myCourseImage} />
                  </View>

                  <View style={styles.myCourseInfo}>
                    <View style={styles.myCourseTitleRow}>
                      <Text style={styles.myCourseTitle} numberOfLines={1}>{course.title} <Text style={styles.myCourseInstructor}>• {course.instructor}</Text></Text>
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>{course.price === 0 ? 'FREE' : 'PAID'}</Text>
                      </View>
                    </View>

                    <View style={styles.myCourseProgressRow}>
                      <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
                      <Text style={styles.progressPercent}>{course.progressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarTrackFull}>
                      <View style={[styles.progressBarFillFull, { width: `${course.progressPercent}%` }]} />
                    </View>

                    <View style={styles.viewCourseBtn}>
                      <Play size={16} color="#fff" fill="#fff" />
                      <Text style={styles.viewCourseBtnText}>View Course</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.emptyStateCard, { marginHorizontal: 16 }]}>
            <Text style={styles.emptyStateText}>You haven't enrolled in any courses yet.</Text>
          </View>
        )}

        {/* 7. Discover Courses */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Discover Courses</Text>
        </View>
        {discoverCourses.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {discoverCourses.map((course: any) => (
              <View key={course.id} style={styles.myCourseCard}>
                <View style={styles.myCourseHeader}>
                  <View style={styles.videoBadge}>
                    <Video size={14} color="#fff" />
                    <Text style={styles.videoBadgeText}>{course.videos?.length || 0} videos</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => dispatch(saveCourseRequest(course.id))}
                    style={styles.heartBtn}
                  >
                    <Heart size={20} color={savedCoursesList.some((c: any) => c.id === course.id) ? "#f43f5e" : "#94a3b8"} fill={savedCoursesList.some((c: any) => c.id === course.id) ? "#f43f5e" : "transparent"} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Courses', { screen: 'CoursePlayer', params: { courseId: course.id } })}
                >
                  <View style={styles.myCourseThumbnail}>
                    <Image source={{ uri: course.thumbnail }} style={styles.myCourseImage} />
                  </View>
                  <View style={styles.myCourseInfo}>
                    <View style={styles.myCourseTitleRow}>
                      <Text style={styles.myCourseTitle} numberOfLines={1}>{course.title}</Text>
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>{course.price === 0 ? 'FREE' : `$${course.price}`}</Text>
                      </View>
                    </View>
                    <Text style={[styles.continueInstructor, { marginTop: 4, marginBottom: 16 }]}>{course.instructor}</Text>

                    <TouchableOpacity
                      style={[styles.viewCourseBtn, { backgroundColor: '#4f46e5' }]}
                      onPress={() => dispatch(enrollCourseRequest(course.id))}
                    >
                      <GraduationCap size={18} color="#fff" />
                      <Text style={styles.viewCourseBtnText}>Enroll Now</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.emptyStateCard, { marginHorizontal: 16 }]}>
            <Text style={styles.emptyStateText}>No new courses available to discover.</Text>
          </View>
        )}

        {/* 8. Saved Courses */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Saved Courses</Text>
        </View>
        {savedCoursesList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {savedCoursesList.map((course: any) => {
              const isEnrolled = user?.enrolledCourses?.includes(course.id);

              return (
                <View key={course.id} style={styles.myCourseCard}>
                  <View style={styles.myCourseHeader}>
                    <View style={styles.videoBadge}>
                      <Video size={14} color="#fff" />
                      <Text style={styles.videoBadgeText}>{course.videos?.length || 0} videos</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => dispatch(saveCourseRequest(course.id))}
                      style={styles.heartBtn}
                    >
                      <Heart size={20} color="#f43f5e" fill="#f43f5e" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Courses', { screen: 'CoursePlayer', params: { courseId: course.id } })}
                  >
                    <View style={styles.myCourseThumbnail}>
                      <Image source={{ uri: course.thumbnail }} style={styles.myCourseImage} />
                    </View>

                    <View style={styles.myCourseInfo}>
                      <View style={styles.myCourseTitleRow}>
                        <Text style={styles.myCourseTitle} numberOfLines={1}>{course.title} <Text style={styles.myCourseInstructor}>• {course.instructor}</Text></Text>
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>{course.price === 0 ? 'FREE' : `$${course.price}`}</Text>
                        </View>
                      </View>

                      {isEnrolled ? (
                        <>
                          <View style={styles.myCourseProgressRow}>
                            <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
                            <Text style={styles.progressPercent}>{course.progressPercent}%</Text>
                          </View>
                          <View style={styles.progressBarTrackFull}>
                            <View style={[styles.progressBarFillFull, { width: `${course.progressPercent}%` }]} />
                          </View>

                          <View style={styles.viewCourseBtn}>
                            <Play size={16} color="#fff" fill="#fff" />
                            <Text style={styles.viewCourseBtnText}>View Course</Text>
                          </View>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={[styles.viewCourseBtn, { backgroundColor: '#4f46e5', marginTop: 12 }]}
                          onPress={() => dispatch(enrollCourseRequest(course.id))}
                        >
                          <GraduationCap size={18} color="#fff" />
                          <Text style={styles.viewCourseBtnText}>Enroll Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={[styles.emptyStateCard, { marginHorizontal: 16 }]}>
            <Heart size={24} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>No saved courses yet. Tap the heart icon to save courses.</Text>
          </View>
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
  content: {
    paddingBottom: 40,
  },
  heroContainer: {
    margin: 16,
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: 150,
  },
  heroContent: {
    padding: 24,
    flex: 1,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  heroStatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroCard: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCardLeft: {
    marginRight: 16,
  },
  heroCardMid: {
    flex: 1,
  },
  heroCardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroCardSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  donutContainer: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  donutLabelContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutPercent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
  },
  donutText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  donutFraction: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  legendContainer: {
    gap: 8,
  },
  legendPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  barChartContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
  },
  continueCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  continueCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueIconPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  continueInfo: {
    flex: 1,
    marginRight: 16,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  continueInstructor: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  continueRingWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLabelAbsolute: {
    position: 'absolute',
  },
  ringLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  hScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  planCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  planImageContainer: {
    height: 140,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  planImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
  },
  planInfo: {
    padding: 16,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  viewPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPlanText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  myCourseCard: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  myCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  myCourseThumbnail: {
    height: 140,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  myCourseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  myCourseInfo: {
    flex: 1,
  },
  myCourseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  myCourseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  myCourseInstructor: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  freeBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '800',
  },
  myCourseProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
  },
  progressBarTrackFull: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFillFull: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 2,
  },
  viewCourseBtn: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  viewCourseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Dashboard;
