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
import { useDispatch, useSelector } from 'react-redux';
import { signupRequest, googleLoginRequest, clearError } from '../store/slices/authSlice';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { BRANDING, MENTORA_LOGO } from '../constants/Branding';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { 
  User, 
  ShieldCheck, 
  Camera, 
  UserCircle, 
  Mail, 
  Phone, 
  Lock,
  ArrowLeft
} from 'lucide-react-native';

const CreateAccount = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [role, setRole] = useState<'User' | 'Admin'>('User');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
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
          Alert.alert('Upload Error', err.message || 'Failed to upload photo');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleSignUp = () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters.');
      return;
    }
    
    dispatch(signupRequest({ 
      email, 
      pass: password, 
      name, 
      role: role === 'Admin' ? 'admin' : 'student',
      phoneNumber: phone,
      photoURL: photoURL || undefined
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join thousands of learners today</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Join As Segmented Control */}
          <Text style={styles.label}>Join as</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                role === 'User' && styles.segmentButtonActive,
              ]}
              onPress={() => setRole('User')}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <User size={16} color={role === 'User' ? COLORS.primary : COLORS.onSurfaceVariant} style={{ marginRight: 8 }} />
                <Text
                  style={[
                    styles.segmentText,
                    role === 'User' && styles.segmentTextActive,
                  ]}
                >
                  User
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                role === 'Admin' && styles.segmentButtonActive,
              ]}
              onPress={() => setRole('Admin')}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck size={16} color={role === 'Admin' ? COLORS.primary : COLORS.onSurfaceVariant} style={{ marginRight: 8 }} />
                <Text
                  style={[
                    styles.segmentText,
                    role === 'Admin' && styles.segmentTextActive,
                  ]}
                >
                  Admin
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <TouchableOpacity 
              style={styles.photoCircle} 
              onPress={handlePickImage}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              {isUploading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.photoPreview} />
              ) : (
                <Camera size={24} color={COLORS.onSurfaceVariant} />
              )}
            </TouchableOpacity>
            <Text style={styles.photoLabel}>
              {photoURL ? 'Change Photo' : 'Profile Photo'}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <UserCircle size={20} color={COLORS.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={COLORS.outline}
                value={name}
                onChangeText={(val) => handleInputChange(setName, val)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color={COLORS.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+1 234 567 890"
                placeholderTextColor={COLORS.outline}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => handleInputChange(setPhone, val)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.outline}
                secureTextEntry
                value={password}
                onChangeText={(val) => handleInputChange(setPassword, val)}
              />
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={{ color: '#ff4444', marginBottom: SPACING.md, textAlign: 'center' }}>{error}</Text>
          ) : null}

          {/* Primary Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
            activeOpacity={0.8}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text 
                style={styles.linkText} 
                onPress={() => navigation.navigate('Login')}
              >
                Sign in
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
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  logo: {
    height: 48,
    width: 48,
  },
  title: {
    ...TYPOGRAPHY.headline,
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.subHeadline,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    paddingLeft: SPACING.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: ROUNDNESS.full,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: ROUNDNESS.full,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.secondaryContainer,
  },
  segmentText: {
    ...TYPOGRAPHY.label,
    color: COLORS.onSurfaceVariant,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: ROUNDNESS.full,
  },
  cameraIcon: {
    fontSize: 20,
    color: COLORS.onSurfaceVariant,
  },
  photoLabel: {
    ...TYPOGRAPHY.label,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: ROUNDNESS.full,
    paddingHorizontal: SPACING.lg,
    height: 56,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#ff4444', 
    marginBottom: SPACING.md, 
    textAlign: 'center',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDNESS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    height: 60,
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...TYPOGRAPHY.cardTitle,
    color: COLORS.onPrimary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  dividerText: {
    ...TYPOGRAPHY.label,
    marginHorizontal: SPACING.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    borderRadius: ROUNDNESS.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    ...TYPOGRAPHY.cardTitle,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default CreateAccount;
