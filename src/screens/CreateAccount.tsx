import React, { useState } from 'react';
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
import { signupRequest } from '../store/slices/authSlice';
import { RootState } from '../store';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';

const CreateAccount = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [role, setRole] = useState<'User' | 'Admin'>('User');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPo5ubdlpPFDr61DGxotB38FuvVZEgxGhJJx9pJbrtGojYlZznOBK7bqm-e-kbn_vpEiN-N-6ABYyc_lUivYbfHj3xPpwD0i_hQfFMphOZh3QBBhdwWgfYdOkLGGdOQUWajnPR4qbG7RCVVeb7SUKktjZr2OAnl5MZFfhY7ZXlNbrniKsBorxTGTKVTkiIqLBGWtrn6lhN79rNbMpLCsF4yCflCtFMt_PfEw864oTqKxofa2F3hcQjovCxoWf_oQpe07ZUmjuImv4' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
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
              <Text
                style={[
                  styles.segmentText,
                  role === 'User' && styles.segmentTextActive,
                ]}
              >
                👤 User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                role === 'Admin' && styles.segmentButtonActive,
              ]}
              onPress={() => setRole('Admin')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  role === 'Admin' && styles.segmentTextActive,
                ]}
              >
                🛠 Admin
              </Text>
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
                <Text style={styles.cameraIcon}>📷</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.photoLabel}>
              {photoURL ? 'Change Photo' : 'Profile Photo'}
            </Text>
          </View>

          {/* Inputs */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={COLORS.outline}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor={COLORS.outline}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 234 567 890"
            placeholderTextColor={COLORS.outline}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.outline}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

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
          <TouchableOpacity style={styles.googleButton} activeOpacity={0.7}>
            <Text style={styles.googleButtonText}>
              <Text style={{ fontWeight: 'bold' }}>G</Text>{'  '}Google
            </Text>
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
  input: {
    borderWidth: 0,
    borderRadius: ROUNDNESS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
    fontSize: 14,
    color: COLORS.onSurface,
    backgroundColor: COLORS.surfaceContainerHighest,
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
