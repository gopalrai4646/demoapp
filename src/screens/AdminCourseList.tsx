import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Dimensions, Alert, StatusBar } from 'react-native';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminCourseStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTranslation } from 'react-i18next';
import { fetchCoursesRequest, deleteCourseRequest, Course } from '../store/slices/courseSlice';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  BookOpen, 
  Users, 
  Pencil, 
  Trash2,
  ShieldCheck,
  ShieldOff
} from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<AdminCourseStackParamList, 'AdminCourseList'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - SPACING.md * 1.5;

const AdminCourseList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { courses, loading } = useSelector((state: RootState) => state.courses);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchCoursesRequest());
  }, [dispatch]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      t('adminCourses.deleteTitle'),
      t('adminCourses.deleteConfirm', { title }),
      [
        { text: t('adminCourses.cancel'), style: 'cancel' },
        { 
          text: t('adminCourses.delete'), 
          style: 'destructive', 
          onPress: () => dispatch(deleteCourseRequest(id)) 
        },
      ]
    );
  };

  const filteredCourses = courses.filter(c => {
    if (filter === 'public' && c.visibility !== 'public') return false;
    if (filter === 'private' && c.visibility !== 'private') return false;
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(query);
      const matchInstructor = c.instructor?.toLowerCase().includes(query);
      if (!matchTitle && !matchInstructor) return false;
    }
    return true;
  });

  const renderCourseCard = ({ item }: { item: Course }) => {
    const isGrid = viewMode === 'grid';
    const isPublic = item.visibility !== 'private';
    const learnerCount = item.enrolledUsers?.length || 0;

    return (
      <View style={[styles.cardContainer, isGrid ? styles.cardGrid : styles.cardList]}>
        <View style={[styles.imageContainer, isGrid ? { height: 120 } : { height: 160 }]}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.coverImage} />
          ) : (
             <View style={[styles.coverImage, { backgroundColor: COLORS.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }]}>
                <BookOpen size={40} color={COLORS.outlineVariant} />
             </View>
          )}
          <View style={[styles.badge, isPublic ? styles.badgePublic : styles.badgePrivate]}>
            {isPublic ? <ShieldCheck size={10} color="#065f46" /> : <ShieldOff size={10} color="#92400e" />}
            <Text style={[styles.badgeText, isPublic ? styles.badgeTextPublic : styles.badgeTextPrivate]}>
              {isPublic ? t('adminCourses.publicBadge') : t('adminCourses.privateBadge')}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.instructorRow}>
            <View style={[styles.avatarMini, { backgroundColor: COLORS.primaryContainer, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff', fontSize: 10 }}>{item.instructor?.charAt(0) || '?'}</Text>
            </View>
            <Text style={styles.instructorName} numberOfLines={1}>{item.instructor || t('adminCourses.unknown')}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <Users size={12} color={COLORS.outline} />
            <Text style={styles.learnersText}>{t('adminCourses.learnersCount', { count: learnerCount.toLocaleString() })}</Text>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('AdminCourseDetails', { courseId: item.id })}
            >
              <Pencil size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDelete(item.id, item.title)}
            >
              <Trash2 size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
        <Text style={TYPOGRAPHY.headline}>{t('adminCourses.manageCourses')}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminCourseDetails', {})}
        >
          <Plus size={24} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.outline} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder={t('adminCourses.searchPlaceholder')}
          placeholderTextColor={COLORS.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters & View Toggles */}
      <View style={styles.controlsRow}>
        <View style={styles.viewToggles}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <LayoutGrid size={16} color={viewMode === 'grid' ? COLORS.primary : COLORS.outline} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? COLORS.primary : COLORS.outline} />
          </TouchableOpacity>
        </View>

        <View style={styles.filtersWrapper}>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>{t('adminCourses.all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'public' && styles.filterChipActive]}
            onPress={() => setFilter('public')}
          >
            <Text style={[styles.filterText, filter === 'public' && styles.filterTextActive]}>{t('adminCourses.public')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'private' && styles.filterChipActive]}
            onPress={() => setFilter('private')}
          >
            <Text style={[styles.filterText, filter === 'private' && styles.filterTextActive]}>{t('adminCourses.private')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={filteredCourses}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        renderItem={renderCourseCard}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridColumnWrapper : undefined}
        showsVerticalScrollIndicator={false}
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
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: ROUNDNESS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: COLORS.onPrimary,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    marginHorizontal: SPACING.md,
    borderRadius: ROUNDNESS.xl,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    fontFamily: 'Inter-Regular',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewToggles: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: ROUNDNESS.lg,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDNESS.md,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.outline,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  filtersWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ROUNDNESS.full,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.outline,
  },
  filterTextActive: {
    color: COLORS.onPrimary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 20,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardGrid: {
    width: CARD_WIDTH,
  },
  cardList: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerHigh,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ROUNDNESS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgePublic: {
    backgroundColor: '#d1fae5',
  },
  badgePrivate: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextPublic: {
    color: '#065f46',
  },
  badgeTextPrivate: {
    color: '#92400e',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: 4,
    minHeight: 32,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: ROUNDNESS.full,
    marginRight: 6,
  },
  instructorName: {
    ...TYPOGRAPHY.label,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  learnersText: {
    fontSize: 12,
    color: COLORS.outline,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 8,
  },
  actionIconPrimary: {
    fontSize: 16,
    color: COLORS.primary,
  },
  actionIconDanger: {
    fontSize: 16,
  },
});

export default AdminCourseList;
