import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherUserList from '../screens/TeacherUserList';
import TeacherUserDetailsScreen from '../screens/TeacherUserDetailsScreen';
import { TeacherUserStackParamList } from './types';

const Stack = createNativeStackNavigator<TeacherUserStackParamList>();

const TeacherUserStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherUserList" component={TeacherUserList} />
      <Stack.Screen name="TeacherUserDetails" component={TeacherUserDetailsScreen} />
    </Stack.Navigator>
  );
};

export default TeacherUserStack;
