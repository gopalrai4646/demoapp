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
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Mail,
  CheckCircle2
} from 'lucide-react-native';

const ResetPassword = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();

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
      Alert.alert(t('common.error'), t('auth.enterEmailError'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.enterValidEmail'));
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
            <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.resetPasswordSub')}
            </Text>
          </View>

          {/* Reset Form / Success State */}
          <View style={styles.formContainer}>
            {isSubmitted ? (
              <View style={styles.successContainer}>
                <CheckCircle2 size={24} color="#2E7D32" style={styles.successIcon} />
                <Text style={styles.successText}>
                  {t('auth.successCheckEmail')}
                </Text>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#777587" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="#777587"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={handleInputChange}
                  />
                </View>
              </View>
            )}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {!isSubmitted && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.resetButtonContent}>
                    <Text style={styles.resetButtonText}>{t('auth.sendResetLink')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerText}>
                {isSubmitted ? t('auth.returnToLogin') : t('auth.backToSignIn')}
              </Text>
            </TouchableOpacity>
          </View>
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
    textAlign: 'center',
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
  errorText: {
    color: '#ba1a1a', 
    marginBottom: 12, 
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  successIcon: {
    marginRight: 12,
  },
  successText: {
    flex: 1,
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  resetButton: {
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
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '800',
  },
});

export default ResetPassword;
