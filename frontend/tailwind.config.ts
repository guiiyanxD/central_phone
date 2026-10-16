import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC', // Slate 50
        foreground: '#0F172A', // Slate 900
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#F1F5F9', // Slate 100
          border: '#E2E8F0',   // Slate 200
        },
        primary: {
          DEFAULT: '#0F172A', // Slate 900 (Apple Minimalist Monochrome)
          hover: '#1E293B',   // Slate 800
          foreground: '#FFFFFF',
          soft: '#F1F5F9',
          border: '#E2E8F0',
        },
        accent: {
          flame: '#F97316', // Sunset Coral Flame
          sunset: '#EA580C',
          soft: '#FFF7ED',
          border: '#FED7AA',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        success: {
          DEFAULT: '#059669', // Emerald 600
          foreground: '#FFFFFF',
          soft: '#ECFDF5',
          border: '#A7F3D0',
        },
        warning: {
          DEFAULT: '#D97706', // Amber 600
          foreground: '#FFFFFF',
          soft: '#FFFBEB',
          border: '#FDE68A',
        },
        destructive: {
          DEFAULT: '#DC2626', // Red 600
          foreground: '#FFFFFF',
          soft: '#FEF2F2',
          border: '#FECACA',
        },
        info: {
          DEFAULT: '#2563EB', // Blue 600
          foreground: '#FFFFFF',
          soft: '#EFF6FF',
          border: '#BFDBFE',
        },
        muted: {
          DEFAULT: '#F8FAFC',
          foreground: '#64748B', // Slate 500
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        card: '0 2px 6px -1px rgb(0 0 0 / 0.05), 0 1px 4px -2px rgb(0 0 0 / 0.05)',
        elevated: '0 10px 25px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.03)',
      },
    },
  },
  plugins: [],
};
export default config;
