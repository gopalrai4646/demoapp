import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchUsersRequest } from '../store/slices/userSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { COLORS, SPACING } from '../constants/Theme';
import { AppHeader } from '../components/AppHeader';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  AlertTriangle,
  Hourglass,
} from 'lucide-react-native';
import Svg, { Rect, Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

const TeacherDashboardScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { courses } = useAppSelector(state => state.courses);
  const { user } = useAppSelector(state => state.auth);
  const { t } = useTranslation();

  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    dispatch(fetchCoursesRequest());

    const fetchGlobalProgress = async () => {
      try {
        const querySnapshot = await firestore().collection('userProgress').get();
        const progressDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProgress(progressDocs);
      } catch (error) {
        console.error("Error fetching global progress:", error);
      } finally {
        setLoadingProgress(false);
      }
    };
    
    fetchGlobalProgress();
  }, [dispatch]);

  const myCourses = useMemo(() => courses.filter(c => c.createdBy === user?.uid), [courses, user?.uid]);

  const stats = useMemo(() => {
    const totalCourses = myCourses.length;

    const uniqueStudents = new Set<string>();
    myCourses.forEach(course => {
      if (Array.isArray(course.enrolledUsers)) {
        course.enrolledUsers.forEach(userId => uniqueStudents.add(userId));
      }
    });
    const totalStudents = uniqueStudents.size;

    const totalRevenue = myCourses.reduce((acc, course) => {
      const enrollments = course.enrolledUsers?.length || 0;
      return acc + ((course.price || 0) * enrollments);
    }, 0);

    return { totalCourses, totalStudents, totalRevenue };
  }, [myCourses]);

  const reportStats = useMemo(() => {
    const totalLearners = stats.totalStudents;
    
    // Popularity Heatmap
    const sortedCoursesPop = [...myCourses].sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0));
    const popularity = sortedCoursesPop.slice(0, 4).map(c => {
       const enrolled = c.enrolledUsers?.length || 0;
       const percent = totalLearners > 0 ? Math.min(100, Math.round((enrolled / totalLearners) * 100)) : 0;
       return { id: c.id, title: c.title, percent };
    });

    // Attention Needed (Ratings below 3.5)
    const courseRatings: Record<string, { sum: number; count: number; title: string }> = {};
    myCourses.forEach(c => { courseRatings[c.id] = { sum: 0, count: 0, title: c.title }; });
    
    allProgress.forEach(p => {
      if (p.isRated && p.rating && courseRatings[p.courseId]) {
        courseRatings[p.courseId].sum += p.rating;
        courseRatings[p.courseId].count++;
      }
    });
    
    const attentionNeeded = Object.keys(courseRatings)
      .map(id => {
         const { sum, count, title } = courseRatings[id];
         const avg = count > 0 ? sum / count : 5;
         return { id, title, avg, reviews: count };
      })
      .filter(c => c.avg > 0 && c.avg < 3.5)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 10);

    // Stalled Learners (Inactive for 7+ days)
    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    const myCourseIds = new Set(myCourses.map(c => c.id));
    const myProgress = allProgress.filter(p => myCourseIds.has(p.courseId));
    
    let stalledCount = 0;
    let activeCount = 0;

    myProgress.forEach(p => {
      if (p.percentComplete > 0 && p.percentComplete < 100) {
        if (p.lastUpdated) {
          const lastUpdateDate = new Date(p.lastUpdated).getTime();
          if (now - lastUpdateDate >= SEVEN_DAYS_MS) {
            stalledCount++;
          } else {
            activeCount++;
          }
        } else {
          stalledCount++;
        }
      }
    });
    
    const totalAssigned = stalledCount + activeCount;
    const stalledPercent = totalAssigned > 0 ? Math.round((stalledCount / totalAssigned) * 100) : 0;

    return { popularity, attentionNeeded, stalledStats: { percent: stalledPercent, stalled: stalledCount, active: activeCount } };
  }, [myCourses, stats.totalStudents, allProgress]);

  const renderMiniChart = (color: string) => (
    <View style={styles.miniChartContainer}>
      <Svg height="20" width="60">
        <Rect x="0" y="8" width="8" height="12" fill={color} rx="2" />
        <Rect x="12" y="4" width="8" height="16" fill={color} rx="2" opacity="0.6" />
        <Rect x="24" y="10" width="8" height="10" fill={color} rx="2" opacity="0.4" />
        <Rect x="36" y="2" width="8" height="18" fill={color} rx="2" opacity="0.8" />
        <Rect x="48" y="6" width="8" height="14" fill={color} rx="2" opacity="0.5" />
      </Svg>
    </View>
  );

  const AnalyticsCard = ({ title, value, subtext, icon: Icon, color, bg, miniChart, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.card, !onPress && { width: '100%' }]} 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.cardLabel}>{title}</Text>
      <Text style={styles.cardValue} numberOfLines={2} ellipsizeMode="tail">{value}</Text>
      {miniChart && renderMiniChart(color)}
      <Text style={styles.cardSubtext}>{subtext}</Text>
    </TouchableOpacity>
  );

  const renderPopularity = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{t('adminDashboard.popularity') || 'Popularity Heatmap'}</Text>
      {reportStats.popularity.length === 0 ? (
        <Text style={[styles.chartSub, { marginTop: 12 }]}>{t('adminDashboard.noActiveEnrollments') || 'No active enrollments'}</Text>
      ) : (
        reportStats.popularity.map((item, index) => {
          const colors = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];
          const color = colors[index % colors.length];
          return (
            <View key={item.id} style={styles.heatmapRow}>
              <View style={styles.heatmapInfo}>
                <Text style={styles.heatmapName} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                <Text style={styles.heatmapPercent}>{item.percent}% <Text style={styles.assignedLabel}>{t('adminDashboard.assigned') || 'assigned'}</Text></Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${item.percent}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderAttentionNeeded = () => (
    <View style={styles.chartCard}>
      <View style={styles.attentionHeader}>
        <View style={styles.attentionIconContainer}>
          <AlertTriangle size={20} color="#ef4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chartTitle}>{t('adminDashboard.attentionNeeded') || 'Attention Needed'}</Text>
          <Text style={styles.chartSub}>{t('adminDashboard.attentionSub') || 'Courses performing below expectations'}</Text>
        </View>
      </View>
      {reportStats.attentionNeeded.length === 0 ? (
        <Text style={[styles.chartSub, {textAlign: 'center', marginVertical: 20}]}>{t('adminDashboard.allPerformingWell') || 'All courses performing well'}</Text>
      ) : (
        reportStats.attentionNeeded.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.attentionRow}
            onPress={() => navigation.navigate('Courses', { 
              screen: 'TeacherCourseDetails', 
              params: { courseId: item.id } 
            })}
          >
            <View style={styles.courseInitial}>
              <Text style={styles.initialText}>{item.title.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.attentionInfo}>
              <Text style={styles.attentionName}>{item.title}</Text>
              <Text style={styles.attentionRating}>{item.avg.toFixed(1)} {t('adminDashboard.stars') || 'Stars'} <Text style={styles.reviewLabel}>• {item.reviews} {t('adminDashboard.reviews') || 'reviews'}</Text></Text>
            </View>
            <View>
              <Text style={styles.reviseBtn}>{t('adminDashboard.revise') || 'Revise'}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderStalledLearners = () => {
    const { percent, stalled, active } = reportStats.stalledStats;
    const circumference = 251.2;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <View style={styles.chartCard}>
        <View style={styles.attentionHeader}>
          <View style={styles.stalledIconContainer}>
            <Hourglass size={20} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chartTitle}>{t('adminDashboard.stalledLearners') || 'Stalled Learners'}</Text>
            <Text style={styles.chartSub}>{t('adminDashboard.stalledSub') || 'Users inactive for >7 days'}</Text>
          </View>
        </View>
        
        <View style={styles.donutContainer}>
          <Svg height="160" width="160" viewBox="0 0 100 100">
            <SvgCircle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
            <SvgCircle 
              cx="50" cy="50" r="40" 
              stroke="#8b5cf6" strokeWidth="10" 
              fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <View style={styles.donutLabel}>
              <Text style={styles.donutPercent}>{percent}%</Text>
              <Text style={styles.donutCohort}>{t('adminDashboard.cohortAverage') || 'Stalled Average'}</Text>
            </View>
          </Svg>
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#c2410c' }]} />
            <Text style={styles.legendText}>{t('adminDashboard.stalled') || 'Stalled'} ({stalled})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e2e8f0' }]} />
            <Text style={styles.legendText}>{t('adminDashboard.active') || 'Active'} ({active})</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader />
      <View style={styles.header}>
        <Svg height="140" width={width - 32} style={styles.headerSvg}>
          <Defs>
            <LinearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#0ea5e9" />
              <Stop offset="1" stopColor="#2563eb" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerGrad)" rx="32" />
        </Svg>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            {t('adminDashboard.welcome', { name: user?.displayName?.split(' ')[0] || 'Teacher' })}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={{ width: '100%' }}>
          <AnalyticsCard 
            title={t('adminDashboard.totalRevenue') || 'TOTAL REVENUE'}
            value={`$${stats.totalRevenue.toLocaleString()}`} 
            subtext={t('adminDashboard.totalRevenueSub') || 'Total earnings'}
            icon={DollarSign} 
            color="#ef4444" 
            bg="#fef2f2" 
          />
        </View>
        <AnalyticsCard 
          title={t('adminDashboard.totalCourses') || 'MY COURSES'}
          value={stats.totalCourses} 
          subtext={t('adminDashboard.totalCoursesSub') || 'Courses created by you'}
          icon={BookOpen} 
          color="#10b981" 
          bg="#ecfdf5" 
          onPress={() => navigation.navigate('Courses')}
        />
        <AnalyticsCard 
          title={t('adminDashboard.totalUsers') || 'MY STUDENTS'}
          value={stats.totalStudents} 
          subtext={t('adminDashboard.totalUsersSub') || 'Total unique students'}
          icon={Users} 
          color="#4f46e5" 
          bg="#eef2ff" 
          onPress={() => navigation.navigate('Users')}
        />
      </View>

      {renderPopularity()}
      {renderAttentionNeeded()}
      {renderStalledLearners()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
    position: 'relative',
    height: 140,
  },
  headerSvg: {
    position: 'absolute',
  },
  headerContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  miniChartContainer: {
    marginVertical: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  chartSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  heatmapRow: {
    marginTop: 20,
  },
  heatmapInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heatmapName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    flexShrink: 1,
    marginRight: 8,
  },
  heatmapPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  assignedLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  attentionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stalledIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  courseInitial: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  initialText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3b82f6',
  },
  attentionInfo: {
    flex: 1,
  },
  attentionName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  attentionRating: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
    marginTop: 2,
  },
  reviewLabel: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  reviseBtn: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366f1',
  },
  donutContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  donutLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutPercent: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
  },
  donutCohort: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 90,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
});

export default TeacherDashboardScreen;
