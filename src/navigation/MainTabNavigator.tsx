import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Dashboard from '../screens/Dashboard';
import Account from '../screens/AccountScreen';
import AdminCourseStack from './AdminCourseStack';
import { AdminTrainingPlanStack } from './AdminTrainingPlanStack';
import UserCourseStack from './UserCourseStack';
import { PlansScreen } from '../screens/Placeholders';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import { MainTabParamList } from './types';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { AppHeader } from '../components/AppHeader';
import { 
  BarChart2, 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  Users, 
  GraduationCap 
} from 'lucide-react-native';

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
          tabBarLabel: isAdmin ? 'Reports' : 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              {isAdmin ? <BarChart2 size={size} color={color} /> : <LayoutDashboard size={size} color={color} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={isAdmin ? AdminCourseStack : UserCourseStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <BookOpen size={size} color={color} />
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
      {isAdmin && (
        <Tab.Screen
          name="Users"
          component={AdminUsersScreen}
          options={{
            tabBarLabel: 'Users',
            tabBarIcon: ({ color, size }) => (
              <View style={styles.iconContainer}>
                <Users size={size} color={color} />
              </View>
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          tabBarLabel: isAdmin ? 'Settings' : 'Account',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              {isAdmin ? <Settings size={size} color={color} /> : <GraduationCap size={size} color={color} />}
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
