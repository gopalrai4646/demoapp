import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminCourseStackParamList } from './types';
import AdminCourseList from '../screens/AdminCourseList';
import AdminCourseDetails from '../screens/AdminCourseDetails';

// Stack defined for Course Admin navigation
const Stack = createNativeStackNavigator<AdminCourseStackParamList>();

const AdminCourseStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminCourseList" component={AdminCourseList} />
      <Stack.Screen name="AdminCourseDetails" component={AdminCourseDetails} />
    </Stack.Navigator>
  );
};

export default AdminCourseStack;
