import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminCourseStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<AdminCourseStackParamList, 'AdminCourseList'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - SPACING.md * 1.5;

interface Course {
  id: string;
  title: string;
  instructor: string;
  learners: number;
  isPublic: boolean;
  cover: string;
  avatar: string;
}

const DUMMY_COURSES: Course[] = [
  { 
    id: '1', 
    title: 'Advanced Visual Design Systems', 
    instructor: 'Dr. Aris Thorne', 
    learners: 1420, 
    isPublic: true, 
    cover: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&q=80&w=600',
    avatar: 'https://i.pravatar.cc/100?img=11'
  },
  { 
    id: '2', 
    title: 'Enterprise Security Architecture', 
    instructor: 'Sarah Jenkins', 
    learners: 892, 
    isPublic: false, 
    cover: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600',
    avatar: 'https://i.pravatar.cc/100?img=5'
  },
  { 
    id: '3', 
    title: 'Mastering Business Intelligence', 
    instructor: 'Marc Russo', 
    learners: 2105, 
    isPublic: true, 
    cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
    avatar: 'https://i.pravatar.cc/100?img=14'
  },
  { 
    id: '4', 
    title: 'Full-Stack Web Development', 
    instructor: 'Elena Rodriguez', 
    learners: 4500, 
    isPublic: true, 
    cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
    avatar: 'https://i.pravatar.cc/100?img=9'
  },
];

const AdminCourseList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = DUMMY_COURSES.filter(c => {
    if (filter === 'public' && !c.isPublic) return false;
    if (filter === 'private' && c.isPublic) return false;
    if (searchQuery.length > 0 && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const renderCourseCard = ({ item }: { item: Course }) => {
    const isGrid = viewMode === 'grid';
    return (
      <View style={[styles.cardContainer, isGrid ? styles.cardGrid : styles.cardList]}>
        <View style={[styles.imageContainer, isGrid ? { height: 120 } : { height: 160 }]}>
          <Image source={{ uri: item.cover }} style={styles.coverImage} />
          <View style={[styles.badge, item.isPublic ? styles.badgePublic : styles.badgePrivate]}>
            <Text style={[styles.badgeText, item.isPublic ? styles.badgeTextPublic : styles.badgeTextPrivate]}>
              {item.isPublic ? 'PUBLIC' : 'PRIVATE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.instructorRow}>
            <Image source={{ uri: item.avatar }} style={styles.avatarMini} />
            <Text style={styles.instructorName} numberOfLines={1}>{item.instructor}</Text>
          </View>
          
          <Text style={styles.learnersText}>👤 {item.learners.toLocaleString()} learners</Text>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('AdminCourseDetails', { courseId: item.id })}
            >
              <Text style={styles.actionIconPrimary}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIconDanger}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
        <Text style={TYPOGRAPHY.headline}>Manage Courses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminCourseDetails', {})}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search courses, instructors..."
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
            <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>⊞ Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>≡ List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersWrapper}>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'public' && styles.filterChipActive]}
            onPress={() => setFilter('public')}
          >
            <Text style={[styles.filterText, filter === 'public' && styles.filterTextActive]}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'private' && styles.filterChipActive]}
            onPress={() => setFilter('private')}
          >
            <Text style={[styles.filterText, filter === 'private' && styles.filterTextActive]}>Private</Text>
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
    paddingBottom: SPACING.md,
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
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.md,
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
    paddingBottom: 100,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
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
    padding: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: 8,
    minHeight: 40,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  learnersText: {
    fontSize: 12,
    color: COLORS.outline,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest,
    paddingTop: 12,
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
