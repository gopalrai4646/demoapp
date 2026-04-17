import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, Modal, Pressable } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '../navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { logoutRequest } from '../store/slices/authSlice';

export const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, role } = useSelector((state: RootState) => state.auth);
  
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleProfileSection = () => {
    setMenuVisible(false);
    navigation.navigate('Account');
  };

  const handleSignOut = () => {
    setMenuVisible(false);
    dispatch(logoutRequest());
  };

  return (
    <>
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
            onPress={toggleMenu}
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

      {/* Profile Dropdown Menu */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={[styles.menuContainer, { top: insets.top + 65 }]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuLabel}>Signed in as</Text>
              <Text style={styles.menuEmail}>{user?.email || 'Guest'}</Text>
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuItem}>
              <Text style={styles.menuLabel}>Current Role</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role?.toUpperCase() || 'USER'}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuAction} onPress={handleProfileSection}>
              <Text style={styles.menuActionText}>👤 Profile Section</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuAction, styles.signOutAction]} onPress={handleSignOut}>
              <Text style={[styles.menuActionText, { color: '#ef4444' }]}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
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
    zIndex: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuContainer: {
    position: 'absolute',
    right: SPACING.md,
    backgroundColor: '#fff',
    width: 200,
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  menuHeader: {
    marginBottom: SPACING.sm,
  },
  menuLabel: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  menuEmail: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginVertical: SPACING.sm,
  },
  menuItem: {
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ROUNDNESS.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  menuAction: {
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  signOutAction: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
    marginTop: SPACING.xs,
    paddingTop: SPACING.md,
  },
});
