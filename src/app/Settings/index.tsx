import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectSettings, toggleNotifications, setMorningReminder, setNightReminder, toggleBiometricLock, toggleSound } from '~/store/slices/settingsSlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { scheduleDailyReminder } from '~/util/notifications';

export default function Settings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const themeColors = useAppSelector(selectThemeColors);

  const MORNING_TIMES = ["05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00"];
  const NIGHT_TIMES = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

  const cycleMorningTime = (current: string) => {
    const idx = MORNING_TIMES.indexOf(current);
    if (idx >= 0 && idx < MORNING_TIMES.length - 1) return MORNING_TIMES[idx + 1];
    return MORNING_TIMES[0];
  };

  const cycleNightTime = (current: string) => {
    const idx = NIGHT_TIMES.indexOf(current);
    if (idx >= 0 && idx < NIGHT_TIMES.length - 1) return NIGHT_TIMES[idx + 1];
    return NIGHT_TIMES[0];
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
      if (result.success) {
        dispatch(toggleBiometricLock(true));
      }
    } else {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to disable App Lock',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        dispatch(toggleBiometricLock(false));
      }
    }
  };

  const handleChangeMorningTime = async () => {
    const next = cycleMorningTime(settings.morningReminderTime);
    dispatch(setMorningReminder(next));
    if (settings.notificationsEnabled) {
      await scheduleDailyReminder(settings.notificationsEnabled, next, settings.nightReminderTime, settings.soundEnabled);
    }
  };

  const handleChangeNightTime = async () => {
    const next = cycleNightTime(settings.nightReminderTime);
    dispatch(setNightReminder(next));
    if (settings.notificationsEnabled) {
      await scheduleDailyReminder(settings.notificationsEnabled, settings.morningReminderTime, next, settings.soundEnabled);
    }
  };

  const formatAMPM = (timeStr: string) => {
    let [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <ScrollView className="flex-1 px-4 pt-6" style={{ backgroundColor: themeColors.background }}>
      
      {/* Notifications Section */}
      <View className="mb-6 rounded-3xl bg-white p-5 shadow-sm shadow-gray-200">
        <View className="mb-4 flex-row items-center">
          <View className="mr-3 rounded-xl bg-indigo-50 p-2">
            <Ionicons name="notifications" size={20} color={themeColors.accent} />
          </View>
          <Text className="font-poppins-bold text-lg text-gray-800">Notifications</Text>
        </View>

        <View className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
           <View>
             <Text className="font-roboto-medium text-[15px] text-gray-800">Reminders</Text>
             <Text className="font-roboto text-xs text-gray-500">Enable daily notifications</Text>
           </View>
           <Switch value={settings.notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ true: themeColors.accent, false: '#e5e7eb' }} />
        </View>

        {settings.notificationsEnabled && (
          <>
            <TouchableOpacity onPress={handleChangeMorningTime} activeOpacity={0.7} className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
              <View>
                <Text className="font-roboto-medium text-[15px] text-gray-800">Morning Ping</Text>
                <Text className="font-roboto text-xs text-gray-500">Tap to cycle times</Text>
              </View>
              <View className="rounded-full bg-gray-100 px-3 py-1.5">
                <Text className="font-poppins-bold text-[13px] text-gray-700">{formatAMPM(settings.morningReminderTime)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleChangeNightTime} activeOpacity={0.7} className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
              <View>
                <Text className="font-roboto-medium text-[15px] text-gray-800">Night Reflection</Text>
                <Text className="font-roboto text-xs text-gray-500">Tap to cycle times</Text>
              </View>
              <View className="rounded-full bg-gray-100 px-3 py-1.5">
                <Text className="font-poppins-bold text-[13px] text-gray-700">{formatAMPM(settings.nightReminderTime)}</Text>
              </View>
            </TouchableOpacity>
            
            <View className="flex-row items-center justify-between pt-2">
              <Text className="font-roboto-medium text-[15px] text-gray-800">Alert Sound</Text>
              <Switch 
                value={settings.soundEnabled} 
                onValueChange={(val) => {
                  dispatch(toggleSound(val));
                  if (settings.notificationsEnabled) scheduleDailyReminder(settings.notificationsEnabled, settings.morningReminderTime, settings.nightReminderTime, val);
                }} 
                trackColor={{ true: themeColors.accent, false: '#e5e7eb' }}
              />
            </View>
          </>
        )}
      </View>

      {/* Security Section */}
      <View className="mb-6 rounded-3xl bg-white p-5 shadow-sm shadow-gray-200">
        <View className="mb-4 flex-row items-center">
          <View className="mr-3 rounded-xl bg-orange-50 p-2">
            <Ionicons name="lock-closed" size={20} color="#f97316" />
          </View>
          <Text className="font-poppins-bold text-lg text-gray-800">Privacy & Security</Text>
        </View>

        <View className="flex-row items-center justify-between">
           <View>
             <Text className="font-roboto-medium text-[15px] text-gray-800">App Lock</Text>
             <Text className="font-roboto text-xs text-gray-500">Require face/fingerprint</Text>
           </View>
           <Switch value={settings.biometricLock} onValueChange={handleToggleBiometric} trackColor={{ true: themeColors.accent, false: '#e5e7eb' }} />
        </View>
      </View>


      
    </ScrollView>
  );
}
