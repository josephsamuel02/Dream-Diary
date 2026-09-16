/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      //default
      white: '#ffffff',
      black: '#000000',

      // NOTE: generated from THEMES in src/store/slices/themeSlice.ts.
      // All app colors come from the Redux theme at runtime; these entries
      // only exist so `bg-<theme>-*` / `text-<theme>-*` utilities resolve to
      // the same values. Keep in sync when THEMES changes.

      // Blossom Palette
      blossom_background: '#FFF0F6',
      blossom_text: '#5C2A3A',
      blossom_accent: '#EC4899',
      blossom_surface: '#FCE7F3',
      blossom_error: '#F87171',

      // Rose Palette
      rose_background: '#FFF1F2',
      rose_text: '#6B2737',
      rose_accent: '#E11D48',
      rose_surface: '#FFE4E6',
      rose_error: '#F87171',

      // Lilac Palette
      lilac_background: '#F5F3FF',
      lilac_text: '#4C1D95',
      lilac_accent: '#8B5CF6',
      lilac_surface: '#EDE9FE',
      lilac_error: '#F87171',

      // Cozy Palette
      cozy_background: '#2C1810',
      cozy_text: '#F5E6D3',
      cozy_accent: '#E8923A',
      cozy_surface: '#3D2215',
      cozy_error: '#F87171',

      // Night Palette
      night_background: '#0F1729',
      night_text: '#E2E8F0',
      night_accent: '#60A5FA',
      night_surface: '#1E2D45',
      night_error: '#F87171',

      // Dreamy Palette
      dreamy_background: '#1E1433',
      dreamy_text: '#EDE9FE',
      dreamy_accent: '#A78BFA',
      dreamy_surface: '#2D1F4E',
      dreamy_error: '#F87171',

      // Nature Palette
      nature_background: '#052E16',
      nature_text: '#D1FAE5',
      nature_accent: '#34D399',
      nature_surface: '#064E3B',
      nature_error: '#F87171',

      // Warm Palette
      warm_background: '#3B1A08',
      warm_text: '#FEF3C7',
      warm_accent: '#FBBF24',
      warm_surface: '#5C2B0D',
      warm_error: '#F87171',

      // Dark Palette
      dark_background: '#000000',
      dark_text: '#FFFFFF',
      dark_accent: '#FFFFFF',
      dark_surface: '#1C1C1C',
      dark_error: '#FF4444',

      // Midnight Palette
      midnight_background: '#030A1A',
      midnight_text: '#F4F1FF',
      midnight_accent: '#8B5CF6',
      midnight_surface: '#0B1630',
      midnight_error: '#FB7185',

      // Lavender Palette
      lavender_background: '#FFF8FC',
      lavender_text: '#29234F',
      lavender_accent: '#8B5CF6',
      lavender_surface: '#FFF0FA',
      lavender_error: '#F9739A',
    },

    extend: {
      fontFamily: {
        poppins: ['PoppinsRegular', 'sans-serif'],
        'poppins-bold': ['PoppinsBold', 'sans-serif'],
        roboto: ['RobotoRegular', 'sans-serif'],
        'roboto-medium': ['RobotoMedium', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
