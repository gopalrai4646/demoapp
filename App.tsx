/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './src/store';
import { RootState } from './src/store';
import { restoreSessionRequest, setInitializing } from './src/store/slices/authSlice';
import auth from '@react-native-firebase/auth';
import { COLORS } from './src/constants/Theme';
import RootNavigator from './src/navigation/RootNavigator';
import ImpersonationBanner from './src/components/ImpersonationBanner';
import './src/i18n';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useSessionManager } from './src/hooks/useSessionManager';

const StatusBarBackground = () => {
  const insets = useSafeAreaInsets();
  const isImpersonating = useSelector((state: RootState) => state.auth.isImpersonating);
  
  if (isImpersonating) return null;

  return (
    <View style={{ 
      height: insets.top, 
      backgroundColor: COLORS.background, 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100 
    }} />
  );
};

export const navigationRef = createNavigationContainerRef();

GoogleSignin.configure({
  webClientId: '146404897369-4h5do7cgdo0hi4csl5t48nr9u3tqfkan.apps.googleusercontent.com',
  offlineAccess: true,
});

const AppContent = () => {
  useSessionManager();
  const dispatch = useDispatch();
  const [currentRoute, setCurrentRoute] = useState<string>();
  const isImpersonating = useSelector((state: RootState) => state.auth.isImpersonating);
  const isSpecialScreen = currentRoute === 'CoursePlayer' || currentRoute === 'UserTrainingPlanDetails';

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        dispatch(restoreSessionRequest(user));
      } else {
        dispatch(setInitializing(false));
      }
    });
    return unsubscribe;
  }, [dispatch]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isImpersonating ? 'light-content' : (isSpecialScreen ? 'light-content' : 'dark-content')}
        backgroundColor="transparent"
        translucent={true}
      />
      {!isSpecialScreen && <StatusBarBackground />}
      <ImpersonationBanner />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          setCurrentRoute(navigationRef.getCurrentRoute()?.name);
        }}
        onStateChange={async () => {
          setCurrentRoute(navigationRef.getCurrentRoute()?.name);
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
