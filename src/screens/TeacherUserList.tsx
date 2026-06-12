import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUsersRequest } from '../store/slices/userSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { 
  Search, 
  Users, 
  LayoutGrid, 
  List, 
  Eye, 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TeacherUserStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<TeacherUserStackParamList, 'TeacherUserList'>;

const TeacherUserList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { users, loading } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  const { user } = useAppSelector(state => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchUsersRequest());
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSearchVisible(false);
        setSearchTerm('');
      };
    }, [])
  );

  const myCourses = useMemo(() => courses.filter(c => c.createdBy === user?.uid), [courses, user?.uid]);
  const myCourseIds = useMemo(() => new Set(myCourses.map(c => c.id)), [myCourses]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role === 'admin' || u.role === 'teacher') return false;
      
      const hasEnrolled = u.enrolledCourses?.some(cId => myCourseIds.has(cId));
      if (!hasEnrolled) return false;

      const matchesSearch = 
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCourse = courseFilter === '' || u.enrolledCourses?.includes(courseFilter);
      return matchesSearch && matchesCourse;
    });
  }, [users, searchTerm, courseFilter, myCourseIds]);

  const renderFilterChips = () => (
    <View style={styles.filterWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity 
          style={[styles.chip, courseFilter === '' && styles.activeChip]}
          onPress={() => setCourseFilter('')}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipText, courseFilter === '' && styles.activeChipText]}>{t('adminUsers.allUsers') || 'All My Students'}</Text>
        </TouchableOpacity>
        {myCourses.map(course => (
          <TouchableOpacity 
            key={course.id}
            style={[styles.chip, courseFilter === course.id && styles.activeChip]}
            onPress={() => setCourseFilter(course.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, courseFilter === course.id && styles.activeChipText]}>
              {course.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.gridCardSkeleton}>
      <View style={styles.gridHeader}>
        <View style={styles.avatarSkeleton} />
        <View style={styles.badgeSkeleton} />
      </View>
      <View style={styles.textSkeletonShort} />
      <View style={styles.textSkeletonLong} />
    </View>
  );

  const renderUserItem = ({ item }: { item: any }) => {
    if (viewMode === 'list') {
      return (
        <TouchableOpacity 
          style={styles.listCard}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('TeacherUserDetails', { userId: item.id });
          }}
        >
          <View style={styles.avatarContainer}>
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initialsAvatar]}>
                <Text style={styles.initialsText}>
                  {(item.name || item.email).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: item.isOnline ? '#10b981' : '#cbd5e1' }]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.name || (t('adminUsers.noName') || 'Unnamed')}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          </View>
          <View style={styles.listActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => {
                navigation.navigate('TeacherUserDetails', { userId: item.id });
              }}
            >
              <Eye size={20} color={COLORS.outline} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.gridCard}
        activeOpacity={0.9}
        onPress={() => {
          navigation.navigate('TeacherUserDetails', { userId: item.id });
        }}
      >
        <View style={styles.gridHeader}>
          <View style={styles.avatarLargeContainer}>
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, styles.initialsAvatar]}>
                <Text style={styles.initialsTextLarge}>
                  {(item.name || item.email).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.statusDotLarge} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <View style={[styles.roleBadge, item.role === 'mentor' ? styles.mentorBadge : item.role === 'premium' ? styles.premiumBadge : styles.freeBadge]}>
              <Text style={[styles.roleText, item.role === 'mentor' ? styles.mentorText : item.role === 'premium' ? styles.premiumText : styles.freeText]}>
                {item.role || (t('adminUsers.freeTier') || 'FREE')}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => {
                navigation.navigate('TeacherUserDetails', { userId: item.id });
              }}
            >
              <Eye size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.userNameGrid} numberOfLines={1}>{item.name || (t('adminUsers.noName') || 'Unnamed')}</Text>
        <Text style={styles.userEmailGrid} numberOfLines={1}>{item.email}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
          <Text style={styles.title}>{t('adminUsers.management') || 'My Students'}</Text>
          <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={{ padding: 8 }}>
            <Search size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{t('adminUsers.subtitle') || 'View enrolled users'}</Text>
        <ScrollView contentContainerStyle={styles.listContent}>
          {[1, 2, 3, 4].map(i => <View key={i}>{renderSkeleton()}</View>)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
              <Text style={styles.title}>{t('adminUsers.management') || 'My Students'}</Text>
              <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={{ padding: 8 }}>
                <Search size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>{t('adminUsers.subtitle') || 'View enrolled users'}</Text>
            
            {isSearchVisible && (
              <View style={styles.searchContainer}>
                  <Search size={20} color={COLORS.outline} style={styles.searchIcon} />
                  <TextInput
                    placeholder={t('adminUsers.searchPlaceholder') || 'Search users...'}
                    style={styles.searchInput}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholderTextColor={COLORS.outline}
                    autoFocus
                  />
              </View>
            )}

            <View style={styles.viewModeToggleWrapper}>
              <View style={styles.viewModeToggle}>
                <TouchableOpacity 
                  style={[styles.toggleTab, viewMode === 'grid' && styles.activeToggleTab]} 
                  onPress={() => setViewMode('grid')}
                >
                  <LayoutGrid size={20} color={viewMode === 'grid' ? COLORS.primary : COLORS.outline} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleTab, viewMode === 'list' && styles.activeToggleTab]} 
                  onPress={() => setViewMode('list')}
                >
                  <List size={20} color={viewMode === 'list' ? COLORS.primary : COLORS.outline} />
                </TouchableOpacity>
              </View>
            </View>
            {renderFilterChips()}
          </>
        }
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={viewMode === 'grid' ? 1 : 1}
        key={viewMode}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={COLORS.outline} />
            <Text style={styles.emptyText}>{t('adminUsers.noStudents') || 'No students found'}</Text>
          </View>
        }
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headline,
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.outline,
    marginTop: -2,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    marginHorizontal: SPACING.md,
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: SPACING.md,
    height: 40,
    marginBottom: SPACING.xs,
  },
  searchIcon: {
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    fontFamily: 'Inter-Regular',
  },
  viewModeToggleWrapper: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: ROUNDNESS.lg,
    padding: 4,
    flex: 1,
  },
  toggleTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: ROUNDNESS.md,
  },
  activeToggleTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterWrapper: {
    height: 50,
    marginBottom: SPACING.sm,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignSelf: 'center',
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  activeChipText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: SPACING.md,
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  initialsAvatar: {
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  listActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  gridCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarLargeContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  statusDotLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  premiumBadge: { backgroundColor: '#ede9fe' },
  freeBadge: { backgroundColor: '#f1f5f9' },
  mentorBadge: { backgroundColor: '#ffedd5' },
  roleText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  premiumText: { color: '#6366f1' },
  freeText: { color: '#64748b' },
  mentorText: { color: '#f97316' },
  userNameGrid: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  userEmailGrid: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  gridCardSkeleton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 32,
    marginBottom: 20,
    height: 240,
  },
  avatarSkeleton: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
  },
  badgeSkeleton: {
    width: 80,
    height: 24,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  textSkeletonShort: {
    width: '40%',
    height: 20,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    marginTop: 16,
  },
  textSkeletonLong: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    marginTop: 8,
  },
  initialsTextLarge: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingTop: 100,
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

export default TeacherUserList;
