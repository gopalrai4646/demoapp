import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUsersRequest, deleteUserRequest } from '../store/slices/userSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { impersonateUserRequest } from '../store/slices/authSlice';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { 
  Search, 
  Users, 
  LayoutGrid, 
  List, 
  Trash2, 
  Eye, 
  UserSquare2,
  ChevronRight,
  Filter,
  UserPlus,
  Circle
} from 'lucide-react-native';
import { AppHeader } from '../components/AppHeader';

const AdminUsersScreen = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector(state => state.users);
  const { courses } = useAppSelector(state => state.courses);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    dispatch(fetchUsersRequest());
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (user.role === 'admin') return false;
      const matchesSearch = 
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCourse = courseFilter === '' || user.enrolledCourses?.includes(courseFilter);
      return matchesSearch && matchesCourse;
    });
  }, [users, searchTerm, courseFilter]);

  const handleDelete = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => dispatch(deleteUserRequest(userId))
        },
      ]
    );
  };

  const handleImpersonate = (userId: string) => {
    Alert.alert(
      'Impersonate User',
      'You will be logged in as this student. You can switch back from the Account section.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: () => dispatch(impersonateUserRequest(userId))
        },
      ]
    );
  };

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
          <Text style={[styles.chipText, courseFilter === '' && styles.activeChipText]}>All Users</Text>
        </TouchableOpacity>
        {courses.map(course => (
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
      <View style={styles.actionSkeleton} />
    </View>
  );

  const renderUserItem = ({ item }: { item: any }) => {
    if (viewMode === 'list') {
      return (
        <View style={styles.listCard}>
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
            <Text style={styles.userName} numberOfLines={1}>{item.name || 'No Name'}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          </View>
          <View style={styles.listActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleImpersonate(item.id)}>
              <UserSquare2 size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteIconButton} onPress={() => handleDelete(item.id, item.name)}>
              <Trash2 size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.gridCard}>
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
          <View style={[styles.roleBadge, item.role === 'mentor' ? styles.mentorBadge : item.role === 'premium' ? styles.premiumBadge : styles.freeBadge]}>
            <Text style={[styles.roleText, item.role === 'mentor' ? styles.mentorText : item.role === 'premium' ? styles.premiumText : styles.freeText]}>
              {item.role || 'FREE TIER'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userNameGrid} numberOfLines={1}>{item.name || 'No Name'}</Text>
        <Text style={styles.userEmailGrid} numberOfLines={1}>{item.email}</Text>
        
        <View style={styles.gridActions}>
          <TouchableOpacity 
            style={styles.impersonateButton} 
            onPress={() => handleImpersonate(item.id)}
          >
            <UserSquare2 size={16} color="#fff" />
            <Text style={styles.impersonateButtonText}>Impersonate</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButtonSmall} 
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>Control and oversee your community</Text>
        </View>
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
            <View style={[styles.header, { paddingTop: SPACING.xl }]}>
              <Text style={styles.title}>User Management</Text>
              <Text style={styles.subtitle}>Control and oversee your community</Text>
            </View>
            <View style={styles.toolbar}>
              <View style={styles.searchBar}>
                <Search size={20} color={COLORS.onSurfaceVariant} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search name or email..."
                  style={styles.searchInput}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholderTextColor={COLORS.onSurfaceVariant}
                />
              </View>
              <View style={styles.viewModeToggle}>
                <TouchableOpacity 
                  style={[styles.toggleTab, viewMode === 'grid' && styles.activeToggleTab]} 
                  onPress={() => setViewMode('grid')}
                >
                  <LayoutGrid size={20} color={viewMode === 'grid' ? COLORS.primary : COLORS.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleTab, viewMode === 'list' && styles.activeToggleTab]} 
                  onPress={() => setViewMode('list')}
                >
                  <List size={20} color={viewMode === 'list' ? COLORS.primary : COLORS.onSurfaceVariant} />
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
        numColumns={viewMode === 'grid' ? 1 : 1} // Always 1 column for these rich cards
        key={viewMode}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={COLORS.outline} />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <UserPlus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    fontFamily: TYPOGRAPHY.headline.fontFamily,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  toggleTab: {
    padding: 8,
    borderRadius: 12,
  },
  activeToggleTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterWrapper: {
    height: 60,
    marginBottom: SPACING.md,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignSelf: 'center', // Prevents stretching
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: SPACING.md,
    borderRadius: 24,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
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
    width: 52,
    height: 52,
    borderRadius: 16,
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
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
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
  deleteIconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  gridCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 32,
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 25,
    elevation: 4,
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
    width: 72,
    height: 72,
    borderRadius: 24,
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
  enrollmentCapsule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  enrollmentLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  enrollmentCount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  courseAvatars: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  gridActions: {
    flexDirection: 'row',
    gap: 12,
  },
  impersonateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 16,
    gap: 8,
  },
  impersonateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButtonSmall: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
  enrollmentSkeleton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    marginTop: 20,
  },
  actionSkeleton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginTop: 20,
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

export default AdminUsersScreen;
