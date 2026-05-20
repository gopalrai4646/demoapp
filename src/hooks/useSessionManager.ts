import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { logoutRequest } from '../store/slices/authSlice';
import { RootState } from '../store';

const LAST_ACTIVE_KEY = '@last_active_timestamp';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useSessionManager = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const appState = useRef(AppState.currentState);

  const checkSession = async () => {
    try {
      if (!user) return; // Only check if logged in via Redux

      const lastActiveStr = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      const now = Date.now();

      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (now - lastActive > SEVEN_DAYS_MS) {
          // User has been inactive for more than 7 days, log them out
          await auth().signOut();
          dispatch(logoutRequest());
          await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
          return;
        }
      }
      
      // Update last active time
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toString());
    } catch (error) {
      console.error('Session Manager Error:', error);
    }
  };

  useEffect(() => {
    // Check when the app first mounts
    checkSession();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkSession();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]); // Re-run if user login state changes
};
