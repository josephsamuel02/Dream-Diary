import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectSettings, toggleNotifications, setMorningReminder, setNightReminder, toggleBiometricLock, toggleSound } from '~/store/slices/settingsSlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { scheduleDailyReminder } from '~/util/notifications';
import TimePickerModal from '~/components/TimePickerModal';

export default function Settings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const themeColors = useAppSelector(selectThemeColors);

  const [pickerTarget, setPickerTarget] = useState<'morning' | 'night' | null>(null);

  const formatAMPM = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleToggleNotifications = async (val: boolean) => {
    dispatch(toggleNotifications(val));
    await scheduleDailyReminder(val, settings.morningReminderTime, settings.nightReminderTime, settings.soundEnabled);
  };

  const handleToggleBiometric = async (val: boolean) => {
    if (val) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support biometric authentication.');
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Not Configured', 'No biometrics are enrolled on this device. Please set them up in settings.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable App Lock',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) dispatch(toggleBiometricLock(true));
    } else {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to disable App Lock',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) dispatch(toggleBiometricLock(false));
    }
  };

  const handlePickerConfirm = async (time: string) => {
    if (pickerTarget === 'morning') {
      dispatch(setMorningReminder(time));
      if (settings.notificationsEnabled)
        await scheduleDailyReminder(true, time, settings.nightReminderTime, settings.soundEnabled);
    } else if (pickerTarget === 'night') {
      dispatch(setNightReminder(time));
      if (settings.notificationsEnabled)
        await scheduleDailyReminder(true, settings.morningReminderTime, time, settings.soundEnabled);
    }
    setPickerTarget(null);
  };

  const currentPickerValue =
    pickerTarget === 'morning'
      ? settings.morningReminderTime
      : pickerTarget === 'night'
        ? settings.nightReminderTime
        : '09:00';

  return (
    <ScrollView className="flex-1 px-4 pt-6" style={{ backgroundColor: themeColors.background }}>

      {/* Notifications Section */}
      <View style={[styles.card, { shadowColor: themeColors.accent }]}>
        {/* Section header */}
        <View className="mb-4 flex-row items-center">
          <View style={[styles.iconBadge, { backgroundColor: themeColors.accent + '15' }]}>
            <Ionicons name="notifications" size={20} color={themeColors.accent} />
          </View>
          <View>
            <Text className="font-poppins-bold text-lg text-gray-800">Notifications</Text>
            <Text className="font-roboto text-xs text-gray-400">Daily reminders for your diary</Text>
          </View>
        </View>

        {/* Enable / disable toggle */}
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text className="font-roboto-medium text-[15px] text-gray-800">Daily Reminders</Text>
            <Text className="font-roboto text-xs text-gray-500">Get nudged morning &amp; night</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: themeColors.accent, false: '#e5e7eb' }}
          />
        </View>

        {settings.notificationsEnabled && (
          <>
            <View style={styles.divider} />

            {/* Morning time row */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => setPickerTarget('morning')}>
              <View style={styles.rowLeft}>
                <View style={[styles.timeIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="sunny" size={16} color="#F59E0B" />
                </View>
                <View style={styles.rowInfo}>
                  <Text className="font-roboto-medium text-[15px] text-gray-800">Morning Reminder</Text>
                  <Text className="font-roboto text-xs text-gray-500">Start your day with intention</Text>
                </View>
              </View>
              <View style={[styles.timeBadge, { borderColor: themeColors.accent + '40', backgroundColor: themeColors.accent + '08' }]}>
                <Text style={[styles.timeBadgeText, { color: themeColors.accent }]}>
                  {formatAMPM(settings.morningReminderTime)}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={themeColors.accent} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Night time row */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => setPickerTarget('night')}>
              <View style={styles.rowLeft}>
                <View style={[styles.timeIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="moon" size={16} color="#6366F1" />
                </View>
                <View style={styles.rowInfo}>
                  <Text className="font-roboto-medium text-[15px] text-gray-800">Night Reflection</Text>
                  <Text className="font-roboto text-xs text-gray-500">Wind down and reflect</Text>
                </View>
              </View>
              <View style={[styles.timeBadge, { borderColor: themeColors.accent + '40', backgroundColor: themeColors.accent + '08' }]}>
                <Text style={[styles.timeBadgeText, { color: themeColors.accent }]}>
                  {formatAMPM(settings.nightReminderTime)}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={themeColors.accent} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Sound toggle */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.timeIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="volume-high" size={16} color="#22C55E" />
                </View>
                <View style={styles.rowInfo}>
                  <Text className="font-roboto-medium text-[15px] text-gray-800">Alert Sound</Text>
                  <Text className="font-roboto text-xs text-gray-500">Play sound with notification</Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(val) => {
                  dispatch(toggleSound(val));
                  if (settings.notificationsEnabled)
                    scheduleDailyReminder(true, settings.morningReminderTime, settings.nightReminderTime, val);
                }}
                trackColor={{ true: themeColors.accent, false: '#e5e7eb' }}
              />
            </View>

            {/* Schedule summary */}
            <View style={[styles.scheduleSummary, { backgroundColor: themeColors.accent + '08', borderColor: themeColors.accent + '20' }]}>
              <Ionicons name="time-outline" size={13} color={themeColors.accent} />
              <Text style={[styles.scheduleText, { color: themeColors.accent }]}>
                Active schedule: {formatAMPM(settings.morningReminderTime)} &amp; {formatAMPM(settings.nightReminderTime)} daily
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Security Section */}
      <View style={[styles.card, { shadowColor: '#f97316' }]}>
        <View className="mb-4 flex-row items-center">
          <View style={[styles.iconBadge, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="lock-closed" size={20} color="#f97316" />
          </View>
          <View>
            <Text className="font-poppins-bold text-lg text-gray-800">Privacy &amp; Security</Text>
            <Text className="font-roboto text-xs text-gray-400">Protect your diary</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.timeIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="finger-print" size={16} color="#f97316" />
            </View>
            <View style={styles.rowInfo}>
              <Text className="font-roboto-medium text-[15px] text-gray-800">App Lock</Text>
              <Text className="font-roboto text-xs text-gray-500">Require face / fingerprint on open</Text>
            </View>
          </View>
          <Switch
            value={settings.biometricLock}
            onValueChange={handleToggleBiometric}
            trackColor={{ true: '#f97316', false: '#e5e7eb' }}
          />
        </View>
      </View>

      {/* Time picker modal */}
      <TimePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'morning' ? 'Morning Reminder' : 'Night Reflection'}
        value={currentPickerValue}
        accentColor={themeColors.accent}
        onConfirm={handlePickerConfirm}
        onCancel={() => setPickerTarget(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowInfo: {
    flex: 1,
  },
  timeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timeBadgeText: {
    fontFamily: 'PoppinsBold',
    fontSize: 13,
  },
  scheduleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scheduleText: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    flex: 1,
  },
});
