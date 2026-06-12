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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadToCloudinary } from '../utils/cloudinary';
import firestore from '@react-native-firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { signupRequest, googleLoginRequest, clearError } from '../store/slices/authSlice';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { VALIDATION_LIMITS } from '../constants/validation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  ShieldCheck, 
  Camera, 
  UserCircle, 
  Mail, 
  Phone, 
  Lock,
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Users
} from 'lucide-react-native';

const CreateAccount = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [role, setRole] = useState<'User' | 'Admin' | 'Teacher'>('User');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [experience, setExperience] = useState('');
  const [videoPro, setVideoPro] = useState('');
  const [audience, setAudience] = useState('');
  const [formErrors, setFormErrors] = useState<{name?: string; email?: string; password?: string; phoneNumber?: string; experience?: string; videoPro?: string; audience?: string; general?: string}>({});

  // Check if an admin already exists in the database
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const adminSnapshot = await firestore().collection('users').where('role', '==', 'admin').limit(1).get();
        if (!adminSnapshot.empty) {
          setHasAdmin(true);
        }
      } catch (err) {
        console.error('Failed to check for existing admin:', err);
      }
    };
    checkAdminExists();
  }, []);
  
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
          Alert.alert(t('auth.uploadError'), err.message || 'Failed to upload photo');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleSignUp = () => {
    setFormErrors({});
    let hasError = false;
    const errors: {name?: string; email?: string; password?: string; phoneNumber?: string; experience?: string; videoPro?: string; audience?: string; general?: string} = {};

    if (!name.trim()) {
      errors.name = t('auth.nameRequired', "Full name is required.");
      hasError = true;
    } else {
      const nameLength = name.trim().length;
      if (nameLength < VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH || nameLength > VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH) {
        errors.name = `Full name must be between ${VALIDATION_LIMITS.AUTH.NAME_MIN_LENGTH} and ${VALIDATION_LIMITS.AUTH.NAME_MAX_LENGTH} characters.`;
        hasError = true;
      }
    }

    if (!email.trim()) {
      errors.email = t('auth.emailRequired', "Email is required.");
      hasError = true;
    } else if (!email.toLowerCase().endsWith('@gmail.com')) {
      errors.email = 'Email must end with @gmail.com.';
      hasError = true;
    }

    if (!password.trim()) {
      errors.password = t('auth.passwordRequired', "Password is required.");
      hasError = true;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
      hasError = true;
    }

    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        errors.phoneNumber = `Phone number must be exactly ${VALIDATION_LIMITS.AUTH.PHONE_LENGTH} digits only.`;
        hasError = true;
      }
    }

    if (role === 'Teacher') {
      if (!experience.trim()) {
        errors.experience = t('teacherSignUp.experienceRequired');
        hasError = true;
      }
      if (!videoPro.trim()) {
        errors.videoPro = t('teacherSignUp.videoProRequired');
        hasError = true;
      }
      if (!audience.trim()) {
        errors.audience = t('teacherSignUp.audienceRequired');
        hasError = true;
      }
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }
    
    dispatch(signupRequest({ 
      email, 
      pass: password, 
      name, 
      role: role === 'Admin' ? 'admin' : (role === 'Teacher' ? 'teacher' : 'student'),
      phoneNumber: phone,
      photoURL: photoURL || undefined,
      ...(role === 'Teacher' ? {
        status: 'pending',
        teacherProfile: {
          experience,
          videoPro,
          audience
        }
      } : {})
    }));
  };

  const renderRadioGroup = (label: string, options: string[], selected: string, onSelect: (val: string) => void, error?: string) => (
    <View style={styles.radioGroup}>
      <Text style={styles.radioGroupLabel}>{label}</Text>
      {options.map((opt) => (
        <TouchableOpacity 
          key={opt} 
          style={[styles.radioOption, selected === opt && styles.radioOptionSelected, error && !selected && styles.radioOptionError]} 
          onPress={() => onSelect(opt)}
          activeOpacity={0.7}
        >
          <View style={[styles.radioCircle, selected === opt && styles.radioCircleSelected]}>
            {selected === opt && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={[styles.radioText, selected === opt && styles.radioTextSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
      {error && <Text style={styles.inlineErrorText}>{error}</Text>}
    </View>
  );

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
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.signUpSub')}</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Join As Segmented Control */}
          <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  role === 'User' && styles.segmentButtonActive,
                ]}
                onPress={() => setRole('User')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <User size={16} color={role === 'User' ? '#fff' : '#464555'} style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.segmentText,
                      role === 'User' && styles.segmentTextActive,
                    ]}
                  >
                    {t('auth.joinAsUser')}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  role === 'Teacher' && styles.segmentButtonActive,
                ]}
                onPress={() => setRole('Teacher')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <GraduationCap size={16} color={role === 'Teacher' ? '#fff' : '#464555'} style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.segmentText,
                      role === 'Teacher' && styles.segmentTextActive,
                    ]}
                  >
                    Teacher
                  </Text>
                </View>
              </TouchableOpacity>
              {/* Admin Segment */}
              {!hasAdmin && (
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    role === 'Admin' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setRole('Admin')}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ShieldCheck size={16} color={role === 'Admin' ? '#fff' : '#464555'} style={{ marginRight: 8 }} />
                    <Text
                      style={[
                        styles.segmentText,
                        role === 'Admin' && styles.segmentTextActive,
                      ]}
                    >
                      {t('auth.joinAsAdmin')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <TouchableOpacity 
              style={styles.photoCircle} 
              onPress={handlePickImage}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator color="#4F46E5" />
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.photoPreview} />
              ) : (
                <>
                  <View style={styles.photoOverlay}>
                    <Camera size={24} color="#4F46E5" />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.photoLabel}>
              {photoURL ? t('auth.tapToChange') : t('auth.uploadPhoto')}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, formErrors.name ? styles.inputWrapperError : null]}>
              <UserCircle size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.fullNamePlaceholder')}
                placeholderTextColor="#777587"
                value={name}
                onChangeText={(val) => {
                  handleInputChange(setName, val);
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                }}
              />
            </View>
            {formErrors.name && (
              <Text style={styles.inlineErrorText}>{formErrors.name}</Text>
            )}
          </View>

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

          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, formErrors.phoneNumber ? styles.inputWrapperError : null]}>
              <Phone size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor="#777587"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  handleInputChange(setPhone, val);
                  if (formErrors.phoneNumber) setFormErrors(prev => ({ ...prev, phoneNumber: undefined }));
                }}
              />
            </View>
            {formErrors.phoneNumber && (
              <Text style={styles.inlineErrorText}>{formErrors.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, formErrors.password ? styles.inputWrapperError : null]}>
              <Lock size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#777587"
                secureTextEntry
                value={password}
                onChangeText={(val) => {
                  handleInputChange(setPassword, val);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
                }}
              />
            </View>
            {formErrors.password && (
              <Text style={styles.inlineErrorText}>{formErrors.password}</Text>
            )}
          </View>

          {role === 'Teacher' && (
            <>
              {renderRadioGroup(
                t('teacherSignUp.teachingExperience') || "What kind of teaching have you done before?", 
                [
                  t('teacherSignUp.teachingExpInformal') || "In person, informally", 
                  t('teacherSignUp.teachingExpProfessional') || "In person, professionally", 
                  t('teacherSignUp.teachingExpOnline') || "Online", 
                  t('teacherSignUp.teachingExpOther') || "Other"
                ],
                experience,
                (val) => { setExperience(val); if(formErrors.experience) setFormErrors(p => ({...p, experience: undefined})); },
                formErrors.experience
              )}
              
              {renderRadioGroup(
                t('teacherSignUp.videoProficiency') || "How much of a video \"pro\" are you?", 
                [
                  t('teacherSignUp.videoProBeginner') || "I am a beginner", 
                  t('teacherSignUp.videoProKnowledge') || "I have some knowledge", 
                  t('teacherSignUp.videoProExperienced') || "I am experienced", 
                  t('teacherSignUp.videoProReady') || "I have videos ready to upload"
                ],
                videoPro,
                (val) => { setVideoPro(val); if(formErrors.videoPro) setFormErrors(p => ({...p, videoPro: undefined})); },
                formErrors.videoPro
              )}

              {renderRadioGroup(
                t('teacherSignUp.audienceSize') || "Do you have an audience to share your course with?", 
                [
                  t('teacherSignUp.audienceNone') || "Not at the moment", 
                  t('teacherSignUp.audienceSmall') || "I have a small following", 
                  t('teacherSignUp.audienceSizeable') || "I have a sizeable following"
                ],
                audience,
                (val) => { setAudience(val); if(formErrors.audience) setFormErrors(p => ({...p, audience: undefined})); },
                formErrors.audience
              )}
            </>
          )}

          {/* Error Message */}
          {(error || formErrors.general) ? (
            <View style={styles.generalErrorContainer}>
              <Text style={styles.errorText}>{error || formErrors.general}</Text>
            </View>
          ) : null}

          {/* Primary Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
            activeOpacity={0.9}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('auth.signUpBtn')}</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
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
            <Text style={styles.googleButtonText}>{t('auth.googleSignUp')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.alreadyHaveAccount')}{' '}
              <Text 
                style={styles.linkText} 
                onPress={() => navigation.navigate('Login')}
              >
                {t('auth.login')}
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
    alignItems: 'center',
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#ECEEF0',
    borderRadius: 30,
    padding: 4,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 24,
  },
  segmentButtonActive: {
    backgroundColor: '#4F46E5',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#464555',
  },
  segmentTextActive: {
    color: '#fff',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  photoOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
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
  primaryButton: {
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
  primaryButtonText: {
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
  },
  footerText: {
    fontSize: 14,
    color: '#505F76',
    fontWeight: '500',
  },
  linkText: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  radioGroup: {
    marginBottom: 20,
    width: '100%',
  },
  radioGroupLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155', // slate-700
    marginBottom: 10,
    marginLeft: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
  },
  radioOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#f5f3ff', // violet-50
  },
  radioOptionError: {
    borderColor: '#f43f5e', // rose-500
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8', // slate-400
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#4F46E5',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  radioText: {
    fontSize: 14,
    color: '#334155', // slate-700
    fontWeight: '500',
  },
  radioTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
});

export default CreateAccount;
