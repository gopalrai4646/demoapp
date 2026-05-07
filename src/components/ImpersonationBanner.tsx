import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, UserCircle } from 'lucide-react-native';
import { RootState } from '../store';
import { stopImpersonationRequest } from '../store/slices/authSlice';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDNESS } from '../constants/Theme';
import { BRANDING } from '../constants/Branding';

const ImpersonationBanner = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { isImpersonating, user } = useSelector((state: RootState) => state.auth);

  if (!isImpersonating) return null;

  const handleStopImpersonation = () => {
    dispatch(stopImpersonationRequest());
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        backgroundColor: BRANDING.BRAND_BLUE,
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.userInfo}>
          <UserCircle size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.text}>
            IMPERSONATING: <Text style={styles.userName}>{user?.displayName?.toUpperCase() || 'USER'}</Text>
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleStopImpersonation}
          activeOpacity={0.8}
        >
          <X size={16} color={BRANDING.BRAND_BLUE} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Inter-Black' : 'sans-serif-black',
  },
  userName: {
    textDecorationLine: 'underline',
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImpersonationBanner;
