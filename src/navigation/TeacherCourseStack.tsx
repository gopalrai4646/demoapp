import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeacherCourseStackParamList } from './types';
import TeacherCourseList from '../screens/TeacherCourseList';
import TeacherCourseDetails from '../screens/TeacherCourseDetails';

const Stack = createNativeStackNavigator<TeacherCourseStackParamList>();

const TeacherCourseStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherCourseList" component={TeacherCourseList} />
      <Stack.Screen name="TeacherCourseDetails" component={TeacherCourseDetails} />
    </Stack.Navigator>
  );
};

export default TeacherCourseStack;
