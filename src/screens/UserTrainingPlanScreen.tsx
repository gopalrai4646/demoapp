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
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectAssignedPlans } from '../store/selectors';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, BookOpen } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchTrainingPlansRequest } from '../store/slices/trainingPlanSlice';

const { width } = Dimensions.get('window');

const UserTrainingPlanScreen = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const trainingPlans = useAppSelector(selectAssignedPlans);
  const loading = useAppSelector(state => state.trainingPlans.loading);

  React.useEffect(() => {
    dispatch(fetchTrainingPlansRequest());
  }, [dispatch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userPlans.title')}</Text>
        <Text style={styles.subtitle}>
          {t('userPlans.subtitle')}
        </Text>
      </View>

      {trainingPlans.length > 0 ? (
        trainingPlans.map((plan) => (
          <TouchableOpacity 
            key={plan.id} 
            style={styles.card}
            onPress={() => {
              navigation.navigate('UserTrainingPlanDetails', { planId: plan.id });
            }}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: plan.image || 'https://via.placeholder.com/400x200' }} 
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('userPlans.coursesCount', { count: plan.courseIds?.length || 0 })}</Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.description} numberOfLines={3}>
                {plan.description}
              </Text>
              
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.viewLink}
                  onPress={() => {
                    navigation.navigate('UserTrainingPlanDetails', { planId: plan.id });
                  }}
                >
                  <Text style={styles.viewLinkText}>{t('userPlans.viewPlan')}</Text>
                  <ArrowRight size={16} color="#4f46e5" style={styles.arrowIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={COLORS.onSurfaceVariant} opacity={0.5} />
          <Text style={styles.emptyText}>{t('userPlans.noPlans')}</Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 28,
  },
  subtitle: {
    ...TYPOGRAPHY.subHeadline,
    color: COLORS.secondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  infoContainer: {
    padding: 24,
  },
  planName: {
    ...TYPOGRAPHY.headline,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 4,
  },
  description: {
    ...TYPOGRAPHY.subHeadline,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4f46e5',
    marginRight: 6,
  },
  arrowIcon: {
    marginTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
});

export default UserTrainingPlanScreen;
