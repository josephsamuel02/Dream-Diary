import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAppDialog } from '~/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import {
  selectSettings,
  toggleNotifications,
  setMorningReminder,
  setNightReminder,
  toggleBiometricLock,
  toggleSound,
} from '~/store/slices/settingsSlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { scheduleDailyReminder } from '~/util/notifications';
import TimePickerModal from '~/components/TimePickerModal';

export default function Settings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const tc = useAppSelector(selectThemeColors);

  const [pickerTarget, setPickerTarget] = useState<'morning' | 'night' | null>(null);
  const { showDialog, dialogElement } = useAppDialog();

  const formatAMPM = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleToggleNotifications = async (val: boolean) => {
    dispatch(toggleNotifications(val));
    await scheduleDailyReminder(
      val,
      settings.morningReminderTime,
      settings.nightReminderTime,
      settings.soundEnabled
    );
  };

  const handleToggleBiometric = async (val: boolean) => {
    if (val) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        showDialog({
          title: 'Not Supported',
          message: 'Your device does not support biometric authentication.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        showDialog({
          title: 'Not Configured',
          message: 'No biometrics are enrolled on this device. Please set them up in settings.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
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
        await scheduleDailyReminder(
          true,
          time,
          settings.nightReminderTime,
          settings.soundEnabled
        );
    } else if (pickerTarget === 'night') {
      dispatch(setNightReminder(time));
      if (settings.notificationsEnabled)
        await scheduleDailyReminder(
          true,
          settings.morningReminderTime,
          time,
          settings.soundEnabled
        );
    }
    setPickerTarget(null);
  };

  const currentPickerValue =
    pickerTarget === 'morning'
      ? settings.morningReminderTime
      : pickerTarget === 'night'
        ? settings.nightReminderTime
        : '09:00';

  const sub = tc.text + '70';
  const muted = tc.text + '45';
  const dividerColor = tc.text + '12';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tc.background }}
      contentContainerStyle={styles.scrollContent}>

      {/* ── Notifications ─────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: tc.surface, shadowColor: tc.accent }]}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: tc.accent + '20' }]}>
            <Ionicons name="notifications" size={20} color={tc.accent} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: tc.text }]}>Notifications</Text>
            <Text style={[styles.cardSubtitle, { color: sub }]}>Daily reminders for your diary</Text>
          </View>
        </View>

        {/* Master toggle */}
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowLabel, { color: tc.text }]}>Daily Reminders</Text>
            <Text style={[styles.rowSub, { color: sub }]}>Get nudged morning &amp; night</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ true: tc.accent, false: muted }}
            thumbColor="#fff"
          />
        </View>

        {settings.notificationsEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            {/* Morning row */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => setPickerTarget('morning')}>
              <View style={styles.rowLeft}>
                <View style={[styles.miniIcon, { backgroundColor: tc.accent + '18' }]}>
                  <Ionicons name="sunny" size={15} color={tc.accent} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: tc.text }]}>Morning Reminder</Text>
                  <Text style={[styles.rowSub, { color: sub }]}>Start your day with intention</Text>
                </View>
              </View>
              <View style={[styles.timePill, { borderColor: tc.accent + '50', backgroundColor: tc.accent + '15' }]}>
                <Ionicons name="time-outline" size={11} color={tc.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.timePillText, { color: tc.accent }]}>
                  {formatAMPM(settings.morningReminderTime)}
                </Text>
                <Ionicons name="chevron-forward" size={11} color={tc.accent + 'C0'} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            {/* Night row */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => setPickerTarget('night')}>
              <View style={styles.rowLeft}>
                <View style={[styles.miniIcon, { backgroundColor: tc.accent + '18' }]}>
                  <Ionicons name="moon" size={15} color={tc.accent} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: tc.text }]}>Night Reflection</Text>
                  <Text style={[styles.rowSub, { color: sub }]}>Wind down and reflect</Text>
                </View>
              </View>
              <View style={[styles.timePill, { borderColor: tc.accent + '50', backgroundColor: tc.accent + '15' }]}>
                <Ionicons name="time-outline" size={11} color={tc.accent} style={{ marginRight: 4 }} />
                <Text style={[styles.timePillText, { color: tc.accent }]}>
                  {formatAMPM(settings.nightReminderTime)}
                </Text>
                <Ionicons name="chevron-forward" size={11} color={tc.accent + 'C0'} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: dividerColor }]} />

            {/* Sound toggle */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.miniIcon, { backgroundColor: tc.accent + '18' }]}>
                  <Ionicons name="volume-high" size={15} color={tc.accent} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: tc.text }]}>Alert Sound</Text>
                  <Text style={[styles.rowSub, { color: sub }]}>Play sound with notification</Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(val) => {
                  dispatch(toggleSound(val));
                  if (settings.notificationsEnabled)
                    scheduleDailyReminder(
                      true,
                      settings.morningReminderTime,
                      settings.nightReminderTime,
                      val
                    );
                }}
                trackColor={{ true: tc.accent, false: muted }}
                thumbColor="#fff"
              />
            </View>

            {/* Active schedule banner */}
            <View
              style={[
                styles.scheduleBanner,
                { backgroundColor: tc.accent + '12', borderColor: tc.accent + '30' },
              ]}>
              <Ionicons name="calendar-outline" size={13} color={tc.accent} />
              <Text style={[styles.scheduleBannerText, { color: tc.accent }]}>
                Active: {formatAMPM(settings.morningReminderTime)} &amp;{' '}
                {formatAMPM(settings.nightReminderTime)} daily
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── Privacy & Security ────────────────────────── */}
      <View style={[styles.card, { backgroundColor: tc.surface, shadowColor: tc.accent }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: tc.accent + '20' }]}>
            <Ionicons name="lock-closed" size={20} color={tc.accent} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: tc.text }]}>Privacy &amp; Security</Text>
            <Text style={[styles.cardSubtitle, { color: sub }]}>Protect your diary</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.miniIcon, { backgroundColor: tc.accent + '18' }]}>
              <Ionicons name="finger-print" size={15} color={tc.accent} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: tc.text }]}>App Lock</Text>
              <Text style={[styles.rowSub, { color: sub }]}>Require face / fingerprint on open</Text>
            </View>
          </View>
          <Switch
            value={settings.biometricLock}
            onValueChange={handleToggleBiometric}
            trackColor={{ true: tc.accent, false: muted }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* ── Time Picker Modal ─────────────────────────── */}
      <TimePickerModal
        visible={pickerTarget !== null}
        title={pickerTarget === 'morning' ? 'Morning Reminder' : 'Night Reflection'}
        icon={pickerTarget === 'morning' ? 'sunny' : 'moon'}
        value={currentPickerValue}
        accentColor={tc.accent}
        backgroundColor={tc.background}
        surfaceColor={tc.surface}
        textColor={tc.text}
        onConfirm={handlePickerConfirm}
        onCancel={() => setPickerTarget(null)}
      />
      {dialogElement}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 16,
  },
  cardSubtitle: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    height: 1,
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
  rowLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 14,
  },
  rowSub: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    marginTop: 1,
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timePillText: {
    fontFamily: 'PoppinsBold',
    fontSize: 13,
  },
  scheduleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  scheduleBannerText: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    flex: 1,
  },
});
