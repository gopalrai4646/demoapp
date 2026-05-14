import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAppSelector } from '../store/hooks';
import { selectCourses, selectTrainingPlans } from '../store/selectors';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { BookOpen, Target, Play, GraduationCap, Video, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { UserTrainingPlanStackParamList } from '../navigation/UserTrainingPlanStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const UserTrainingPlanDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<UserTrainingPlanStackParamList, 'UserTrainingPlanDetails'>>();
  const { planId } = route.params;
  const { t } = useTranslation();

  const trainingPlans = useAppSelector(selectTrainingPlans);
  const allCourses = useAppSelector(selectCourses);

  const plan = trainingPlans.find(tp => tp.id === planId);
  const planCourses = allCourses.filter(c => plan?.courseIds?.includes(c.id));

  if (!plan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Image Section */}
        <View style={styles.headerImageContainer}>
          <Image 
            source={{ uri: plan.image || 'https://via.placeholder.com/800x600' }} 
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.overlay} />
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.planTitle}>{plan.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.headerBadge}>
                <BookOpen size={14} color="#fff" style={styles.badgeIcon} />
                <Text style={styles.headerBadgeText}>{t('userTrainingPlanDetails.coursesCount', { count: planCourses.length })}</Text>
              </View>
              <View style={[styles.headerBadge, { backgroundColor: '#4f46e5' }]}>
                <Target size={14} color="#fff" style={styles.badgeIcon} />
                <Text style={styles.headerBadgeText}>{t('userTrainingPlanDetails.assignedPlan')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Training Plan Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('userTrainingPlanDetails.planInfo')}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
          </View>

          {/* Curriculum */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('userTrainingPlanDetails.curriculum')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('userTrainingPlanDetails.curriculumSubtitle')}
            </Text>

            <View style={styles.courseList}>
              {planCourses.map((course, index) => (
                <View key={course.id} style={styles.courseCard}>
                  <View style={styles.courseCardHeader}>
                    <View style={styles.indexCircle}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    
                    {course.thumbnail ? (
                      <Image 
                        source={{ uri: course.thumbnail }} 
                        style={styles.courseThumbnail}
                      />
                    ) : (
                      <View style={[styles.courseThumbnail, { backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' }]}>
                        <BookOpen size={24} color="#94a3b8" />
                      </View>
                    )}

                    <View style={styles.courseMainInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: course.price === 0 ? '#ecfdf5' : '#fff7ed' }]}>
                          <Text style={[styles.typeBadgeText, { color: course.price === 0 ? '#059669' : '#d97706' }]}>
                            {course.price === 0 ? t('userTrainingPlanDetails.public') : t('userTrainingPlanDetails.private')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <GraduationCap size={14} color="#64748b" />
                          <Text style={styles.metaText}>{course.instructor}</Text>
                        </View>
                        <View style={styles.metaSeparator} />
                        <View style={styles.metaItem}>
                          <Video size={14} color="#64748b" />
                          <Text style={styles.metaText}>{t('userTrainingPlanDetails.lessonsCount', { count: course.videos?.length || 0 })}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => {
                        navigation.navigate('Courses', { 
                          screen: 'CoursePlayer', 
                          params: { courseId: course.id } 
                        });
                    }}
                  >
                    <Play size={18} color="#fff" fill="#fff" />
                    <Text style={styles.startButtonText}>{t('userTrainingPlanDetails.startCourse')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  planTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 6,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  body: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  planDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
  },
  courseList: {
    gap: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  indexCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indexText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  courseThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  courseMainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  startButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default UserTrainingPlanDetailsScreen;
