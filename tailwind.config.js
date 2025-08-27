/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      // Clean Palette
      clean_background: '#FDFCFB',
      clean_text: '#2D2D2D',
      clean_accent: '#3B82F6',
      clean_surface: '#F9FAFB',
      clean_error: '#EF4444',

      // Cozy Palette
      cozy_background: '#F5EDE0',
      cozy_text: '#3E2723',
      cozy_accent: '#D97706',
      cozy_surface: '#FFF7ED',
      cozy_error: '#DC2626',

      // Dreamy Palette
      dreamy_background: '#E0E7FF',
      dreamy_text: '#1E1B4B',
      dreamy_accent: '#A78BFA',
      dreamy_surface: '#EEF2FF',
      dreamy_error: '#B91C1C',

      // Minimal Palette
      minimal_background: '#FFFFFF',
      minimal_text: '#111827',
      minimal_accent: '#6B7280',
      minimal_surface: '#F3F4F6',
      minimal_error: '#F87171',

      // Nature Palette
      nature_background: '#ECFDF5',
      nature_text: '#064E3B',
      nature_accent: '#10B981',
      nature_surface: '#D1FAE5',
      nature_error: '#DC2626',

      // Pastel Palette
      pastel_background: '#FFF1F2',
      pastel_text: '#4B5563',
      pastel_accent: '#F472B6',
      pastel_surface: '#FFE4E6',
      pastel_error: '#F87171',

      // Warm Palette
      warm_background: '#FEF3C7',
      warm_text: '#78350F',
      warm_accent: '#F59E0B',
      warm_surface: '#FFFBEB',
      warm_error: '#B91C1C',

      // Dark Palette
      dark_background: '#1F2937',
      dark_text: '#F9FAFB',
      dark_accent: '#3B82F6',
      dark_surface: '#374151',
      dark_error: '#EF4444',
    },
  },

  extend: {
    fontFamily: {
      poppins: ['PoppinsRegular'],
      'poppins-bold': ['PoppinsBold'],
      roboto: ['RobotoRegular'],
      'roboto-medium': ['RobotoMedium'],
      arizonia: ['Arizonia'],
    },
  },
  plugins: [],
};
