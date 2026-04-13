import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
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

const CHANNEL_ID = 'diary_reminders';

/**
 * Schedules (or cancels) the two daily diary reminders.
 *
 * Triggers use SchedulableTriggerInputTypes.DAILY so expo-notifications
 * always fires them at the given hour/minute in the device's local timezone,
 * regardless of DST changes or timezone offsets.
 */
export async function scheduleDailyReminder(
  enabled: boolean,
  morningTime: string,
  nightTime: string,
  soundEnabled: boolean
) {
  // Always cancel first to prevent stale / duplicate triggers
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  // Create / update the Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Dream Diary Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: soundEnabled ? 'default' : null,
    });
  }

  // Parse 24-hour "HH:mm" strings into numbers
  const [morningHr, morningMin] = morningTime.split(':').map(Number);
  const [nightHr, nightMin] = nightTime.split(':').map(Number);

  // Schedule morning reminder — fires daily at device local time
  if (!isNaN(morningHr) && !isNaN(morningMin)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good Morning! ☀️',
        body: "Have a great day! Don't forget to write down your morning thoughts and nightly dreams.",
        sound: soundEnabled ? 'default' : undefined,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: morningHr,
        minute: morningMin,
        channelId: CHANNEL_ID,
      },
    });
  }

  // Schedule night reminder — fires daily at device local time
  if (!isNaN(nightHr) && !isNaN(nightMin)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to reflect ✍️',
        body: 'How was your day? Take a moment to jot down your thoughts, reflections, and dreams in your diary.',
        sound: soundEnabled ? 'default' : undefined,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: nightHr,
        minute: nightMin,
        channelId: CHANNEL_ID,
      },
    });
  }
}
