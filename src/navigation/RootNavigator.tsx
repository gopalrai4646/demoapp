import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

const RootNavigator = () => {
  const { user, loading } = useSelector((state: RootState) => state.auth);

  // If we wanted to show a splash screen while loading the initial session,
  // we could do it here. For now, we'll just show the AuthStack if no user.
  
  return user ? <MainTabNavigator /> : <AuthStack />;
};

export default RootNavigator;
