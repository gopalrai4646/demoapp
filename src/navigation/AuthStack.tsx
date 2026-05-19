import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingPage from '../screens/LandingPage';
import Login from '../screens/Login';
import CreateAccount from '../screens/CreateAccount';
import ResetPassword from '../screens/ResetPassword';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="Landing" component={LandingPage} />
      <Stack.Screen name="Login" component={Login} options={{ gestureEnabled: false }} />
      <Stack.Screen name="CreateAccount" component={CreateAccount} options={{ gestureEnabled: false }} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
};

export default AuthStack;
