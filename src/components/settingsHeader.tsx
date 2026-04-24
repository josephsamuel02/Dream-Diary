import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

export default function SettingsHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useAppSelector(selectThemeColors);

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topPadding = Math.max(insets.top, statusBarHeight);

  return (
    <LinearGradient
      colors={themeColors.headerGradient}
      locations={[0, 0.4, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{
        paddingTop: topPadding + 8,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      }}>
      {/* Decorative circles */}
      <View style={styles.decor1} />
      <View style={styles.decor2} />

      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Settings</Text>
          <Text style={styles.subtitleText}>App preferences</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  decor1: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ scale: 1.2 }],
  },
  decor2: {
    position: 'absolute',
    right: 80,
    top: 48,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'PoppinsBold',
    fontSize: 20,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontFamily: 'RobotoMedium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: -2,
  },
});
