import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Handle incoming notifications while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleDailyReminder(
  enabled: boolean,
  morningTime: string,
  nightTime: string,
  soundEnabled: boolean
) {
  // Clear existing notifications to prevent duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask for permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: soundEnabled ? 'default' : null,
    });
  }

  // Parse times
  const [morningHr, morningMin] = morningTime.split(':').map(Number);
  const [nightHr, nightMin] = nightTime.split(':').map(Number);

  // Schedule morning reminder
  if (!isNaN(morningHr)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good Morning! ☀️',
        body: "Have a great day! Don't forget to write down your morning thoughts and nightly dreams.",
        sound: soundEnabled,
      },
      trigger: {
        hour: morningHr,
        minute: morningMin,
        repeats: true,
        channelId: 'default',
      } as any,
    });
  }

  // Schedule night reminder
  if (!isNaN(nightHr)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to reflect ✍️',
        body: 'How was your day? Take a moment to jot down your thoughts, reflections, and dreams in your diary.',
        sound: soundEnabled,
      },
      trigger: {
        hour: nightHr,
        minute: nightMin,
        repeats: true,
        channelId: 'default',
      } as any,
    });
  }
}
