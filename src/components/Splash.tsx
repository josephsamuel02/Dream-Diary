import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeKey } from '~/store/slices/themeSlice';

const { width, height } = Dimensions.get('window');

// Per-theme splash palettes: gradient stops, accent, icon name, star color
const SPLASH_THEMES: Record<
  ThemeKey,
  {
    gradient: [string, string, string, string];
    accent: string;
    orbColor: string;
    starColor: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconGradient: [string, string];
  }
> = {
  cozy: {
    gradient: ['#1A0A00', '#4A1A00', '#8B3A00', '#B45309'],
    accent: '#F59E0B',
    orbColor: '#92400E',
    starColor: '#FDE68A',
    icon: 'cafe',
    iconGradient: ['#D97706', '#92400E'],
  },
  clean: {
    gradient: ['#020B2A', '#061B6E', '#1D4ED8', '#3B82F6'],
    accent: '#93C5FD',
    orbColor: '#1D4ED8',
    starColor: '#DBEAFE',
    icon: 'sparkles',
    iconGradient: ['#3B82F6', '#1D4ED8'],
  },
  dreamy: {
    gradient: ['#0D0720', '#2A1060', '#5B21B6', '#7C3AED'],
    accent: '#C4B5FD',
    orbColor: '#5B21B6',
    starColor: '#EDE9FE',
    icon: 'moon',
    iconGradient: ['#7C3AED', '#5B21B6'],
  },
  nature: {
    gradient: ['#001A0A', '#013A18', '#047857', '#059669'],
    accent: '#6EE7B7',
    orbColor: '#047857',
    starColor: '#D1FAE5',
    icon: 'leaf',
    iconGradient: ['#10B981', '#047857'],
  },
  warm: {
    gradient: ['#1A0A00', '#4A1C00', '#92400E', '#D97706'],
    accent: '#FCD34D',
    orbColor: '#92400E',
    starColor: '#FEF3C7',
    icon: 'sunny',
    iconGradient: ['#F59E0B', '#B45309'],
  },
  dark: {
    gradient: ['#000000', '#030712', '#111827', '#1F2937'],
    accent: '#60A5FA',
    orbColor: '#1F2937',
    starColor: '#E5E7EB',
    icon: 'planet',
    iconGradient: ['#3B82F6', '#1D4ED8'],
  },
};

interface SplashProps {
  fontsLoaded?: boolean;
  themeKey?: ThemeKey;
}

export default function Splash({ fontsLoaded = false, themeKey = 'cozy' }: SplashProps) {
  const palette = SPLASH_THEMES[themeKey] ?? SPLASH_THEMES.cozy;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0)).current;
  const starAnim3 = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    const twinkle = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    };
    twinkle(starAnim1, 0);
    twinkle(starAnim2, 450);
    twinkle(starAnim3, 900);

    const pulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    pulse(dotAnim1, 0);
    pulse(dotAnim2, 180);
    pulse(dotAnim3, 360);
  }, []);

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.container}>

      {/* Decorative orbs */}
      <View style={[styles.orb1, { backgroundColor: palette.orbColor }]} />
      <View style={[styles.orb2, { backgroundColor: palette.orbColor }]} />
      <View style={[styles.orb3, { backgroundColor: palette.accent + '30' }]} />

      {/* Twinkling stars */}
      <Animated.View style={[styles.star, styles.starPos1, { opacity: starAnim1 }]}>
        <Ionicons name="star" size={10} color={palette.starColor} />
      </Animated.View>
      <Animated.View style={[styles.star, styles.starPos2, { opacity: starAnim2 }]}>
        <Ionicons name="star" size={7} color={palette.starColor} />
      </Animated.View>
      <Animated.View style={[styles.star, styles.starPos3, { opacity: starAnim3 }]}>
        <Ionicons name="star" size={13} color={palette.starColor} />
      </Animated.View>
      <Animated.View style={[styles.star, styles.starPos4, { opacity: starAnim2 }]}>
        <Ionicons name="star" size={6} color={palette.accent} />
      </Animated.View>
      <Animated.View style={[styles.star, styles.starPos5, { opacity: starAnim1 }]}>
        <Ionicons name="star" size={9} color={palette.starColor} />
      </Animated.View>

      {/* Main content */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Icon badge */}
        <View style={styles.iconWrap}>
          <LinearGradient colors={palette.iconGradient} style={[styles.iconGradient, { shadowColor: palette.accent }]}>
            <Ionicons name={palette.icon} size={36} color="#FFFFFF" />
          </LinearGradient>
          <View style={[styles.iconGlow, { backgroundColor: palette.accent }]} />
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            fontsLoaded ? styles.titleFontLoaded : styles.titleFallback,
          ]}>
          Dream Diary
        </Text>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: palette.accent }]} />
          <Ionicons name="sparkles" size={12} color={palette.accent} style={{ marginHorizontal: 8 }} />
          <View style={[styles.dividerLine, { backgroundColor: palette.accent }]} />
        </View>

        {/* Tagline */}
        <Text style={[styles.tagline, { color: palette.accent }, fontsLoaded && styles.taglineFontLoaded]}>
          Capture your dreams &amp; thoughts
        </Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { backgroundColor: palette.accent, opacity: dotAnim1 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: palette.accent, opacity: dotAnim2 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: palette.accent, opacity: dotAnim3 }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2,
    top: -90,
    right: -90,
  },
  orb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.22,
    bottom: height * 0.12,
    left: -70,
  },
  orb3: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 1,
    bottom: -30,
    right: 40,
  },
  star: { position: 'absolute' },
  starPos1: { top: height * 0.1, left: width * 0.12 },
  starPos2: { top: height * 0.18, right: width * 0.14 },
  starPos3: { top: height * 0.28, left: width * 0.72 },
  starPos4: { bottom: height * 0.25, left: width * 0.1 },
  starPos5: { bottom: height * 0.32, right: width * 0.08 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  iconGlow: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
    opacity: 0.18,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
  },
  titleFontLoaded: {
    fontFamily: 'GreatVibes',
    fontSize: 58,
    letterSpacing: 1,
  },
  titleFallback: {
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: 3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    width: 50,
    height: 1,
    opacity: 0.45,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.85,
  },
  taglineFontLoaded: {
    fontFamily: 'PoppinsRegular',
    fontStyle: 'italic',
  },
  dotsRow: {
    position: 'absolute',
    bottom: height * 0.1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
