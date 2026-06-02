import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/SplashScreen';

const RootNavigator = () => {
  const { user, initializing } = useSelector((state: RootState) => state.auth);
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  const handleSplashComplete = () => {
    setIsSplashComplete(true);
  };

  if (initializing || !isSplashComplete) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }
  
  return user ? <MainTabNavigator /> : <AuthStack />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFF',
  },
});

export default RootNavigator;
