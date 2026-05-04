import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserCoursesScreen from '../screens/UserCoursesScreen';
import CoursePlayerScreen from '../screens/CoursePlayerScreen';
import { UserCourseStackParamList } from './types';

const Stack = createNativeStackNavigator<UserCourseStackParamList>();

const UserCourseStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserCourses" component={UserCoursesScreen} />
      <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
    </Stack.Navigator>
  );
};

export default UserCourseStack;
