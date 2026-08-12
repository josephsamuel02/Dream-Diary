import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeKey =
  | 'blossom'
  | 'rose'
  | 'lilac'
  | 'cozy'
  | 'night'
  | 'dreamy'
  | 'nature'
  | 'warm'
  | 'dark'
  | 'midnight'
  | 'lavender';

export interface ThemeColors {
  background: string;
  text: string;
  accent: string;
  surface: string;
  error: string;
  headerGradient: [string, string, string];
}

export const THEMES: Record<ThemeKey, ThemeColors> = {
  blossom: {
    background: '#FFF0F6',
    text: '#5C2A3A',
    accent: '#EC4899',
    surface: '#FCE7F3',
    error: '#F87171',
    headerGradient: ['#FBCFE8', '#F9A8D4', '#F472B6'],
  },
  rose: {
    background: '#FFF1F2',
    text: '#6B2737',
    accent: '#E11D48',
    surface: '#FFE4E6',
    error: '#F87171',
    headerGradient: ['#FECDD3', '#FDA4AF', '#FB7185'],
  },
  lilac: {
    background: '#F5F3FF',
    text: '#4C1D95',
    accent: '#8B5CF6',
    surface: '#EDE9FE',
    error: '#F87171',
    headerGradient: ['#DDD6FE', '#C4B5FD', '#A78BFA'],
  },
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
  midnight: {
    background: '#030A1A',
    text: '#F4F1FF',
    accent: '#8B5CF6',
    surface: '#0B1630',
    error: '#FB7185',
    headerGradient: ['#020617', '#0B1630', '#172554'],
  },
  lavender: {
    background: '#FFF8FC',
    text: '#29234F',
    accent: '#8B5CF6',
    surface: '#FFF0FA',
    error: '#F9739A',
    headerGradient: ['#C4B5FD', '#F0ABFC', '#FDA4AF'],
  },
};

export interface ThemeState {
  currentTheme: ThemeKey;
  backgroundImage: string | null;
  backgroundOpacity: number;
}

const initialState: ThemeState = {
  currentTheme: 'dark',
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
export const selectBackgroundOpacity = (state: { theme: ThemeState }) =>
  state.theme.backgroundOpacity;

export default themeSlice.reducer;
