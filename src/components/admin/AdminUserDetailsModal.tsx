import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  X,
  ClipboardList,
  BookOpen,
  Heart,
  Phone,
  Calendar,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTrainingPlansRequest } from '../../store/slices/trainingPlanSlice';
import {
  User,
  assignTrainingPlanRequest,
  unassignTrainingPlanRequest,
} from '../../store/slices/userSlice';
import { COLORS, SPACING } from '../../constants/Theme';

interface Props {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

const AdminUserDetailsModal = ({ visible, user: userProp, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // ─── Redux selectors (read from Firestore via real-time onSnapshot listeners) ───
  const { trainingPlans } = useAppSelector(state => state.trainingPlans);
  const { courses } = useAppSelector(state => state.courses);
  const { users } = useAppSelector(state => state.users);
  const user = users.find(u => u.id === userProp?.id) || userProp;

  // ─── Permission check ───
  const { role, permissions } = useAppSelector(state => state.auth);
  const canAssign = role === 'admin' || (role === 'staff' && permissions.includes('training_plans_assign'));

  // ─── Local UI state for the assign flow ───
  const [isAssigning, setIsAssigning] = useState(false);
  const [showPlanList, setShowPlanList] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Ensure training plans are loaded when modal opens
  useEffect(() => {
    if (visible && trainingPlans.length === 0) {
      dispatch(fetchTrainingPlansRequest());
    }
    // Reset assign UI when modal closes
    if (!visible) {
      setIsAssigning(false);
      setShowPlanList(false);
      setSelectedPlanId('');
    }
  }, [visible, dispatch, trainingPlans.length]);

  if (!user) return null;

  // ─── Cross-collection lookups ───
  const getCourseTitle = (id: string) =>
    courses.find(c => c.id === id)?.title || null;

  const getPlanName = (id: string) =>
    trainingPlans.find(tp => tp.id === id)?.name || null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ─── WRITE: Assign a training plan ───
  const handleAssignPlan = () => {
    if (!selectedPlanId) return;
    dispatch(
      assignTrainingPlanRequest({
        userId: user.id,
        trainingPlanIds: [selectedPlanId],
      }),
    );
    setIsAssigning(false);
    setShowPlanList(false);
    setSelectedPlanId('');
  };

  // ─── WRITE: Unassign a training plan ───
  const handleUnassignPlan = (planId: string, planName: string) => {
    Alert.alert(
      t('adminUserDetails.removePlanTitle'),
      t('adminUserDetails.removePlanConfirm', { planName, userName: user.name || t('adminUserDetails.thisUser') }),
      [
        { text: t('adminUserDetails.cancel'), style: 'cancel' },
        {
          text: t('adminUserDetails.remove'),
          style: 'destructive',
          onPress: () =>
            dispatch(
              unassignTrainingPlanRequest({
                userId: user.id,
                trainingPlanId: planId,
              }),
            ),
        },
      ],
    );
  };

  // Filter: only show plans NOT already assigned
  const availablePlans = trainingPlans.filter(
    tp => !user.assignedTrainingPlans?.includes(tp.id),
  );

  // ─── Derived Data: Filter out deleted items ───
  const validAssignedPlans = (user.assignedTrainingPlans || []).filter(id => trainingPlans.some(tp => tp.id === id));
  const validEnrolledCourses = (user.enrolledCourses || []).filter(id => courses.some(c => c.id === id));
  const validSavedCourses = (user.savedCourses || []).filter(id => courses.some(c => c.id === id));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('adminUserDetails.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            
            {/* Section 1: Profile */}
            <View style={styles.profileSection}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.name} numberOfLines={1}>
                  {user.name || t('adminUserDetails.noName')}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {user.email}
                </Text>

                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.roleBadge,
                      user.role === 'admin' && styles.adminBadge,
                    ]}>
                    <Text
                      style={[
                        styles.roleText,
                        user.role === 'admin' && styles.adminRoleText,
                      ]}>
                      {user.role.toUpperCase()}
                    </Text>
                  </View>

                  {user.phoneNumber && (
                    <View style={styles.metaItem}>
                      <Phone size={12} color="#94a3b8" />
                      <Text style={styles.metaText}>{user.phoneNumber}</Text>
                    </View>
                  )}

