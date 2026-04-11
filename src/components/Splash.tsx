import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function Splash() {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>Dream Diary</Text>
      </View>
      <Text style={styles.tagline}>Capture your dreams & thoughts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3E2723',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
});
