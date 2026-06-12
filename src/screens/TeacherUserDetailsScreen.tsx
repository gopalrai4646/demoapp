import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  BookOpen,
  Phone,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTrainingPlansRequest } from '../store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import {
  assignTrainingPlanRequest,
  unassignTrainingPlanRequest,
  enrollUserRequest,
  unenrollUserRequest,
} from '../store/slices/userSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TeacherUserStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<TeacherUserStackParamList, 'TeacherUserDetails'>;

const TeacherUserDetailsScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // ─── Redux selectors ───
  const { trainingPlans } = useAppSelector(state => state.trainingPlans);
  const { courses } = useAppSelector(state => state.courses);
  const { users } = useAppSelector(state => state.users);
  const { user: currentUser } = useAppSelector(state => state.auth);
  
  const student = users.find(u => u.id === userId);

  // ─── Local UI state for assign flows ───
  const [isAssigningPlan, setIsAssigningPlan] = useState(false);
  const [showPlanList, setShowPlanList] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [isEnrollingCourse, setIsEnrollingCourse] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Ensure data is loaded
  useEffect(() => {
    if (trainingPlans.length === 0) dispatch(fetchTrainingPlansRequest());
    if (courses.length === 0) dispatch(fetchCoursesRequest());
  }, [dispatch]);

  if (!student) return null;

  // ─── Helper functions ───
  const getCourseTitle = (id: string) => courses.find(c => c.id === id)?.title || null;
  const getPlanName = (id: string) => trainingPlans.find(tp => tp.id === id)?.name || null;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ─── TEACHER SPECIFIC LOGIC ───
  const isMyPlan = (planId: string) => trainingPlans.find(tp => tp.id === planId)?.createdBy === currentUser?.uid;
  const isMyCourse = (courseId: string) => courses.find(c => c.id === courseId)?.createdBy === currentUser?.uid;

  // Available plans for assignment: only those created by the teacher AND not already assigned
  const availablePlansToAssign = trainingPlans.filter(
    tp => tp.createdBy === currentUser?.uid && !student.assignedTrainingPlans?.includes(tp.id),
  );

  // Available courses for enrollment: only those created by the teacher AND not already enrolled
  const availableCoursesToEnroll = courses.filter(
    c => c.createdBy === currentUser?.uid && !student.enrolledCourses?.includes(c.id),
  );

  // ─── Handlers: Training Plans ───
  const handleAssignPlan = () => {
    if (!selectedPlanId) return;
    dispatch(assignTrainingPlanRequest({ userId: student.id, trainingPlanIds: [selectedPlanId] }));
    setIsAssigningPlan(false);
    setShowPlanList(false);
    setSelectedPlanId('');
  };

  const handleUnassignPlan = (planId: string, planName: string) => {
    if (!isMyPlan(planId)) return;
    Alert.alert(
      t('adminUserDetails.removePlanTitle') || 'Remove Training Plan',
      t('adminUserDetails.removePlanConfirm', { planName, userName: student.name }) || `Are you sure you want to remove ${planName}?`,
      [
        { text: t('adminUserDetails.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('adminUserDetails.remove') || 'Remove',
          style: 'destructive',
          onPress: () => dispatch(unassignTrainingPlanRequest({ userId: student.id, trainingPlanId: planId })),
        },
      ],
    );
  };

  // ─── Handlers: Courses ───
  const handleEnrollCourse = () => {
    if (!selectedCourseId) return;
    dispatch(enrollUserRequest({ userId: student.id, courseId: selectedCourseId }));
    setIsEnrollingCourse(false);
    setShowCourseList(false);
    setSelectedCourseId('');
  };

  const handleUnenrollCourse = (courseId: string, courseTitle: string) => {
    if (!isMyCourse(courseId)) return;
    Alert.alert(
      'Unenroll Student',
      `Are you sure you want to unenroll ${student.name} from ${courseTitle}?`,
      [
        { text: t('adminUserDetails.cancel') || 'Cancel', style: 'cancel' },
        {
          text: 'Unenroll',
          style: 'destructive',
          onPress: () => dispatch(unenrollUserRequest({ userId: student.id, courseId })),
        },
      ],
    );
  };

  // ─── Derived Data ───
  const validAssignedPlans = (student.assignedTrainingPlans || []).filter(id => trainingPlans.some(tp => tp.id === id));
  const validEnrolledCourses = (student.enrolledCourses || []).filter(id => courses.some(c => c.id === id));

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{student.name || t('adminUserDetails.noName')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Profile Section ─── */}
        <View style={styles.profileSection}>
          {student.photoURL ? (
            <Image source={{ uri: student.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(student.name || student.email).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {student.name || t('adminUserDetails.noName')}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {student.email}
            </Text>
            <View style={styles.metaRow}>
              {student.phoneNumber && (
                <View style={styles.metaItem}>
                  <Phone size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>{student.phoneNumber}</Text>
                </View>
              )}
              {student.createdAt && (
                <View style={styles.metaItem}>
                  <Calendar size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>
                    {t('adminUserDetails.joined', { date: formatDate(student.createdAt) }) || `Joined ${formatDate(student.createdAt)}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ─── Section: Enrolled Courses ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <BookOpen size={16} color="#64748b" />
              <Text style={styles.cardTitle}>Enrolled Courses ({validEnrolledCourses.length})</Text>
            </View>
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => {
                setIsEnrollingCourse(!isEnrollingCourse);
                setShowCourseList(false);
                setIsAssigningPlan(false);
              }}>
              <Text style={styles.assignBtnText}>{isEnrollingCourse ? t('adminUserDetails.cancel') || 'Cancel' : 'Enroll'}</Text>
            </TouchableOpacity>
          </View>

          {isEnrollingCourse && (
            <View style={styles.assignContainer}>
              <TouchableOpacity 
                style={styles.customPicker} 
                onPress={() => setShowCourseList(!showCourseList)}
              >
                <Text style={[styles.pickerText, !selectedCourseId && { color: '#94a3b8' }]}>
                  {selectedCourseId ? (getCourseTitle(selectedCourseId) || 'Select Course') : 'Select Course'}
                </Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>

              {showCourseList && (
                <View style={styles.dropdownList}>
                  {availableCoursesToEnroll.length > 0 ? (
                    availableCoursesToEnroll.map(course => (
                      <TouchableOpacity 
                        key={course.id} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedCourseId(course.id);
                          setShowCourseList(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{course.title}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noItemsText}>No available courses to assign.</Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.assignConfirmBtn, !selectedCourseId && styles.assignConfirmBtnDisabled]}
                onPress={handleEnrollCourse}
                disabled={!selectedCourseId}>
                <Text style={styles.assignConfirmBtnText}>Confirm Enrollment</Text>
              </TouchableOpacity>
            </View>
          )}

          {validEnrolledCourses.length > 0 ? (
            <View style={styles.listContainer}>
              {validEnrolledCourses.map(id => {
                const title = getCourseTitle(id);
                return (
                  <View key={id} style={styles.listItem}>
                    <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
                    <Text style={[styles.listItemText, { color: '#6366f1' }]} numberOfLines={1}>{title}</Text>
                    {isMyCourse(id) && (
                      <TouchableOpacity onPress={() => handleUnenrollCourse(id, title || '')} style={styles.trashBtn}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No enrolled courses</Text>
            </View>
          )}
        </View>

        {/* ─── Section: Assigned Training Plans ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <ClipboardList size={16} color="#64748b" />
              <Text style={styles.cardTitle}>
                {t('adminUserDetails.assignedPlans', { count: validAssignedPlans.length }) || `Assigned Plans (${validAssignedPlans.length})`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => {
                setIsAssigningPlan(!isAssigningPlan);
                setShowPlanList(false);
                setIsEnrollingCourse(false);
              }}>
              <Text style={styles.assignBtnText}>{isAssigningPlan ? t('adminUserDetails.cancel') || 'Cancel' : t('adminUserDetails.assignPlan') || 'Assign Plan'}</Text>
            </TouchableOpacity>
          </View>

          {isAssigningPlan && (
            <View style={styles.assignContainer}>
              <TouchableOpacity 
                style={styles.customPicker} 
                onPress={() => setShowPlanList(!showPlanList)}
              >
                <Text style={[styles.pickerText, !selectedPlanId && { color: '#94a3b8' }]}>
                  {selectedPlanId ? (getPlanName(selectedPlanId) || 'Select Plan') : t('adminUserDetails.selectPlan') || 'Select Plan'}
                </Text>
                <ChevronDown size={16} color="#94a3b8" />
              </TouchableOpacity>

              {showPlanList && (
                <View style={styles.dropdownList}>
                  {availablePlansToAssign.length > 0 ? (
                    availablePlansToAssign.map(plan => (
                      <TouchableOpacity 
                        key={plan.id} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedPlanId(plan.id);
                          setShowPlanList(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{plan.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noItemsText}>{t('adminUserDetails.noMorePlans') || 'No more plans available.'}</Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.assignConfirmBtn, !selectedPlanId && styles.assignConfirmBtnDisabled]}
                onPress={handleAssignPlan}
                disabled={!selectedPlanId}>
                <Text style={styles.assignConfirmBtnText}>{t('adminUserDetails.confirmAssignment') || 'Confirm Assignment'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {validAssignedPlans.length > 0 ? (
            <View style={styles.listContainer}>
              {validAssignedPlans.map(id => {
                const planName = getPlanName(id);
                return (
                  <View key={id} style={styles.listItem}>
                    <View style={[styles.dot, { backgroundColor: '#94a3b8' }]} />
                    <Text style={styles.listItemText} numberOfLines={1}>{planName}</Text>
                    {isMyPlan(id) && (
                      <TouchableOpacity onPress={() => handleUnassignPlan(id, planName || '')} style={styles.trashBtn}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('adminUserDetails.noAssignedPlans') || 'No assigned plans'}</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerTitle: { ...TYPOGRAPHY.headline, color: COLORS.onSurface },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, backgroundColor: '#fff', padding: SPACING.lg, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 80, height: 80, borderRadius: 24, marginRight: SPACING.md },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#4f46e5' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: SPACING.md, marginBottom: SPACING.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  assignBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  assignBtnText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  assignContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#e0e7ff', gap: 12 },
  customPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerText: { fontSize: 14, color: '#0f172a' },
  dropdownList: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 14, color: '#0f172a' },
  noItemsText: { padding: 12, fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  assignConfirmBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 12, alignItems: 'center' },
  assignConfirmBtnDisabled: { opacity: 0.5 },
  assignConfirmBtnText: { color: '#ffffff', fontWeight: '700' },
  listContainer: { gap: SPACING.sm },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: SPACING.md, borderRadius: 16, gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listItemText: { fontSize: 14, fontWeight: '700', color: '#334155', flex: 1 },
  trashBtn: { padding: 4 },
  emptyState: { backgroundColor: '#f8fafc', padding: SPACING.md, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#64748b', fontStyle: 'italic' },
});

export default TeacherUserDetailsScreen;