                  {user.createdAt && (
                    <View style={styles.metaItem}>
                      <Calendar size={12} color="#94a3b8" />
                      <Text style={styles.metaText}>
                        {t('adminUserDetails.joined', { date: formatDate(user.createdAt) })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Section 2: Assigned Training Plans */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <ClipboardList size={16} color="#64748b" />
                  <Text style={styles.cardTitle}>
                    {t('adminUserDetails.assignedPlans', { count: validAssignedPlans.length })}
                  </Text>
                </View>
                {canAssign && (
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => {
                      setIsAssigning(!isAssigning);
                      setShowPlanList(false);
                    }}>
                    <Text style={styles.assignBtnText}>{isAssigning ? t('adminUserDetails.cancel') : t('adminUserDetails.assignPlan')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isAssigning && (
                <View style={styles.assignContainer}>
                  <TouchableOpacity 
                    style={styles.customPicker} 
                    onPress={() => setShowPlanList(!showPlanList)}
                  >
                    <Text style={[styles.pickerText, !selectedPlanId && { color: '#94a3b8' }]}>
                      {selectedPlanId ? (getPlanName(selectedPlanId) || 'Select Plan') : t('adminUserDetails.selectPlan')}
                    </Text>
                    <ChevronDown size={16} color="#94a3b8" />
                  </TouchableOpacity>

                  {showPlanList && (
                    <View style={styles.planListDropdown}>
                      {availablePlans.length > 0 ? (
                        availablePlans.map(plan => (
                          <TouchableOpacity 
                            key={plan.id} 
                            style={styles.planListItem}
                            onPress={() => {
                              setSelectedPlanId(plan.id);
                              setShowPlanList(false);
                            }}
                          >
                            <Text style={styles.planListItemText}>{plan.name}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noPlansText}>{t('adminUserDetails.noMorePlans')}</Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.assignConfirmBtn,
                      !selectedPlanId && styles.assignConfirmBtnDisabled,
                    ]}
                    onPress={handleAssignPlan}
                    disabled={!selectedPlanId}>
                    <Text style={styles.assignConfirmBtnText}>{t('adminUserDetails.confirmAssignment')}</Text>
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
                        {canAssign && (
                          <TouchableOpacity
                            onPress={() => handleUnassignPlan(id, planName || '')}
                            style={styles.trashBtn}>
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{t('adminUserDetails.noAssignedPlans')}</Text>
                </View>
              )}
            </View>

            {/* Section 3: Enrolled Courses */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <BookOpen size={16} color="#64748b" />
                  <Text style={styles.cardTitle}>{t('adminUserDetails.enrolledCourses', { count: validEnrolledCourses.length })}</Text>
                </View>
              </View>

              {validEnrolledCourses.length > 0 ? (
                <View style={styles.listContainer}>
                  {validEnrolledCourses.map(id => (
                    <View key={id} style={styles.listItem}>
                      <View style={[styles.dot, { backgroundColor: '#6366f1' }]} />
                      <Text style={[styles.listItemText, { color: '#6366f1' }]} numberOfLines={1}>{getCourseTitle(id)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{t('adminUserDetails.noEnrolledCourses')}</Text>
                </View>
              )}
            </View>

            {/* Section 4: Saved Courses */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Heart size={16} color="#e11d48" fill="#e11d48" />
                  <Text style={styles.cardTitle}>{t('adminUserDetails.savedCourses', { count: validSavedCourses.length })}</Text>
                </View>
              </View>

              {validSavedCourses.length > 0 ? (
                <View style={styles.listContainer}>
                  {validSavedCourses.map(id => (
                    <View key={id} style={styles.listItem}>
                      <View style={[styles.dot, { backgroundColor: '#e11d48' }]} />
                      <Text style={[styles.listItemText, { color: '#e11d48' }]} numberOfLines={1}>{getCourseTitle(id)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{t('adminUserDetails.noSavedCourses')}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: SPACING.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: SPACING.xl },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 24, marginRight: SPACING.md },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#4f46e5' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  roleBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  adminBadge: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  roleText: { fontSize: 10, fontWeight: '900', color: '#475569' },
  adminRoleText: { color: '#e11d48' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  card: { backgroundColor: '#f8fafc', borderRadius: 24, padding: SPACING.md, marginBottom: SPACING.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  assignBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  assignBtnText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  assignContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#e0e7ff', gap: 12 },
  customPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerText: { fontSize: 14, color: '#0f172a' },
  planListDropdown: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  planListItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  planListItemText: { fontSize: 14, color: '#0f172a' },
  noPlansText: { padding: 12, fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  assignConfirmBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 12, alignItems: 'center' },
  assignConfirmBtnDisabled: { opacity: 0.5 },
  assignConfirmBtnText: { color: '#ffffff', fontWeight: '700' },
  listContainer: { gap: SPACING.sm },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: SPACING.md, borderRadius: 16, gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listItemText: { fontSize: 14, fontWeight: '700', color: '#334155', flex: 1 },
  trashBtn: { padding: 4 },
  emptyState: { backgroundColor: '#ffffff', padding: SPACING.md, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#64748b', fontStyle: 'italic' },
});

export default AdminUserDetailsModal;
