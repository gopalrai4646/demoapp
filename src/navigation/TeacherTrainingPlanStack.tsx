import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TeacherTrainingPlanStackParamList } from './types';
import { TeacherTrainingPlanList } from '../screens/TeacherTrainingPlanList';
import { TeacherTrainingPlanDetails } from '../screens/TeacherTrainingPlanDetails';

const Stack = createNativeStackNavigator<TeacherTrainingPlanStackParamList>();

export const TeacherTrainingPlanStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="TeacherTrainingPlanList" component={TeacherTrainingPlanList} />
      <Stack.Screen name="TeacherTrainingPlanDetails" component={TeacherTrainingPlanDetails} />
    </Stack.Navigator>
  );
};
