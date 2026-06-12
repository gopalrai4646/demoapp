import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store';
import Dashboard from '../screens/Dashboard';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import Account from '../screens/AccountScreen';
import AdminCourseStack from './AdminCourseStack';
import { AdminTrainingPlanStack } from './AdminTrainingPlanStack';
import UserCourseStack from './UserCourseStack';
import UserTrainingPlanStack from './UserTrainingPlanStack';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminStaffRolesScreen from '../screens/AdminStaffRolesScreen';
import AdminTeachersScreen from '../screens/AdminTeachersScreen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import TeacherCourseStack from './TeacherCourseStack';
import { TeacherTrainingPlanStack } from './TeacherTrainingPlanStack';
import TeacherUserStack from './TeacherUserStack';
import MenuStack from './MenuStack';
import { MainTabParamList } from './types';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { 
  BarChart2, 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  Users, 
  GraduationCap,
  ClipboardList,
  Shield,
  PlaySquare,
  ListTodo,
  Menu as MenuIcon
} from 'lucide-react-native';
import { hasModuleAccess, Permission } from '../constants/permissions';

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

const CustomTabBar = ({ state, descriptors, navigation, insets, t, isAdmin }: any) => {
  const activeRoute = state.routes[state.index];
  const activeOptions = descriptors[activeRoute.key]?.options;
  
  if (activeOptions?.tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const Icon = options.tabBarIcon;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {isFocused && <View style={styles.activeIndicator} />}
              {Icon && Icon({
                focused: isFocused,
                color: isFocused ? COLORS.primary : COLORS.onSurfaceVariant,
                size: 24,
              })}
            </View>
            <Text 
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.tabLabel,
                { color: isFocused ? COLORS.primary : COLORS.onSurfaceVariant }
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabNavigator = () => {
  const { role, permissions, user } = useSelector((state: RootState) => state.auth);
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isTeacher = role === 'teacher';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Students always see Courses & Plans (user versions).
  // Staff only see them if admin granted matching module permissions.
  // Admins always see everything.
  // Teachers see Dashboard, manage their own courses, and see assigned plans.
  const isStudent = !isAdmin && !isStaff && !isTeacher;
  const canSeeAdminDashboard = isAdmin || (isStaff && hasModuleAccess(permissions as Permission[], 'dashboard'));
  const canSeeDashboard = isStudent || canSeeAdminDashboard || isTeacher;
  const canSeeCourses = isAdmin || isStudent || isTeacher || (isStaff && hasModuleAccess(permissions as Permission[], 'courses'));
  const canSeePlans = isAdmin || isStudent || isTeacher || (isStaff && hasModuleAccess(permissions as Permission[], 'training_plans'));
  const canSeeUsers = isAdmin || isTeacher || (isStaff && hasModuleAccess(permissions as Permission[], 'users'));

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => (
        <CustomTabBar 
          {...props} 
          insets={insets} 
          t={t} 
          isAdmin={isAdmin} 
        />
      )}
      screenOptions={{
        swipeEnabled: false,
        lazy: true,
      }}
    >
      {canSeeDashboard && (
        <Tab.Screen
          name="Dashboard"
          component={isTeacher ? TeacherDashboardScreen : (canSeeAdminDashboard ? AdminDashboardScreen : Dashboard)}
          options={{
            tabBarLabel: canSeeAdminDashboard ? t('tabs.reports') : t('tabs.dashboard'),
            tabBarIcon: ({ color }) => (
              canSeeAdminDashboard ? <BarChart2 size={24} color={color} /> : <LayoutDashboard size={24} color={color} />
            ),
          }}
        />
      )}
      {canSeeCourses && (
        <Tab.Screen
          name="Courses"
          component={isTeacher ? TeacherCourseStack : (isAdmin || isStaff ? AdminCourseStack : UserCourseStack)}
          options={{
            tabBarLabel: t('tabs.courses'),
            tabBarIcon: ({ color }) => (
              <BookOpen size={24} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Courses', {
                screen: isTeacher ? 'TeacherCourseList' : (isAdmin || isStaff ? 'AdminCourseList' : 'UserCourses'),
              });
            },
          })}
        />
      )}
      {canSeePlans && (
        <Tab.Screen
          name="Plans"
          component={isTeacher ? TeacherTrainingPlanStack : (isAdmin || isStaff ? AdminTrainingPlanStack : UserTrainingPlanStack)}
          options={{
            tabBarLabel: t('tabs.plans'),
            tabBarIcon: ({ color }) => (
              <ClipboardList size={24} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Plans', {
                screen: isTeacher ? 'TeacherTrainingPlanList' : (isAdmin || isStaff ? 'AdminTrainingPlanList' : 'UserTrainingPlanList'),
              });
            },
          })}
        />
      )}

      {canSeeUsers && (
        <Tab.Screen
          name="Users"
          component={isTeacher ? TeacherUserStack : AdminUsersScreen}
          options={{
            tabBarLabel: t('tabs.users'),
            tabBarIcon: ({ color }) => (
              <Users size={24} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (isTeacher) {
                e.preventDefault();
                navigation.navigate('Users', {
                  screen: 'TeacherUserList',
                });
              }
            },
          })}
        />
      )}

      {/* Admin and Teacher Menu Tab */}
      {(isAdmin || isTeacher || isStaff) && (
        <Tab.Screen
          name="Menu"
          component={MenuStack}
          options={{
            tabBarLabel: t('tabs.menu') || 'More',
            tabBarIcon: ({ color }) => (
              <MenuIcon size={24} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Menu', {
                screen: 'MenuScreen',
              });
            },
          })}
        />
      )}

      {/* Student Account Tab (Admins/Teachers access account from Menu) */}
      {isStudent && (
        <Tab.Screen
          name="Account"
          component={Account}
          options={{
            tabBarLabel: t('tabs.account'),
            tabBarIcon: ({ color }) => (
              <GraduationCap size={24} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: -4,
  },
});

export default MainTabNavigator;

