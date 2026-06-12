import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { 
  Settings, 
  GraduationCap, 
  Shield, 
  PlaySquare, 
  ListTodo,
  ChevronRight
} from 'lucide-react-native';
import { MenuStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<MenuStackParamList, 'MenuScreen'>;

const MenuScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { role, user } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();

  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';

  const renderMenuItem = (
    title: string, 
    icon: React.ReactNode, 
    screenName: keyof MenuStackParamList,
    description?: string
  ) => {
    return (
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate(screenName as any)}
      >
        <View style={styles.menuIconContainer}>
          {icon}
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {description && <Text style={styles.menuDescription}>{description}</Text>}
        </View>
        <ChevronRight size={20} color={COLORS.outline} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>{t('tabs.menu') || 'More'}</Text>
        
        <View style={styles.section}>
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>{t('menuScreen.administration') || 'Administration'}</Text>
              <View style={styles.card}>
                {renderMenuItem(t('menuScreen.teacherApprovals') || 'Teacher Approvals', <GraduationCap size={22} color={COLORS.primary} />, 'Teachers', t('menuScreen.teacherApprovalsDesc') || 'Review and approve teacher applications')}
                <View style={styles.divider} />
                {renderMenuItem(t('menuScreen.staffRoles') || 'Staff Roles', <Shield size={22} color={COLORS.primary} />, 'StaffRoles', t('menuScreen.staffRolesDesc') || 'Manage staff permissions and access')}
              </View>
            </>
          )}

          {isTeacher && (
            <>
              <Text style={styles.sectionTitle}>{t('menuScreen.assignedToMe') || 'Assigned to Me'}</Text>
              <View style={styles.card}>
                {user?.enrolledCourses && user.enrolledCourses.length > 0 && (
                  <>
                    {renderMenuItem(t('menuScreen.assignedLectures') || 'Assigned Lectures', <PlaySquare size={22} color={COLORS.primary} />, 'AssignedCourses', t('menuScreen.assignedLecturesDesc') || 'View courses assigned to you')}
                    <View style={styles.divider} />
                  </>
                )}
                {user?.assignedTrainingPlans && user.assignedTrainingPlans.length > 0 && (
                  renderMenuItem(t('menuScreen.assignedTraining') || 'Assigned Training', <ListTodo size={22} color={COLORS.primary} />, 'AssignedPlans', t('menuScreen.assignedTrainingDesc') || 'View your assigned training plans')
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('menuScreen.settings') || 'Settings'}</Text>
          <View style={styles.card}>
            {renderMenuItem(
              t('menuScreen.accountSettings') || 'Account Settings', 
              <Settings size={22} color={COLORS.primary} />, 
              'Account',
              t('menuScreen.accountSettingsDesc') || 'Manage your profile and preferences'
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.onSurface,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 72, // Aligns with text
  },
});

export default MenuScreen;
