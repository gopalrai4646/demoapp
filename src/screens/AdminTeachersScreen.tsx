import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUsersRequest, approveTeacherRequest } from '../store/slices/userSlice';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { Users, CheckCircle, Search, Mail, Calendar, Clock, CheckCircle2 } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';

const AdminTeachersScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector(state => state.users);
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchUsersRequest());
  }, [dispatch]);

  const teachers = useMemo(() => {
    return users.filter(user => user.role === 'teacher');
  }, [users]);

  const pendingCount = teachers.filter(t => t.status === 'pending').length;
  const approvedCount = teachers.filter(t => t.status === 'approved').length;

  const filteredTeachers = useMemo(() => {
    let filtered = teachers.filter(t => t.status === activeTab);
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) || 
        (t.email && t.email.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [teachers, activeTab, searchQuery]);

  const handleApprove = (userId: string, userName: string) => {
    Alert.alert(
      t('adminTeachers.approveTitle') || 'Approve Teacher',
      t('adminTeachers.approveConfirm', { name: userName || (t('adminTeachers.unnamed') || 'this user') }) || `Are you sure you want to approve ${userName || 'this user'} to be a teacher?`,
      [
        { text: t('adminTeachers.cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('adminTeachers.approve') || 'Approve', 
          onPress: () => {
            dispatch(approveTeacherRequest(userId));
          }
        },
      ]
    );
  };

  const renderTeacherItem = ({ item }: { item: any }) => {
    const isPending = item.status === 'pending';
    
    // Fallback date logic
    const appliedDate = item.createdAt 
      ? new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleDateString()
      : 'Unknown';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.avatarContainer}>
              {item.photoURL ? (
                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.initialsAvatar]}>
                  <Text style={styles.initialsText}>
                    {(item.name || item.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {item.name || (t('adminTeachers.unnamed') || 'Unnamed Teacher')}
              </Text>
              <View style={styles.metaRow}>
                <Mail size={12} color="#64748b" />
                <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
              </View>
              <View style={styles.metaRow}>
                <Calendar size={12} color="#64748b" />
                <Text style={styles.metaText}>{t('adminTeachers.applied') || 'Applied: '}{appliedDate}</Text>
              </View>
            </View>
          </View>
          
          {isPending && (
            <TouchableOpacity 
              style={styles.approveButton} 
              onPress={() => handleApprove(item.id, item.name)}
            >
              <CheckCircle2 size={16} color="#fff" />
              <Text style={styles.approveButtonText}>{t('adminTeachers.approve') || 'Approve'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.teacherProfile && (
          <View style={styles.questionnaireContainer}>
            <Text style={styles.questionnaireTitle}>{t('adminTeachers.questionnaire') || 'QUESTIONNAIRE ANSWERS'}</Text>
            
            <View style={styles.qaItem}>
              <Text style={styles.qLabel}>{t('adminTeachers.teachingExp') || 'Teaching Experience'}</Text>
              <Text style={styles.aText}>{item.teacherProfile.experience}</Text>
            </View>
            
            <View style={styles.qaItem}>
              <Text style={styles.qLabel}>{t('adminTeachers.videoPro') || 'Video Proficiency'}</Text>
              <Text style={styles.aText}>{item.teacherProfile.videoPro}</Text>
            </View>
            
            <View style={styles.qaItem}>
              <Text style={styles.qLabel}>{t('adminTeachers.audienceSize') || 'Audience Size'}</Text>
              <Text style={styles.aText}>{item.teacherProfile.audience}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
        <Text style={styles.title}>{t('adminTeachers.title') || 'Teachers'}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Clock size={16} color={activeTab === 'pending' ? '#d97706' : COLORS.outline} />
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabTextPending]}>
              {t('adminTeachers.pending') || 'Pending'} ({pendingCount})
            </Text>
          </TouchableOpacity>
          <View style={styles.tabDivider} />
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
            onPress={() => setActiveTab('approved')}
          >
            <CheckCircle2 size={16} color={activeTab === 'approved' ? COLORS.primary : COLORS.outline} />
            <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabTextApproved]}>
              {t('adminTeachers.approved') || 'Approved'} ({approvedCount})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.outline} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder={t('adminTeachers.search') || "Search teachers..."}
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredTeachers}
        renderItem={renderTeacherItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={COLORS.outline} />
              <Text style={styles.emptyText}>{t('adminTeachers.noTeachers') || 'No teachers found.'}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Very light gray-blue background to match web
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: '#fff',
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: COLORS.onSurface,
  },
  controlsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: SPACING.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: ROUNDNESS.lg,
    padding: 4,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: ROUNDNESS.md,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.outline,
  },
  activeTabTextPending: {
    color: '#d97706',
  },
  activeTabTextApproved: {
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    paddingRight: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  initialsAvatar: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#64748b',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669', // Solid green from screenshot
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  questionnaireContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  questionnaireTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  qaItem: {
    marginBottom: 10,
  },
  qLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  aText: {
    fontSize: 14,
    color: '#0f172a',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.outline,
    fontWeight: '600',
  },
});

export default AdminTeachersScreen;
