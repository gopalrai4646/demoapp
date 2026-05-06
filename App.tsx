/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { COLORS } from './src/constants/Theme';
import RootNavigator from './src/navigation/RootNavigator';

const StatusBarBackground = () => {
  const insets = useSafeAreaInsets();
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

function App() {
  const [currentRoute, setCurrentRoute] = useState<string>();

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={currentRoute === 'CoursePlayer' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
        {currentRoute !== 'CoursePlayer' && <StatusBarBackground />}
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
    </Provider>
  );
}

export default App;
