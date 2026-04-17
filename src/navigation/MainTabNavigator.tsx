import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Dashboard from '../screens/Dashboard';
import Account from '../screens/AccountScreen';
import AdminCourseStack from './AdminCourseStack';
import { AdminTrainingPlanStack } from './AdminTrainingPlanStack';
import UserCoursesScreen from '../screens/UserCoursesScreen';
import { PlansScreen } from '../screens/Placeholders';
import { MainTabParamList } from './types';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { AppHeader } from '../components/AppHeader';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const { role } = useSelector((state: RootState) => state.auth);
  const isAdmin = role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.outlineVariant,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Text style={{ color, fontSize: 20 }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={isAdmin ? AdminCourseStack : UserCoursesScreen}
        options={{
          headerShown: !isAdmin, // Show header for user screen, hide for admin stack (since it has its own)
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Text style={{ color, fontSize: 20 }}>📚</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Plans"
        component={isAdmin ? AdminTrainingPlanStack : PlansScreen}
        options={{
          headerShown: !isAdmin, // Show header for user screen, hide for admin stack (since it has its own Header built internally if needed or we use AppHeader) Wait, in AdminCourseStack we hid the stack headers and depended on AppHeader. Oh wait, my AppHeader is globally set on the Tab!
          tabBarLabel: 'Plans',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Text style={{ color, fontSize: 20 }}>📝</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Text style={{ color, fontSize: 20 }}>👤</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
