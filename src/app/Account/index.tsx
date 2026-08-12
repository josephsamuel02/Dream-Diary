import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

export default function Account() {
  const themeColors = useAppSelector(selectThemeColors);

  return (
    <LinearGradient
      colors={[themeColors.background, themeColors.surface, themeColors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.globalShell}>
      <View style={[styles.ambientGlow, { backgroundColor: themeColors.accent + '18' }]} />
      <View style={[styles.ambientGlowSecondary, { backgroundColor: themeColors.accent + '12' }]} />

      <View style={styles.comingSoonWrap}>
        <View style={[styles.iconWrap, { backgroundColor: themeColors.accent + '18' }]}>
          <Ionicons name="construct-outline" size={42} color={themeColors.accent} />
        </View>
        <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>Coming Soon</Text>
        <Text style={[styles.comingSoonText, { color: themeColors.text + '80' }]}>
          The account area is being refreshed and will be available soon.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  globalShell: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -35,
    right: -45,
    opacity: 0.9,
  },
  ambientGlowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 120,
    left: -50,
    opacity: 0.7,
  },
  comingSoonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
    maxWidth: 320,
    zIndex: 1,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  comingSoonTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonText: {
    fontFamily: 'RobotoRegular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
