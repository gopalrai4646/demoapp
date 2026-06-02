import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';

interface SplashScreenProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial logo fade and scale in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Start the text and progress animation sequence
    const timer = setTimeout(() => {
      Animated.parallel([
        // Fade and slide text
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        // Animate the loading bar width (useNativeDriver: false since width doesn't support it)
        Animated.timing(progressWidth, {
          toValue: width * 0.6, // Bar grows to 60% of screen width
          duration: 1500,
          useNativeDriver: false,
        }),
      ]).start();
    }, 800); // slight delay before showing text

    // Call onComplete after animations finish
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, textOpacity, textTranslateY, logoScale, logoOpacity, progressWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Image
            source={require('../assets/images/appicon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>Mentora</Text>
          <Text style={styles.slogan}>L E A R N .   G R O W .   S U C C E E D .</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        {/* Loading Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        
        <Text style={styles.footerText}>Version 2.4.0 • Mentora Scholar</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF', // White/Light background requested by user
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 20,
    borderRadius: 36,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1E293B', // Dark slate for visibility on white background
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 12,
    color: '#3B82F6', // Blueish cyan
    fontWeight: '700',
    letterSpacing: 2, 
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  progressBarTrack: {
    width: width * 0.6,
    height: 3,
    backgroundColor: '#E2E8F0', // Light gray track for white background
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#A855F7', // Purple/Pink gradient approximation
    borderRadius: 2,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
