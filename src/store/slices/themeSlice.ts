import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeKey = 'cozy' | 'night' | 'dreamy' | 'nature' | 'warm' | 'dark';

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
    background: '#2C1810',
    text: '#F5E6D3',
    accent: '#E8923A',
    surface: '#3D2215',
    error: '#F87171',
    headerGradient: ['#0F0805', '#2C1810', '#3D2215'],
  },
  night: {
    background: '#0F1729',
    text: '#E2E8F0',
    accent: '#60A5FA',
    surface: '#1E2D45',
    error: '#F87171',
    headerGradient: ['#050A14', '#0F1729', '#1E2D45'],
  },
  dreamy: {
    background: '#1E1433',
    text: '#EDE9FE',
    accent: '#A78BFA',
    surface: '#2D1F4E',
    error: '#F87171',
    headerGradient: ['#0D0A1A', '#1E1433', '#2D1F4E'],
  },
  nature: {
    background: '#052E16',
    text: '#D1FAE5',
    accent: '#34D399',
    surface: '#064E3B',
    error: '#F87171',
    headerGradient: ['#022010', '#052E16', '#064E3B'],
  },
  warm: {
    background: '#3B1A08',
    text: '#FEF3C7',
    accent: '#FBBF24',
    surface: '#5C2B0D',
    error: '#F87171',
    headerGradient: ['#1C0D04', '#3B1A08', '#5C2B0D'],
  },
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    accent: '#FFFFFF',
    surface: '#1C1C1C',
    error: '#FF4444',
    headerGradient: ['#000000', '#0D0D0D', '#1C1C1C'],
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
