import React, { useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Badge } from '~/constants/badges';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#6BCB77',
  '#4D96FF',
  '#FF6FD8',
  '#FFA552',
  '#A78BFA',
  '#34D399',
];
const CONFETTI_COUNT = 28;

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'circle' | 'square';
}

interface Props {
  badge: Badge | null;
  visible: boolean;
  onClose: () => void;
}

const AchievementUnlockedModal = ({ badge, visible, onClose }: Props) => {
  const themeColors = useAppSelector(selectThemeColors);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Build confetti pieces once; refs are stable across renders.
  const confetti = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      x: new Animated.Value(Math.random() * SCREEN_W),
      y: new Animated.Value(-20),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) {
      // Reset all animated values when modal closes.
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
      confetti.forEach((p) => {
        p.x.setValue(Math.random() * SCREEN_W);
        p.y.setValue(-20);
        p.rotate.setValue(0);
        p.opacity.setValue(1);
      });
      return;
    }

    // Modal entrance animation.
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Emoji bounce loop.
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 400, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();

    // Confetti fall animations with staggered delays.
    confetti.forEach((piece, i) => {
      const delay = i * 60;
      const duration = 1800 + Math.random() * 800;
      const startX = Math.random() * SCREEN_W;
      const driftX = (Math.random() - 0.5) * 120;

      piece.x.setValue(startX);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: SCREEN_H * 0.55,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: startX + driftX,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotate, {
            toValue: (Math.random() > 0.5 ? 1 : -1) * 4,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(duration * 0.6),
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: duration * 0.4,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  }, [visible]);

  if (!badge) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropInner, { opacity: fadeAnim }]} />
      </Pressable>

      {/* Confetti layer */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {confetti.map((piece, i) => {
          const rotate = piece.rotate.interpolate({
            inputRange: [-4, 0, 4],
            outputRange: ['-360deg', '0deg', '360deg'],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size,
                borderRadius: piece.shape === 'circle' ? piece.size / 2 : 2,
                backgroundColor: piece.color,
                transform: [{ translateX: piece.x }, { translateY: piece.y }, { rotate }],
                opacity: piece.opacity,
              }}
            />
          );
        })}
      </View>

      {/* Card */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: themeColors.surface },
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}>
          {/* Gradient banner */}
          <LinearGradient
            colors={badge.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}>
            <View style={styles.bannerDecorCircle} />
            <View style={styles.bannerDecorCircle2} />

            <Animated.Text style={[styles.badgeEmoji, { transform: [{ translateY: bounceAnim }] }]}>
              {badge.icon}
            </Animated.Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.unlockTag}>
              <Ionicons name="trophy" size={12} color={badge.color} />
              <Text style={[styles.unlockTagText, { color: badge.color }]}>
                Achievement Unlocked!
              </Text>
            </View>

            <Text style={[styles.badgeTitle, { color: themeColors.text }]}>{badge.title}</Text>
            <Text style={[styles.badgeDesc, { color: themeColors.text }]}>{badge.description}</Text>

            <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ marginTop: 20 }}>
              <LinearGradient
                colors={badge.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Awesome!</Text>
                <Ionicons name="star" size={15} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  centeredView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  banner: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerDecorCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -60,
    right: -40,
  },
  bannerDecorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -30,
    left: -20,
  },
  badgeEmoji: {
    fontSize: 72,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  unlockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  unlockTagText: {
    fontFamily: 'PoppinsBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  badgeTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDesc: {
    fontFamily: 'RobotoRegular',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.65,
    lineHeight: 19,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 30,
  },
  closeButtonText: {
    color: '#fff',
    fontFamily: 'PoppinsBold',
    fontSize: 15,
  },
});

export default AchievementUnlockedModal;
