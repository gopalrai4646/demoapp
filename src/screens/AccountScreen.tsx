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
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateProfileRequest, updatePasswordRequest, clearError } from '../store/slices/authSlice';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { AppHeader } from '../components/AppHeader';
import { User as UserIcon, Phone as PhoneIcon, Lock, ShieldCheck } from 'lucide-react-native';
import { VALIDATION_LIMITS } from '../constants/validation';

const Account = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<{name?: string; phone?: string; password?: string; confirmPassword?: string; general?: string}>({});

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhone(user.phoneNumber || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri) {
        try {
          setIsUploading(true);
          const uploadedUrl = await uploadToCloudinary(uri);
          setPhotoURL(uploadedUrl);
        } catch (err: any) {
          Alert.alert('Upload Error', err.message || 'Failed to upload photo');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleSaveChanges = () => {
    setFormErrors({});
    let hasError = false;
    const errors: {name?: string; phone?: string; password?: string; confirmPassword?: string; general?: string} = {};

    const nameLength = name.trim().length;
    if (nameLength < VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH || nameLength > VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH) {
      errors.name = `Full name must be between ${VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH} and ${VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH} characters.`;
      hasError = true;
    }

    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        errors.phone = `Phone number must be exactly ${VALIDATION_LIMITS.AUTH.PHONE_LENGTH} digits only.`;
        hasError = true;
      }
    }

    if (password) {
      if (password.length < 6) {
        errors.password = 'Password should be at least 6 characters.';
        hasError = true;
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
        hasError = true;
      }
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }

    // Profile updates
    dispatch(updateProfileRequest({
      displayName: name.trim(),
      phoneNumber: phone,
      photoURL: photoURL || undefined
    }));

    // Password update if provided
    if (password) {
      dispatch(updatePasswordRequest({ password }));
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + SPACING.md }]}
          showsVerticalScrollIndicator={false}
        >
            {/* Profile Information Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.iconBox}>
                <UserIcon size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>{t('account.profileInfo')}</Text>
            </View>

            {/* Profile Photo Card */}
            <View style={styles.photoCard}>
              <TouchableOpacity
                style={[styles.photoCircle, !photoURL && { backgroundColor: '#86efac' }]}
                onPress={handlePickImage}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.photo} />
                ) : (
                  <Image 
                    source={{ uri: user?.photoURL || 'https://lh3.googleusercontent.com/a/ACg8ocL_U0YV8Z7Z' }} // Fallback or user photo
                    style={styles.photo} 
                  />
                )}
              </TouchableOpacity>
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle}>{t('account.profilePhoto')}</Text>
                <Text style={styles.photoSubtitle}>
                  {t('account.photoSubtitle')}
                </Text>
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('account.fullName')}</Text>
              <TextInput
                style={[styles.input, formErrors.name ? styles.inputError : null]}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholder={t('account.fullName')}
              />
              {formErrors.name && (
                <Text style={styles.inlineErrorText}>{formErrors.name}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('account.phone')}</Text>
              <View style={styles.phoneInputContainer}>
                <PhoneIcon size={16} color="#94a3b8" style={styles.phoneIconPosition} />
                <TextInput
                  style={[styles.input, { paddingLeft: 40 }, formErrors.phone ? styles.inputError : null]}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="123456700"
                  keyboardType="phone-pad"
                />
              </View>
              {formErrors.phone && (
                <Text style={styles.inlineErrorText}>{formErrors.phone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('account.email')}</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.email || ''}
                editable={false}
              />
              <Text style={styles.hint}>{t('account.emailHint')}</Text>
            </View>

            {/* Change Password Header */}
            <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
              <View style={styles.iconBox}>
                <ShieldCheck size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>{t('account.changePassword')}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('account.newPassword')}</Text>
              <TextInput
                style={[styles.input, formErrors.password ? styles.inputError : null]}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder={t('account.newPasswordPlaceholder')}
                secureTextEntry
              />
              {formErrors.password && (
                <Text style={styles.inlineErrorText}>{formErrors.password}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('account.confirmPassword')}</Text>
              <TextInput
                style={[styles.input, formErrors.confirmPassword ? styles.inputError : null]}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder={t('account.confirmPasswordPlaceholder')}
                secureTextEntry
              />
              {formErrors.confirmPassword && (
                <Text style={styles.inlineErrorText}>{formErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Error Message */}
            {(error || formErrors.general) ? (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{error || formErrors.general}</Text>
              </View>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.7 }]}
              onPress={handleSaveChanges}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{t('account.saveChanges')}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    marginBottom: SPACING.md,
  },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  photoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ba1a1a', // rose-500
    borderWidth: 1,
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  phoneInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  phoneIconPosition: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  hint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#a5b4fc', // Lilac color from image
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});

export default Account;
