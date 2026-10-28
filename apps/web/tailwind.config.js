/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        akfa: {
          50: '#f0f6ff',
          100: '#e0edfe',
          200: '#bae0fd',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#0f235c',
        },
        present: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        absent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        workshop: {
          bg: '#F3F5F7',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#64748B',
          light: '#F8FAFC',
        },
      },
      boxShadow: {
        'clay-sm': 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 2px 4px rgba(15, 23, 42, 0.05)',
        'clay-card': 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
        'clay-btn': 'inset 0 1px 1px rgba(255, 255, 255, 0.7), 0 3px 6px -1px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'clay-pressed': 'inset 0 2px 4px rgba(15, 23, 42, 0.12), inset 0 1px 2px rgba(15, 23, 42, 0.08)',
        'clay-pill': 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 2px 5px rgba(15, 23, 42, 0.07)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        'clay': '16px',
        'clay-lg': '20px',
        'clay-pill': '9999px',
      },
    },
  },
  plugins: [],
};
