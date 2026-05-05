import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTrainingPlanScreen from '../screens/UserTrainingPlanScreen';
import UserTrainingPlanDetailsScreen from '../screens/UserTrainingPlanDetailsScreen';

export type UserTrainingPlanStackParamList = {
  UserTrainingPlanList: undefined;
  UserTrainingPlanDetails: { planId: string };
};

const Stack = createNativeStackNavigator<UserTrainingPlanStackParamList>();

const UserTrainingPlanStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTrainingPlanList" component={UserTrainingPlanScreen} />
      <Stack.Screen name="UserTrainingPlanDetails" component={UserTrainingPlanDetailsScreen} />
    </Stack.Navigator>
  );
};

export default UserTrainingPlanStack;
