import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuStackParamList } from './types';
import MenuScreen from '../screens/MenuScreen';
import AdminTeachersScreen from '../screens/AdminTeachersScreen';
import AdminStaffRolesScreen from '../screens/AdminStaffRolesScreen';
import UserCourseStack from './UserCourseStack';
import UserTrainingPlanStack from './UserTrainingPlanStack';
import AccountScreen from '../screens/AccountScreen';
import { COLORS } from '../constants/Theme';

const Stack = createNativeStackNavigator<MenuStackParamList>();

export const MenuStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="MenuScreen" component={MenuScreen} />
      <Stack.Screen name="Teachers" component={AdminTeachersScreen} />
      <Stack.Screen name="StaffRoles" component={AdminStaffRolesScreen} />
      <Stack.Screen name="AssignedCourses" component={UserCourseStack} />
      <Stack.Screen name="AssignedPlans" component={UserTrainingPlanStack} />
      <Stack.Screen name="Account" component={AccountScreen} />
    </Stack.Navigator>
  );
};

export default MenuStack;
