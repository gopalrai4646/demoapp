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
          <Text style={styles.title}>Join Mentora</Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>
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
              {photoURL ? 'Tap to change' : 'Upload photo'}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <UserCircle size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#777587"
                value={name}
                onChangeText={(val) => handleInputChange(setName, val)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#777587"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => handleInputChange(setEmail, val)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#777587"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => handleInputChange(setPhone, val)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#777587" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#777587"
                secureTextEntry
                value={password}
                onChangeText={(val) => handleInputChange(setPassword, val)}
              />
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
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
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
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
  errorText: {
    color: '#ba1a1a', 
    marginBottom: 12, 
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
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
});

export default CreateAccount;
