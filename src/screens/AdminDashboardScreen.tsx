import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchUsersRequest } from '../store/slices/userSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { fetchTrainingPlansRequest } from '../store/slices/trainingPlanSlice';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { AppHeader } from '../components/AppHeader';
import { 
  Users, 
  BookOpen, 
  Award, 
  DollarSign, 
  BarChart2, 
  GraduationCap,
  AlertTriangle,
  Hourglass,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import Svg, { Path, Rect, Circle as SvgCircle, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

const AdminDashboardScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { users } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  const { trainingPlans } = useAppSelector(state => state.trainingPlans);
  const { user, role, permissions } = useAppSelector(state => state.auth);
  const { t } = useTranslation();

  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [dauTimeframe, setDauTimeframe] = useState<'week' | 'month'>('week');
  const [activeInsight, setActiveInsight] = useState<'courses' | 'plans' | null>(null);

  useEffect(() => {
    dispatch(fetchUsersRequest());
    dispatch(fetchCoursesRequest());
    dispatch(fetchTrainingPlansRequest());

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

  const stats = useMemo(() => {
    const learners = users.filter(u => u.role !== 'admin');
    
    const totalUsers = learners.length;
    const totalCourses = courses.length;
    const totalPlans = trainingPlans.length;

    const totalRevenue = courses.reduce((sum, course) => {
      const enrollments = course.enrolledUsers?.length || 0;
      return sum + ((course.price || 0) * enrollments);
    }, 0);

    const planCounts: Record<string, number> = {};
    trainingPlans.forEach(tp => { planCounts[tp.id] = 0; });
    users.forEach(u => {
      u.assignedTrainingPlans?.forEach(tpId => {
        if (planCounts[tpId] !== undefined) planCounts[tpId]++;
      });
    });

    const planRevenue: Record<string, number> = {};
    trainingPlans.forEach(tp => {
      const planValue = tp.courseIds.reduce((sum, cid) => {
        const course = courses.find(c => c.id === cid);
        return sum + (course?.price || 0);
      }, 0);
      planRevenue[tp.id] = planValue * (planCounts[tp.id] || 0);
    });
    
    const sortedPlans = [...trainingPlans].sort((a, b) => (planRevenue[b.id] || 0) - (planRevenue[a.id] || 0));
    const topPlan = sortedPlans[0]?.name || 'None';

    const sortedCourses = [...courses].sort((a, b) => {
      const countA = a.enrolledUsers?.length || 0;
      const countB = b.enrolledUsers?.length || 0;
      return countB - countA;
    });
    const topCourse = sortedCourses[0]?.title || 'None';

    return {
      totalUsers,
      totalCourses,
      totalPlans,
      totalRevenue,
      topCourse,
      topPlan,
    };
  }, [users, courses, trainingPlans]);

  const reportStats = useMemo(() => {
    const learners = users.filter(u => u.role !== 'admin');
    const totalLearners = learners.length;

    // DAU
    const dauData = [];
    const daysToLookBack = dauTimeframe === 'week' ? 6 : 29;
    
    for (let i = daysToLookBack; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const labelDate = new Date();
      labelDate.setDate(labelDate.getDate() - i);
      let label = labelDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      if (dauTimeframe === 'month') {
        const dd = String(labelDate.getDate()).padStart(2, '0');
        const mm = String(labelDate.getMonth() + 1).padStart(2, '0');
        label = `${mm}/${dd}`;
      }
      
      const activeUserIdsThisDay = new Set();
      allProgress.forEach(p => {
        if (p.dailyActivity && p.dailyActivity[ds]) {
          const userId = p.id?.split('_')[0];
          if (userId) activeUserIdsThisDay.add(userId);
        }
      });
      
      dauData.push({ label, value: activeUserIdsThisDay.size });
    }

    // Popularity
    const sortedCoursesPop = [...courses].sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0));
    const popularity = sortedCoursesPop.slice(0, 4).map(c => {
       const enrolled = c.enrolledUsers?.length || 0;
       const percent = totalLearners > 0 ? Math.min(100, Math.round((enrolled / totalLearners) * 100)) : 0;
       return { id: c.id, title: c.title, percent };
    });

    // Attention Needed
    const courseRatings: Record<string, { sum: number; count: number; title: string }> = {};
    courses.forEach(c => { courseRatings[c.id] = { sum: 0, count: 0, title: c.title }; });
    
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
      .slice(0, 3);

    // Stalled Learners
    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    let stalledCount = 0;
    let activeCount = 0;
    
    learners.forEach(learner => {
      if (!learner.enrolledCourses || learner.enrolledCourses.length === 0) return;
      
      const userProgs = allProgress.filter(p => p.id?.startsWith(learner.id + '_'));
      
      let isStalled = true;
      userProgs.forEach(p => {
        if (p.lastUpdated) {
          const lastUpdateDate = new Date(p.lastUpdated).getTime();
          if (now - lastUpdateDate < SEVEN_DAYS_MS) {
            isStalled = false;
          }
        }
      });
      
      if (isStalled) stalledCount++;
      else activeCount++;
    });
    
    const totalAssigned = stalledCount + activeCount;
    const stalledPercent = totalAssigned > 0 ? Math.round((stalledCount / totalAssigned) * 100) : 0;

    return { dauData, popularity, attentionNeeded, stalledStats: { percent: stalledPercent, stalled: stalledCount, active: activeCount } };
  }, [users, courses, allProgress, dauTimeframe]);

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

  const renderInsightModal = () => {
    if (!activeInsight) return null;
    
    const isCourses = activeInsight === 'courses';
    const data = isCourses 
      ? [...courses]
          .sort((a, b) => (b.enrolledUsers?.length || 0) - (a.enrolledUsers?.length || 0))
          .slice(0, 5)
          .map(c => ({ label: c.title, value: c.enrolledUsers?.length || 0 }))
      : [...trainingPlans]
          .map(tp => {
            const planValue = tp.courseIds.reduce((sum, cid) => {
              const course = courses.find(c => c.id === cid);
              return sum + (course?.price || 0);
            }, 0);
            const count = users.filter(u => u.assignedTrainingPlans?.includes(tp.id)).length;
            return { label: tp.name, value: planValue * count };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

    const maxVal = Math.max(...data.map(d => d.value), 1);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!activeInsight}
        onRequestClose={() => setActiveInsight(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isCourses ? t('adminDashboard.top5Courses') : t('adminDashboard.top5Plans')}</Text>
              <TouchableOpacity onPress={() => setActiveInsight(null)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {isCourses && (
                <Text style={styles.chartSub}>{t('adminDashboard.enrollmentDist')}</Text>
              )}
              <View style={styles.modalChartWrapper}>
                <Svg height="220" width={width - 80}>
                  {data.map((item, index) => {
                    const barWidth = ((width - 100) / data.length) - 10;
                    const barHeight = (item.value / maxVal) * 140;
                    const x = index * (barWidth + 10);
                    
                    return (
                      <G key={index}>
                        <Rect 
                          x={x} 
                          y={160 - barHeight} 
                          width={barWidth} 
                          height={barHeight} 
                          fill={isCourses ? '#0ea5e9' : '#8b5cf6'} 
                          rx={6} 
                        />
                        <SvgText
                          x={x + barWidth / 2}
                          y={180}
                          fontSize="9"
                          fill="#64748b"
                          textAnchor="middle"
                          fontWeight="700"
                        >
                          {item.label.length > 10 ? item.label.substring(0, 8) + '..' : item.label}
                        </SvgText>
                        <SvgText
                          x={x + barWidth / 2}
                          y={160 - barHeight - 8}
                          fontSize="11"
                          fill={isCourses ? '#0ea5e9' : '#8b5cf6'} 
                          textAnchor="middle"
                          fontWeight="900"
                        >
                          {isCourses ? item.value : `$${item.value >= 1000 ? (item.value / 1000).toFixed(1) + 'k' : item.value}`}
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
              </View>
            </View>

            <TouchableOpacity style={styles.dismissBtn} onPress={() => setActiveInsight(null)}>
              <Text style={styles.dismissBtnText}>{t('adminDashboard.closeAnalysis')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const AnalyticsCard = ({ title, value, subtext, icon: Icon, color, bg, miniChart, onPress }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.cardLabel}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {miniChart && renderMiniChart(color)}
      <Text style={styles.cardSubtext}>{subtext}</Text>
    </TouchableOpacity>
  );

  const renderDAUChart = () => {
    const { dauData } = reportStats;
    const maxVal = Math.max(...dauData.map(d => d.value), 1);
    
    // SVG width is width - 80. SVG height is 100.
    const chartWidth = width - 80;
    const chartHeight = 80; // leave 20px for bottom padding inside svg
    
    const points = dauData.map((d, index) => {
      const x = (index / Math.max(dauData.length - 1, 1)) * chartWidth;
      const y = chartHeight - (d.value / maxVal) * chartHeight + 10; // +10 top padding
      return `${x},${y}`;
    });
    
    const linePath = points.length > 0 ? `M${points.join(' L')}` : '';
    const fillPath = points.length > 0 ? `${linePath} L${chartWidth},100 L0,100 Z` : '';

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.chartTitle}>{t('adminDashboard.dau')}</Text>
            <Text style={styles.chartSub}>{t('adminDashboard.dauSub')}</Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, dauTimeframe === 'week' && styles.toggleBtnActive]}
              onPress={() => setDauTimeframe('week')}
            >
              <Text style={[styles.toggleText, dauTimeframe === 'week' && styles.toggleTextActive]}>{t('adminDashboard.week')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, dauTimeframe === 'month' && styles.toggleBtnActive]}
              onPress={() => setDauTimeframe('month')}
            >
              <Text style={[styles.toggleText, dauTimeframe === 'month' && styles.toggleTextActive]}>{t('adminDashboard.month')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.lineChartPlaceholder}>
          <Svg height="100" width={chartWidth}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.2" />
                <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {points.length > 0 && (
              <>
                <Path
                  d={linePath}
                  fill="none"
                  stroke={COLORS.primary}
                  strokeWidth="3"
                />
                <Path
                  d={fillPath}
                  fill="url(#grad)"
                />
              </>
            )}
          </Svg>
          <View style={styles.chartLabels}>
            {dauData.map((d, index) => (
              (dauData.length <= 7 || index % Math.ceil(dauData.length / 7) === 0) ? (
                <Text key={index} style={styles.dayLabel}>{d.label}</Text>
              ) : null
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderPopularity = () => (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{t('adminDashboard.popularity')}</Text>
      {reportStats.popularity.length === 0 ? (
        <Text style={[styles.chartSub, { marginTop: 12 }]}>{t('adminDashboard.noActiveEnrollments')}</Text>
      ) : (
        reportStats.popularity.map((item, index) => {
          const colors = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];
          const color = colors[index % colors.length];
          return (
            <View key={item.id} style={styles.heatmapRow}>
              <View style={styles.heatmapInfo}>
                <Text style={styles.heatmapName}>{item.title}</Text>
                <Text style={styles.heatmapPercent}>{item.percent}% <Text style={styles.assignedLabel}>{t('adminDashboard.assigned')}</Text></Text>
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
          <Text style={styles.chartTitle}>{t('adminDashboard.attentionNeeded')}</Text>
          <Text style={styles.chartSub}>{t('adminDashboard.attentionSub')}</Text>
        </View>
      </View>
      {reportStats.attentionNeeded.length === 0 ? (
        <Text style={[styles.chartSub, {textAlign: 'center', marginVertical: 20}]}>{t('adminDashboard.allPerformingWell')}</Text>
      ) : (
        reportStats.attentionNeeded.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.attentionRow}
            onPress={() => navigation.navigate('Courses', { 
              screen: 'AdminCourseDetails', 
              params: { courseId: item.id } 
            })}
          >
            <View style={styles.courseInitial}>
              <Text style={styles.initialText}>{item.title.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.attentionInfo}>
              <Text style={styles.attentionName}>{item.title}</Text>
              <Text style={styles.attentionRating}>{item.avg.toFixed(1)} {t('adminDashboard.stars')} <Text style={styles.reviewLabel}>• {item.reviews} {t('adminDashboard.reviews')}</Text></Text>
            </View>
            <View>
              <Text style={styles.reviseBtn}>{t('adminDashboard.revise')}</Text>
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
            <Text style={styles.chartTitle}>{t('adminDashboard.stalledLearners')}</Text>
            <Text style={styles.chartSub}>{t('adminDashboard.stalledSub')}</Text>
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
              <Text style={styles.donutCohort}>{t('adminDashboard.cohortAverage')}</Text>
            </View>
          </Svg>
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#c2410c' }]} />
            <Text style={styles.legendText}>{t('adminDashboard.stalled')} ({stalled})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e2e8f0' }]} />
            <Text style={styles.legendText}>{t('adminDashboard.active')} ({active})</Text>
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
              <Stop offset="0" stopColor="#6366f1" />
              <Stop offset="1" stopColor="#a855f7" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerGrad)" rx="32" />
        </Svg>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            {t('adminDashboard.welcome', { name: user?.displayName?.split(' ')[0] || 'Admin' })}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {role === 'admin' && (
          <AnalyticsCard 
            title={t('adminDashboard.totalUsers')}
            value={stats.totalUsers} 
            subtext={t('adminDashboard.totalUsersSub')}
            icon={Users} 
            color="#4f46e5" 
            bg="#eef2ff" 
            onPress={() => navigation.navigate('Users')}
          />
        )}
        <AnalyticsCard 
          title={t('adminDashboard.totalCourses')}
          value={stats.totalCourses} 
          subtext={t('adminDashboard.totalCoursesSub')}
          icon={BookOpen} 
          color="#10b981" 
          bg="#ecfdf5" 
          onPress={() => navigation.navigate('Courses')}
        />
        <AnalyticsCard 
          title={t('adminDashboard.totalPlans')}
          value={stats.totalPlans} 
          subtext={t('adminDashboard.totalPlansSub')}
          icon={Award} 
          color="#f59e0b" 
          bg="#fffbeb" 
          onPress={() => navigation.navigate('Plans')}
        />
        {role === 'admin' && (
          <AnalyticsCard 
            title={t('adminDashboard.totalRevenue')}
            value={`$${stats.totalRevenue.toLocaleString()}`} 
            subtext={t('adminDashboard.totalRevenueSub')}
            icon={DollarSign} 
            color="#ef4444" 
            bg="#fef2f2" 
          />
        )}
        {(role === 'admin' || (permissions as string[]).includes('top_training_plans')) && (
          <AnalyticsCard 
            title={t('adminDashboard.topPlans')}
            value={stats.topPlan} 
            subtext="Most revenue producer"
            icon={GraduationCap} 
            color="#8b5cf6" 
            bg="#f5f3ff" 
            miniChart 
            onPress={() => setActiveInsight('plans')}
          />
        )}
        {(role === 'admin' || (permissions as string[]).includes('top_courses')) && (
          <AnalyticsCard 
            title={t('adminDashboard.topCourses')}
            value={stats.topCourse} 
            subtext={t('adminDashboard.topCoursesSub')}
            icon={BarChart2} 
            color="#0ea5e9" 
            bg="#f0f9ff" 
            miniChart 
            onPress={() => setActiveInsight('courses')}
          />
        )}
      </View>

      {renderDAUChart()}
      {renderPopularity()}
      {renderAttentionNeeded()}
      {renderStalledLearners()}
      {renderInsightModal()}
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#1e293b',
  },
  lineChartPlaceholder: {
    marginTop: 20,
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
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
  donutSubText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  modalBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalChartWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  dismissBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});

export default AdminDashboardScreen;
