import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

export default function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const themeColors = useAppSelector(selectThemeColors);
  const [authenticating, setAuthenticating] = useState(false);
  const [failed, setFailed] = useState(false);

  const authenticate = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    setFailed(false);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Dream Diary',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        onUnlocked();
      } else {
        setFailed(true);
      }
    } catch (e) {
      console.warn('Authentication err', e);
      setFailed(true);
    } finally {
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    // Attempt authentication immediately upon rendering
    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: themeColors.surface, shadowColor: themeColors.accent }]}>
        <Ionicons name={failed ? "lock-closed" : "finger-print"} size={54} color={failed ? "#EF4444" : themeColors.accent} />
      </View>
      
      <Text style={[styles.title, { color: themeColors.text }]}>App Locked</Text>
      <Text style={[styles.subtitle, { color: themeColors.text }]}>
        {failed ? "Authentication failed. Please try again." : "Use your fingerprint or face to unlock"}
      </Text>
      
      {authenticating ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={themeColors.accent} />
      ) : (
        <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.accent }]} onPress={authenticate} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0, // cover everything
    zIndex: 9999, // ensures it forces above layout 
  },
  iconContainer: {
    width: 100, height: 100,
    borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  title: { fontFamily: 'PoppinsBold', fontSize: 24 },
  subtitle: { fontFamily: 'RobotoRegular', fontSize: 14, marginTop: 8, textAlign: 'center', opacity: 0.7, paddingHorizontal: 40 },
  button: { marginTop: 40, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
  buttonText: { fontFamily: 'PoppinsBold', color: '#fff', fontSize: 16 }
});
