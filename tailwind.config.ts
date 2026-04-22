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
        surface: '#16213e',
        background: '#1a1a2e',
        accent: '#7aa2f7',
        'meal-mittag': '#7aa2f7',
        'meal-abend': '#bb86fc',
        'meal-abendbrot': '#f7c97a',
        'meal-frueh': '#73daca',
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
