import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export type DiaryFontKey =
  | 'RobotoRegular'
  | 'Lora'
  | 'Merriweather'
  | 'Caveat'
  | 'NunitoRegular'
  | 'PlayfairDisplay'
  | 'DancingScript'
  | 'Pacifico';

export interface SettingsState {
  notificationsEnabled: boolean;
  morningReminderTime: string; // HH:mm format
  nightReminderTime: string; // HH:mm format
  biometricLock: boolean;
  soundEnabled: boolean;
  username: string;
  email: string;
  profilePhoto: string | null;
  // Cloud sync
  cloudSyncEnabled: boolean;
  lastSyncedAt: string | null; // ISO timestamp of last successful sync
  // Diary font
  diaryFont: DiaryFontKey;
}

const initialState: SettingsState = {
  notificationsEnabled: true,
  morningReminderTime: '09:00',
  nightReminderTime: '20:00',
  biometricLock: false,
  soundEnabled: true,
  username: 'Dreamer',
  email: 'dreamer@example.com',
  profilePhoto: null,
  cloudSyncEnabled: false,
  lastSyncedAt: null,
  diaryFont: 'RobotoRegular',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleNotifications: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    setMorningReminder: (state, action: PayloadAction<string>) => {
      state.morningReminderTime = action.payload;
    },
    setNightReminder: (state, action: PayloadAction<string>) => {
      state.nightReminderTime = action.payload;
    },
    toggleBiometricLock: (state, action: PayloadAction<boolean>) => {
      state.biometricLock = action.payload;
    },
    toggleSound: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    updateAccountProfile: (state, action: PayloadAction<{ username: string; email: string }>) => {
      state.username = action.payload.username;
      state.email = action.payload.email;
    },
    updateProfilePhoto: (state, action: PayloadAction<string | null>) => {
      state.profilePhoto = action.payload;
    },
    setCloudSync: (state, action: PayloadAction<boolean>) => {
      state.cloudSyncEnabled = action.payload;
    },
    setLastSyncedAt: (state, action: PayloadAction<string | null>) => {
      state.lastSyncedAt = action.payload;
    },
    setDiaryFont: (state, action: PayloadAction<DiaryFontKey>) => {
      state.diaryFont = action.payload;
    },
  },
});

export const {
  toggleNotifications,
  setMorningReminder,
  setNightReminder,
  toggleBiometricLock,
  toggleSound,
  updateAccountProfile,
  updateProfilePhoto,
  setCloudSync,
  setLastSyncedAt,
  setDiaryFont,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
