import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, Modal, Pressable, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '../navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { logoutRequest } from '../store/slices/authSlice';
import { LanguageSelector } from './LanguageSelector';

export const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, role } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  
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
      <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
        <View style={styles.content}>
          {/* Left: Logo Only */}
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
          >
            <Image
              source={MENTORA_LOGO}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Right: Language Selector + Profile Picture */}
          <View style={styles.rightSection}>
            <LanguageSelector topOffset={insets.top + 55} />
            
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
      </View>

      {/* Profile Dropdown Menu */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleMenu}>
            <View style={[styles.menuContainer, { top: insets.top + 55 }]}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuLabel}>{t('common.signedInAs')}</Text>
                <Text style={styles.menuEmail}>{user?.email || t('common.guest')}</Text>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.menuItem}>
                <Text style={styles.menuLabel}>{t('common.currentRole')}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role?.toUpperCase() || 'USER'}</Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuAction} onPress={handleProfileSection}>
                <Text style={styles.menuActionText}>👤 {t('common.profileSection')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuAction, styles.signOutAction]} onPress={handleSignOut}>
                <Text style={[styles.menuActionText, { color: '#ef4444' }]}>🚪 {t('common.signOut')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      zIndex: 10,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 0,
      paddingRight: SPACING.md,
      paddingBottom: 4,
      height: 50,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoIcon: {
      height: 36,
      width: 130,
      marginLeft: -20,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
      width: 160,
      borderRadius: ROUNDNESS.lg,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: COLORS.surfaceContainer,
    },
    menuHeader: {
      marginBottom: 6,
    },
    menuLabel: {
      fontSize: 8,
      color: COLORS.outline,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    menuEmail: {
      fontSize: 12,
      color: COLORS.onSurface,
      fontWeight: '600',
    },
    menuDivider: {
      height: 1,
      backgroundColor: COLORS.surfaceContainer,
      marginVertical: 6,
    },
    menuItem: {
      marginBottom: 6,
    },
    roleBadge: {
      backgroundColor: COLORS.secondaryContainer,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: ROUNDNESS.sm,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    roleText: {
      fontSize: 9,
      fontWeight: '800',
      color: COLORS.primary,
    },
    menuAction: {
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuActionText: {
      fontSize: 12,
      fontWeight: '500',
      color: COLORS.onSurface,
    },
    signOutAction: {
      borderTopWidth: 1,
      borderTopColor: COLORS.surfaceContainer,
      marginTop: 2,
      paddingTop: 8,
    },
  });


