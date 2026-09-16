import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeKey } from '~/store/slices/themeSlice';

const { width, height } = Dimensions.get('window');

// Per-theme splash palettes, kept in sync with THEMES in
// `src/store/slices/themeSlice.ts`:
// - gradient end / dots / divider use the theme's accent so the loader
//   flows into the app without a color jump.
// - titleColor is white on the 7 dark-background themes and the theme's
//   dark text color on the 4 light themes (blossom, rose, lilac, lavender)
//   so the title stays readable during load.
const SPLASH_THEMES: Record<
  ThemeKey,
  {
    gradient: [string, string, string, string];
    accent: string;
    titleColor: string;
    orbColor: string;
    starColor: string;
  }
> = {
  blossom: {
    gradient: ['#FFE4F0', '#FBCFE8', '#F472B6', '#EC4899'],
    accent: '#EC4899',
    titleColor: '#5C2A3A',
    orbColor: '#F472B6',
    starColor: '#9D174D',
  },
  rose: {
    gradient: ['#FFE4E6', '#FECDD3', '#FB7185', '#E11D48'],
    accent: '#E11D48',
    titleColor: '#6B2737',
    orbColor: '#FB7185',
    starColor: '#9F1239',
  },
  lilac: {
    gradient: ['#EDE9FE', '#DDD6FE', '#A78BFA', '#8B5CF6'],
    accent: '#8B5CF6',
    titleColor: '#4C1D95',
    orbColor: '#A78BFA',
    starColor: '#6D28D9',
  },
  cozy: {
    gradient: ['#1A0A00', '#4A1A00', '#8B3A00', '#B45309'],
    accent: '#E8923A',
    titleColor: '#FFFFFF',
    orbColor: '#92400E',
    starColor: '#FDE68A',
  },
  night: {
    gradient: ['#020B2A', '#061B6E', '#1D4ED8', '#3B82F6'],
    accent: '#60A5FA',
    titleColor: '#FFFFFF',
    orbColor: '#1D4ED8',
    starColor: '#DBEAFE',
  },
  dreamy: {
    gradient: ['#0D0720', '#2A1060', '#5B21B6', '#7C3AED'],
    accent: '#A78BFA',
    titleColor: '#FFFFFF',
    orbColor: '#5B21B6',
    starColor: '#EDE9FE',
  },
  nature: {
    gradient: ['#001A0A', '#013A18', '#047857', '#059669'],
    accent: '#34D399',
    titleColor: '#FFFFFF',
    orbColor: '#047857',
    starColor: '#D1FAE5',
  },
  warm: {
    gradient: ['#1A0A00', '#4A1C00', '#92400E', '#D97706'],
    accent: '#FBBF24',
    titleColor: '#FFFFFF',
    orbColor: '#92400E',
    starColor: '#FEF3C7',
  },
  dark: {
    gradient: ['#000000', '#030712', '#111827', '#1F2937'],
    accent: '#FFFFFF',
    titleColor: '#FFFFFF',
    orbColor: '#1F2937',
    starColor: '#E5E7EB',
  },
  midnight: {
    gradient: ['#010617', '#07133A', '#172554', '#4C1D95'],
    accent: '#8B5CF6',
    titleColor: '#FFFFFF',
    orbColor: '#312E81',
    starColor: '#EDE9FE',
  },
  lavender: {
    gradient: ['#F5F3FF', '#E9D5FF', '#F5D0FE', '#FDA4AF'],
    accent: '#4C1D95',
    titleColor: '#29234F',
    orbColor: '#C084FC',
    starColor: '#7C3AED',
  },
};

interface SplashProps {
  fontsLoaded?: boolean;
  themeKey?: ThemeKey;
}

export default function Splash({ fontsLoaded = false, themeKey = 'dark' }: SplashProps) {
  const palette = SPLASH_THEMES[themeKey] ?? SPLASH_THEMES.dark;

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
        {/* Icon badge - removed as requested */}

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: palette.titleColor },
            fontsLoaded ? styles.titleFontLoaded : styles.titleFallback,
          ]}>
          Dream Diary
        </Text>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: palette.accent }]} />
          <Ionicons
            name="sparkles"
            size={12}
            color={palette.accent}
            style={{ marginHorizontal: 8 }}
          />
          <View style={[styles.dividerLine, { backgroundColor: palette.accent }]} />
        </View>

        {/* Tagline */}
        <Text
          style={[
            styles.tagline,
            { color: palette.titleColor },
            fontsLoaded && styles.taglineFontLoaded,
          ]}>
          Capture your dreams &amp; thoughts
        </Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        <Animated.View
          style={[styles.dot, { backgroundColor: palette.accent, opacity: dotAnim1 }]}
        />
        <Animated.View
          style={[styles.dot, { backgroundColor: palette.accent, opacity: dotAnim2 }]}
        />
        <Animated.View
          style={[styles.dot, { backgroundColor: palette.accent, opacity: dotAnim3 }]}
        />
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
  title: {
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
