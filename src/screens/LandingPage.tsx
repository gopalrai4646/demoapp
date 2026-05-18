import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { BarChart3, Play, FileText, ShieldCheck, ChevronDown, ChevronRight, Globe, Lock, RefreshCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

type LandingPageProp = NativeStackNavigationProp<AuthStackParamList, 'Landing'>;

const LANGUAGE_OPTIONS = [
  { code: 'en', flag: 'https://flagcdn.com/w40/gb.png', label: 'English', short: 'EN' },
  { code: 'de', flag: 'https://flagcdn.com/w40/de.png', label: 'Deutsch', short: 'DE' },
  { code: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'Français', short: 'FR' },
];

const { width } = Dimensions.get('window');

const LandingPage = () => {
  const navigation = useNavigation<LandingPageProp>();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  const landingT = t('landing', { returnObjects: true }) as any;
  const [langOpen, setLangOpen] = React.useState(false);

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === i18n.language) || LANGUAGE_OPTIONS[0];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  const handleGetStarted = () => {
    if (user) {
      // If logged in, take them to their dashboard
      navigation.navigate('Dashboard' as any);
    } else {
      // If guest, take them to registration
      navigation.navigate('CreateAccount' as any);
    }
  };

  const handleLogin = () => {
    if (user) {
      // If already logged in, login button takes them to dashboard
      navigation.navigate('Dashboard' as any);
    } else {
      navigation.navigate('Login' as any);
    }
  };

  if (!landingT || typeof landingT !== 'object') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const features = [
    { icon: BarChart3, title: landingT.features.feature_1.title, desc: landingT.features.feature_1.desc },
    { icon: Play, title: landingT.features.feature_2.title, desc: landingT.features.feature_2.desc },
    { icon: FileText, title: landingT.features.feature_3.title, desc: landingT.features.feature_3.desc },
    { icon: ShieldCheck, title: landingT.features.feature_4.title, desc: landingT.features.feature_4.desc },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (Now inside ScrollView to be scrollable) */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>{landingT.nav.mentora}</Text>
          
          {/* Language Switcher */}
          <View style={styles.langWrapper}>
            <TouchableOpacity 
              style={styles.langButton}
              onPress={() => setLangOpen(!langOpen)}
            >
              <Image source={{ uri: currentLang.flag }} style={styles.langFlag} />
              <ChevronDown color="#94A3B8" size={14} />
            </TouchableOpacity>

            {langOpen && (
              <View style={styles.langDropdown}>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <TouchableOpacity 
                    key={opt.code} 
                    style={[styles.langOption, i18n.language === opt.code && styles.langOptionActive]}
                    onPress={() => handleLanguageChange(opt.code)}
                  >
                    <Text style={[styles.langOptionText, i18n.language === opt.code && styles.langOptionTextActive]}>
                      {opt.short}
                    </Text>
                    <Image source={{ uri: opt.flag }} style={styles.langOptionFlag} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{landingT.hero.badge}</Text>
          </View>
          
          <Text style={styles.titleText}>
            {landingT.hero.title_1} {'\n'}
            <Text style={styles.titleItalic}>{landingT.hero.title_with}</Text>{' '}
            <Text style={styles.titleAccent}>{landingT.hero.title_2}</Text>
          </Text>

          <Text style={styles.subtitleText}>
            {landingT.hero.subtitle}
          </Text>

          {/* Hero CTAs - Only visible if guest */}
          {!user && (
            <View style={styles.heroCTAs}>
              <TouchableOpacity 
                style={styles.heroPrimaryButton}
                onPress={handleGetStarted}
              >
                <Text style={styles.heroPrimaryText}>
                  {landingT.nav.getStarted}
                </Text>
                <ChevronRight color="#fff" size={16} strokeWidth={3} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.heroSecondaryButton}
                onPress={handleLogin}
              >
                <Text style={styles.heroSecondaryText}>
                  {landingT.nav.login}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dashboard Preview (Image from Unsplash) */}
        <View style={styles.heroPreviewContainer}>
          {/* Floating Velocity Card */}
          <View style={styles.velocityCard}>
            <View style={styles.velocityIconBox}>
              <BarChart3 color="#2563EB" size={20} />
            </View>
            <View>
              <Text style={styles.velocityLabel}>{landingT.hero.velocity?.toUpperCase()}</Text>
              <Text style={styles.velocityValue}>{landingT.hero.accuracy}</Text>
            </View>
          </View>

          <View style={styles.previewImageFrame}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop' }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.previewOverlay} />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>{landingT.features.title}</Text>
          <Text style={styles.sectionSubtitle}>{landingT.features.subtitle}</Text>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresHorizontalScroll}
            snapToInterval={width * 0.75 + 16}
            decelerationRate="fast"
          >
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <feature.icon color="#334155" size={28} strokeWidth={1.5} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Global Advantage */}
        <View style={styles.globalAdvantage}>
          <View style={styles.globeIconContainer}>
            <Globe color="#fff" size={32} />
          </View>
          <Text style={styles.globalTitle}>{landingT.advantage.title}</Text>
          <Text style={styles.globalSubtitle}>
            {landingT.advantage.subtitle_1} <Text style={styles.globalSubtitleAccent}>{landingT.advantage.subtitle_2}</Text>
          </Text>
          <View style={styles.globalLangs}>
            {landingT.advantage.langs && Array.isArray(landingT.advantage.langs) && landingT.advantage.langs.map((lang: string) => (
              <View key={lang} style={styles.langTag}>
                <Text style={styles.langTagText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.securitySection}>
          <View style={styles.securityBadge}>
            <Lock color="#60A5FA" size={14} />
            <Text style={styles.securityBadgeText}>{landingT.security.badge?.toUpperCase()}</Text>
          </View>
          <Text style={styles.securityTitle}>{landingT.security.title}</Text>
          <Text style={styles.securitySubtitle}>{landingT.security.subtitle}</Text>

          <View style={styles.securityPoints}>
            {[landingT.security.zeroTrust, landingT.security.automatedScanning].map((point, idx) => (
              <View key={idx} style={styles.securityPoint}>
                <View style={styles.securityPointIcon}>
                  <ShieldCheck color="#4ADE80" size={16} />
                </View>
                <Text style={styles.securityPointText}>{point}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statusDashboard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusHeaderText}>{landingT.security.systemStatus}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>{landingT.security.secure?.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <View style={styles.statusItemIcon}>
                  <RefreshCcw color="#60A5FA" size={16} />
                </View>
                <Text style={styles.statusItemLabel}>{landingT.security.updates}</Text>
              </View>
              <Text style={styles.statusItemTag}>{landingT.security.live?.toUpperCase()}</Text>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <View style={styles.statusItemIcon}>
                  <Lock color="#60A5FA" size={16} />
                </View>
                <Text style={styles.statusItemLabel}>{landingT.security.encryption}</Text>
              </View>
              <Text style={styles.statusItemTag}>{landingT.security.active?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>{landingT.nav.mentora}.</Text>
          <Text style={styles.footerCopyright}>{landingT.footer.copyright}</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>{landingT.footer.terms}</Text>
            <Text style={styles.footerLink}>{landingT.footer.privacy}</Text>
            <Text style={styles.footerLink}>{landingT.footer.twitter}</Text>
            <Text style={styles.footerLink}>{landingT.footer.linkedin}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    gap: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#9333EA',
  },
  langWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langFlag: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  langDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  langOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  langOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  langOptionTextActive: {
    color: '#2563EB',
    fontWeight: '900',
  },
  langOptionFlag: {
    width: 16,
    height: 12,
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  badgeText: {
    color: '#9333EA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 16,
  },
  titleItalic: {
    fontStyle: 'italic',
    color: '#2563EB',
  },
  titleAccent: {
    color: '#9333EA',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  heroCTAs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  heroPrimaryButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    flex: 1.2,
    maxWidth: 200,
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  heroPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6,
  },
  heroSecondaryButton: {
    flex: 1,
    maxWidth: 120,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
  },
  heroSecondaryText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  heroPreviewContainer: {
    paddingHorizontal: 16,
    marginBottom: 40,
    position: 'relative',
  },
  velocityCard: {
    position: 'absolute',
    top: -20,
    left: 4,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  velocityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  velocityLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  velocityValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  previewImageFrame: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 4,
    borderColor: '#1E293B',
    elevation: 30,
    shadowColor: '#302950',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuresHorizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 10,
  },
  featureCard: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: Dimensions.get('window').width * 0.75,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 24,
    fontWeight: '500',
  },
  globalAdvantage: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  globeIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  globalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  globalSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
  },
  globalSubtitleAccent: {
    color: '#2563EB',
    fontWeight: '700',
  },
  globalLangs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  langTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  langTagText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  securitySection: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: '#0F172A',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  securityBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  securityTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 12,
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 20,
  },
  securityPoints: {
    gap: 20,
    marginBottom: 30,
  },
  securityPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  securityPointIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityPointText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
  },
  statusDashboard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statusHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statusBadgeText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusItemIcon: {
    padding: 8,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 12,
  },
  statusItemLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusItemTag: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FAFBFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#9333EA',
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  footerLink: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LandingPage;
