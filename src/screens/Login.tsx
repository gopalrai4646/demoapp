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
import { loginRequest, googleLoginRequest, clearError } from '../store/slices/authSlice';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight 
} from 'lucide-react-native';

const Login = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleInputChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    dispatch(loginRequest({ email, pass: password }));
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
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Brand Identity */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => navigation.navigate('Landing')}
            activeOpacity={0.7}
          >
            <Image
              source={MENTORA_LOGO}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your journey with your mentor.
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={COLORS.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={COLORS.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => handleInputChange(setEmail, val)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.outline} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.outline}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => handleInputChange(setPassword, val)}
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.outline} />
                ) : (
                  <Eye size={20} color={COLORS.outline} />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => navigation.navigate('ResetPassword')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.onPrimary} />
            ) : (
              <View style={styles.signInButtonContent}>
                <Text style={styles.signInText}>Sign In</Text>
                <ArrowRight size={20} color={COLORS.onPrimary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity 
            style={styles.googleButton} 
            activeOpacity={0.7}
            onPress={() => dispatch(googleLoginRequest())}
            disabled={loading}
          >
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={styles.signUpLink} 
              onPress={() => navigation.navigate('CreateAccount')}
            >
              Sign up now
            </Text>
          </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
    maxWidth: 240,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
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
  visibilityButton: {
    position: 'absolute',
    right: 20,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    paddingRight: SPACING.md,
  },
  forgotText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  errorText: {
    color: '#ba1a1a',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  signInButton: {
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
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInText: {
    color: COLORS.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(119, 117, 135, 0.1)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    marginHorizontal: SPACING.md,
    letterSpacing: 2,
  },
  googleButton: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(119, 117, 135, 0.2)',
    borderRadius: ROUNDNESS.full,
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  footer: {
    paddingVertical: SPACING.xxl,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  signUpLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default Login;
