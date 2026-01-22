import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeKey = 'cozy' | 'clean' | 'dreamy' | 'nature' | 'warm' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  accent: string;
  surface: string;
  error: string;
  headerGradient: [string, string, string];
}

export const THEMES: Record<ThemeKey, ThemeColors> = {
  cozy: {
    background: '#F5EDE0',
    text: '#3E2723',
    accent: '#D97706',
    surface: '#FFF7ED',
    error: '#DC2626',
    headerGradient: ['#B45309', '#D97706', '#F5EDE0'],
  },
  clean: {
    background: '#FDFCFB',
    text: '#2D2D2D',
    accent: '#3B82F6',
    surface: '#F9FAFB',
    error: '#EF4444',
    headerGradient: ['#1D4ED8', '#3B82F6', '#FDFCFB'],
  },
  dreamy: {
    background: '#E0E7FF',
    text: '#1E1B4B',
    accent: '#A78BFA',
    surface: '#EEF2FF',
    error: '#B91C1C',
    headerGradient: ['#5B21B6', '#7C3AED', '#E0E7FF'],
  },
  nature: {
    background: '#ECFDF5',
    text: '#064E3B',
    accent: '#10B981',
    surface: '#D1FAE5',
    error: '#DC2626',
    headerGradient: ['#047857', '#059669', '#ECFDF5'],
  },
  warm: {
    background: '#FEF3C7',
    text: '#78350F',
    accent: '#F59E0B',
    surface: '#FFFBEB',
    error: '#B91C1C',
    headerGradient: ['#B45309', '#D97706', '#FEF3C7'],
  },
  dark: {
    background: '#1F2937',
    text: '#F9FAFB',
    accent: '#3B82F6',
    surface: '#374151',
    error: '#EF4444',
    headerGradient: ['#030712', '#111827', '#374151'],
  },
};

export interface ThemeState {
  currentTheme: ThemeKey;
  backgroundImage: string | null;
  backgroundOpacity: number;
}

const initialState: ThemeState = {
  currentTheme: 'cozy',
  backgroundImage: null,
  backgroundOpacity: 0.3,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeKey>) {
      state.currentTheme = action.payload;
    },
    setBackgroundImage(state, action: PayloadAction<string | null>) {
      state.backgroundImage = action.payload;
    },
    setBackgroundOpacity(state, action: PayloadAction<number>) {
      state.backgroundOpacity = Math.max(0, Math.min(1, action.payload));
    },
    clearBackgroundImage(state) {
      state.backgroundImage = null;
    },
  },
});

export const { setTheme, setBackgroundImage, setBackgroundOpacity, clearBackgroundImage } =
  themeSlice.actions;

// Selectors
export const selectCurrentTheme = (state: { theme: ThemeState }) => state.theme.currentTheme;
export const selectThemeColors = (state: { theme: ThemeState }) => THEMES[state.theme.currentTheme];
export const selectBackgroundImage = (state: { theme: ThemeState }) => state.theme.backgroundImage;
export const selectBackgroundOpacity = (state: { theme: ThemeState }) => state.theme.backgroundOpacity;

export default themeSlice.reducer;
