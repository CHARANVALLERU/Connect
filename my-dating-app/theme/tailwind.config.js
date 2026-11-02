/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Basic theme (light)
        basic: {
          background: '#FFFFFF',
          surface: '#F8F9FA',
          text: '#1A1A1A',
          primary: '#4A90E2',
          secondary: '#6C757D',
          accent: '#E9ECEF',
          border: '#DEE2E6',
          card: '#FFFFFF',
          gold: '#FFD700',
          platinum: '#E5E4E2'
        },
        // Elite theme (dark luxury)
        elite: {
          background: '#0A0A0A',
          surface: '#1A1A1A',
          text: '#E5E5E5',
          primary: '#D4AF37',
          secondary: '#404040',
          accent: '#2D2D2D',
          border: '#404040',
          card: '#1F1F1F',
          gold: '#FFD700',
          platinum: '#E5E4E2'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem'
      },
      fontSize: {
        '32': '2rem',
        '24': '1.5rem',
        '20': '1.25rem',
        '16': '1rem',
        '12': '0.75rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      }
    },
  },
  plugins: [],
}