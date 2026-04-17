import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminTrainingPlanStackParamList } from './types';
import { AdminTrainingPlanList } from '../screens/AdminTrainingPlanList';
import { AdminTrainingPlanDetails } from '../screens/AdminTrainingPlanDetails';

const Stack = createNativeStackNavigator<AdminTrainingPlanStackParamList>();

export const AdminTrainingPlanStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="AdminTrainingPlanList" component={AdminTrainingPlanList} />
      <Stack.Screen name="AdminTrainingPlanDetails" component={AdminTrainingPlanDetails} />
    </Stack.Navigator>
  );
};
