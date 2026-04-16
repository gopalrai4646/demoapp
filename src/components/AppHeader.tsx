import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS, SPACING, ROUNDNESS } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '../navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleProfilePress = () => {
    navigation.navigate('Account');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.content}>
        {/* Left: Logo Only */}
        <View style={styles.logoContainer}>
          <Image
            source={MENTORA_LOGO}
            style={styles.logoIcon}
            resizeMode="contain"
          />
        </View>

        {/* Right: Profile Picture */}
        <TouchableOpacity 
          style={styles.profileContainer} 
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitial}>
                {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: SPACING.md,
    paddingBottom: 12,
    height: 60,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    height: 44,
    width: 150,
    marginLeft: -25,
  },
  profileContainer: {
    width: 38,
    height: 38,
    borderRadius: ROUNDNESS.full,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: '#e0e0ef',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
