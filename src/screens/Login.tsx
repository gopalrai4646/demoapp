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
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight 
} from 'lucide-react-native';
import { AuthStackParamList } from '../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const Login = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string; general?: string}>({});

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
    setFormErrors({});
    let hasError = false;
    const errors: {email?: string; password?: string} = {};

    if (!email.trim()) {
      errors.email = "No email found.";
      hasError = true;
    }

    if (!password.trim()) {
      errors.password = "Password is required.";
      hasError = true;
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }

    dispatch(loginRequest({ email, pass: password }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#191C1E" />
        </TouchableOpacity>

        <View style={styles.centerWrapper}>
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
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.signInSub')}
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, formErrors.email ? styles.inputWrapperError : null]}>
              <Mail size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="#777587"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => {
                  handleInputChange(setEmail, val);
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
                }}
              />
            </View>
            {formErrors.email && (
              <Text style={styles.inlineErrorText}>{formErrors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, formErrors.password ? styles.inputWrapperError : null]}>
              <Lock size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#777587"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => {
                  handleInputChange(setPassword, val);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
                }}
              />
              <TouchableOpacity
                style={styles.visibilityButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#777587" />
                ) : (
                  <Eye size={20} color="#777587" />
                )}
              </TouchableOpacity>
            </View>
            {formErrors.password && (
              <Text style={styles.inlineErrorText}>{formErrors.password}</Text>
            )}
            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => navigation.navigate('ResetPassword')}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {(error || formErrors.general) ? (
            <View style={styles.generalErrorContainer}>
              <Text style={styles.errorText}>{error || formErrors.general}</Text>
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.signInButtonContent}>
                <Text style={styles.signInText}>{t('auth.signIn')}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity 
            style={styles.googleButton} 
            activeOpacity={0.8}
            onPress={() => dispatch(googleLoginRequest())}
            disabled={loading}
          >
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>{t('auth.googleSignIn')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('auth.noAccount')}{' '}
            <Text 
              style={styles.signUpLink} 
              onPress={() => navigation.navigate('CreateAccount')}
            >
              {t('auth.signUp')}
            </Text>
          </Text>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB', // Luminous Scholar Background
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  logoContainer: {
    padding: 6,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  logo: {
    height: 40,
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#191C1E',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#505F76',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  inputWrapperError: {
    borderColor: '#ba1a1a', // rose-500 equivalent
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#191C1E',
    fontSize: 14,
    fontWeight: '500',
  },
  visibilityButton: {
    padding: 8,
    marginRight: -8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingRight: 4,
  },
  forgotText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },
  generalErrorContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)', // rose-50/50 equivalent
    borderColor: 'rgba(244, 63, 94, 0.2)', // rose-200 equivalent
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ba1a1a', 
    textAlign: 'left',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inlineErrorText: {
    color: '#ba1a1a', // rose-500
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
    marginLeft: 4,
  },
  signInButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E3E5',
  },
  dividerText: {
    fontSize: 13,
    color: '#777587',
    fontWeight: '500',
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 26,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#505F76',
    fontWeight: '500',
  },
  signUpLink: {
    color: '#4F46E5',
    fontWeight: '800',
  },
});

export default Login;
