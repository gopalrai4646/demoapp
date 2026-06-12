import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Dimensions, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TeacherTrainingPlanStackParamList } from '../navigation/types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTranslation } from 'react-i18next';
import { fetchTrainingPlansRequest, deleteTrainingPlanRequest, TrainingPlan } from '../store/slices/trainingPlanSlice';
import {
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  ClipboardList,
  Pencil,
  Trash2,
  Layers
} from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<TeacherTrainingPlanStackParamList, 'TeacherTrainingPlanList'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - SPACING.md * 1.5;

export const TeacherTrainingPlanList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { trainingPlans, loading } = useSelector((state: RootState) => state.trainingPlans);
  const { user } = useSelector((state: RootState) => state.auth);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchTrainingPlansRequest());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSearchVisible(false);
        setSearchQuery('');
      };
    }, [])
  );

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      t('adminPlans.deleteTitle') || 'Delete Training Plan',
      (t('adminPlans.deleteConfirm', { title }) || `Are you sure you want to delete ${title}?`),
      [
        { text: t('adminPlans.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('adminPlans.delete') || 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteTrainingPlanRequest(id))
        },
      ]
    );
  };

  const filteredPlans = trainingPlans.filter(c => {
    if (c.createdBy !== user?.uid) return false;

    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      const matchTitle = c.name.toLowerCase().includes(query);
      const matchDesc = c.description.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const renderPlanCard = ({ item }: { item: TrainingPlan }) => {
    const isGrid = viewMode === 'grid';
    const courseCount = item.courseIds?.length || 0;

    return (
      <View style={[styles.cardContainer, isGrid ? styles.cardGrid : styles.cardList]}>
        <View style={[styles.imageContainer, isGrid ? { height: 120 } : { height: 160 }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: COLORS.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' }]}>
              <ClipboardList size={40} color={COLORS.outlineVariant} />
            </View>
          )}
          <View style={[styles.badge, styles.badgePublic]}>
            <Layers size={10} color="#065f46" />
            <Text style={[styles.badgeText, styles.badgeTextPublic]}>
              {(t('adminPlans.coursesBadge', { count: courseCount }) || `${courseCount} courses`)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>

          <Text style={styles.learnersText} numberOfLines={2}>{item.description}</Text>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('TeacherTrainingPlanDetails', { planId: item.id })}
            >
              <Pencil size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item.id, item.name)}
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
      
      <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
        <Text style={TYPOGRAPHY.headline}>{t('adminPlans.managePlans') || 'My Training Plans'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={{ padding: 8, marginRight: 8 }}>
            <Search size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('TeacherTrainingPlanDetails', {})}
          >
            <Plus size={24} color={COLORS.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {isSearchVisible && (
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('adminPlans.searchPlaceholder') || 'Search plans...'}
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {loading && trainingPlans.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ListHeaderComponent={
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
                  <ListIcon size={16} color={viewMode === 'list' ? COLORS.primary : COLORS.outline} />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemCountText}>{(t('adminPlans.showingCount', { count: filteredPlans.length }) || `Showing ${filteredPlans.length} plans`)}</Text>
            </View>
          }
          key={viewMode}
          data={filteredPlans}
          keyExtractor={item => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          renderItem={renderPlanCard}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridColumnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: COLORS.outline }}>{t('adminPlans.noPlans') || 'No plans found'}</Text>
            </View>
          }
        />
      )}
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
  itemCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.outline,
  },
  listContent: {
    padding: SPACING.md,
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
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextPublic: {
    color: '#065f46',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    ...TYPOGRAPHY.cardTitle,
    marginBottom: 4,
    minHeight: 32,
  },
  learnersText: {
    fontSize: 12,
    color: COLORS.outline,
    marginBottom: 10,
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
});
