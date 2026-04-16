import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPasswordRequest, clearError } from '../store/slices/authSlice';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

const ResetPassword = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Track success state
  useEffect(() => {
    if (isRequesting && !loading && !error) {
      setIsSubmitted(true);
      setIsRequesting(false);
    } else if (error) {
      setIsRequesting(false);
    }
  }, [loading, error, isRequesting]);

  const handleInputChange = (val: string) => {
    setEmail(val);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleReset = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    dispatch(forgotPasswordRequest({ email }));
    setIsRequesting(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Decorative Background Elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + SPACING.sm },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Brand Identity */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={MENTORA_LOGO}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a link to reset your password.
          </Text>
        </View>

        {/* Reset Form / Success State */}
        <View style={styles.formContainer}>
          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIndicator} />
              <Text style={styles.successText}>
                Success! Check your email for a password reset link.
              </Text>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={handleInputChange}
                />
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>
          )}

          {!isSubmitted && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.footerLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              {isSubmitted ? 'Return to login' : 'Back to Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(98, 73, 178, 0.05)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.onSurfaceVariant,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  logo: {
    height: 64,
    width: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: ROUNDNESS.full,
    paddingHorizontal: SPACING.md,
    height: 64,
  },
  inputIcon: {
    fontSize: 20,
    color: COLORS.outline,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 14,
  },
  errorText: {
    color: '#ba1a1a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: ROUNDNESS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  successIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: '#2E7D32',
    marginRight: SPACING.md,
    borderRadius: 2,
  },
  successText: {
    flex: 1,
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  resetButton: {
    height: 64,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
  },
  resetButtonText: {
    color: COLORS.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  footerLink: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    padding: SPACING.sm,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ResetPassword;
