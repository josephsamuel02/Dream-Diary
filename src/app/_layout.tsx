// app/_layout.tsx
import { LogBox } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';

// Suppress the third-party deprecation warning for SafeAreaView
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'SafeAreaView has been extracted from react-native',
]);
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { Lora_400Regular } from '@expo-google-fonts/lora';
import { Merriweather_400Regular } from '@expo-google-fonts/merriweather';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { Nunito_400Regular } from '@expo-google-fonts/nunito';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { scheduleDailyReminder } from '../util/notifications';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../../global.css';
import CustomHeader from '../components/mainNav';
import DiaryInputHeader from '~/components/diaryInputHeader';
import AllEntriesHeader from '~/components/allEntriesHeader';
import ThemesHeader from '~/components/themesHeader';
import AccountHeader from '~/components/AccountHeader';
import SettingsHeader from '~/components/settingsHeader';
import AboutHeader from '~/components/aboutHeader';
import LockScreen from '~/components/LockScreen';
import SyncManager from '~/components/SyncManager';
import DailyEntryManager from '~/components/DailyEntryManager';
import { persistor, store } from '~/store/store';
import type { ThemeKey } from '~/store/slices/themeSlice';

export default function Layout() {
  const [isLocked, setIsLocked] = useState(false);
  const [savedTheme, setSavedTheme] = useState<ThemeKey>('cozy');

  const [fontsLoaded] = useFonts({
    PoppinsRegular: Poppins_400Regular,
    PoppinsBold: Poppins_700Bold,
    RobotoRegular: Roboto_400Regular,
    RobotoMedium: Roboto_500Medium,
    GreatVibes: GreatVibes_400Regular,
    Lora: Lora_400Regular,
    Merriweather: Merriweather_400Regular,
    Caveat: Caveat_400Regular,
    NunitoRegular: Nunito_400Regular,
    PlayfairDisplay: PlayfairDisplay_400Regular,
    DancingScript: DancingScript_400Regular,
    Pacifico: Pacifico_400Regular,
  });

  // Read the persisted theme from AsyncStorage before the store rehydrates
  useEffect(() => {
    AsyncStorage.getItem('persist:root').then((raw) => {
      if (!raw) return;
      try {
        const outer = JSON.parse(raw);
        if (outer.theme) {
          const themeState = JSON.parse(outer.theme);
          if (themeState.currentTheme) setSavedTheme(themeState.currentTheme as ThemeKey);
        }
      } catch {
        // fall back to default
      }
    });
  }, []);

  // Show splash for at least 5 seconds while fonts load
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // If fonts not loaded or splash timer not done, show splash
  const showSplash = !fontsLoaded || !splashDone;
  if (showSplash) {
    const Splash = require('../components/Splash').default;
    return <Splash fontsLoaded={fontsLoaded} themeKey={savedTheme} />;
  }

  return (
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={() => {
          const settings = store.getState().settings;
          if (settings) {
            if (settings.biometricLock) {
              setIsLocked(true);
            }
            scheduleDailyReminder(
              settings.notificationsEnabled,
              settings.morningReminderTime,
              settings.nightReminderTime,
              settings.soundEnabled
            );
          }
        }}>
        {isLocked ? (
          <LockScreen onUnlocked={() => setIsLocked(false)} />
        ) : (
          <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
              {/* Creates a fresh diary entry every day at local midnight
                  and on app foreground, so each day always has its own
                  isolated bucket. */}
              <DailyEntryManager />
              <SyncManager />
              <Stack>
                <Stack.Screen
                  name="index"
                  options={{
                    header: () => <CustomHeader />,
                  }}
                />
                <Stack.Screen
                  name="DiaryInput/index"
                  options={{
                    title: 'Diary input',
                    header: ({ navigation }) => <DiaryInputHeader navigation={navigation} />,
                  }}
                />
                <Stack.Screen
                  name="Account/index"
                  options={{
                    title: 'Account',
                    header: () => <AccountHeader />,
                  }}
                />

                <Stack.Screen
                  name="Settings/index"
                  options={{
                    title: 'Settings',
                    header: () => <SettingsHeader />,
                  }}
                />
                <Stack.Screen
                  name="About/index"
                  options={{
                    title: 'About Us',
                    header: () => <AboutHeader />,
                  }}
                />
                <Stack.Screen
                  name="AllEntries/index"
                  options={{
                    title: 'All Entries',
                    header: () => <AllEntriesHeader />,
                  }}
                />
                <Stack.Screen
                  name="Themes/index"
                  options={{
                    title: 'Themes',
                    header: () => <ThemesHeader />,
                  }}
                />
              </Stack>
            </SafeAreaView>
          </SafeAreaProvider>
        )}
      </PersistGate>
    </Provider>
  );
}
