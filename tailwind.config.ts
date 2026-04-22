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
        background: '#faf8f5',
        surface: '#ffffff',
        border: '#e8e0d8',
        text: '#3d3529',
        accent: '#c07a45',
        'meal-mittag': '#c07a45',
        'meal-abend': '#6b5b8a',
        'meal-abendbrot': '#8b6e4e',
        'meal-frueh': '#7a9e6b',
        muted: '#a09080',
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
