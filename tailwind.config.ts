import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        surface: '#f5f5f5',
        border: '#e5e5e5',
        text: '#1a1a1a',
        accent: '#2563eb',
        'meal-mittag': '#2563eb',
        'meal-abend': '#7c3aed',
        'meal-abendbrot': '#d97706',
        'meal-frueh': '#059669',
        muted: '#888888',
      },
    },
  },
  safelist: [
    'text-meal-frueh',
    'text-meal-mittag',
    'text-meal-abend',
    'text-meal-abendbrot',
  ],
  plugins: [],
};

export default config;
