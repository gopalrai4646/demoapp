import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Dashboard from '../screens/Dashboard';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import Account from '../screens/AccountScreen';
import AdminCourseStack from './AdminCourseStack';
import { AdminTrainingPlanStack } from './AdminTrainingPlanStack';
import UserCourseStack from './UserCourseStack';
import UserTrainingPlanStack from './UserTrainingPlanStack';
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
  GraduationCap,
  ClipboardList
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
        component={isAdmin ? AdminDashboardScreen : Dashboard}
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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Courses', {
              screen: isAdmin ? 'AdminCourseList' : 'UserCourses',
            });
          },
        })}
      />
      <Tab.Screen
        name="Plans"
        component={isAdmin ? AdminTrainingPlanStack : UserTrainingPlanStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Plans',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <ClipboardList size={size} color={color} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Plans', {
              screen: isAdmin ? 'AdminTrainingPlanList' : 'UserTrainingPlanList',
            });
          },
        })}
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
