/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#14283F',
          secondary: '#1D3854',
          900: '#0f172a',
          800: '#14283F',
          700: '#1D3854',
        },
        cyan: {
          DEFAULT: '#16B8C9',
          hover: '#119EAD',
          500: '#16B8C9',
          600: '#119EAD',
        },
        surface: {
          DEFAULT: '#E8EEF5',
          card: '#F8FAFC',
        },
        border: {
          DEFAULT: '#DCE5EE',
          hover: '#CBD5E1',
        },
        success: {
          bg: '#E3F4EC',
          text: '#26734D',
          DEFAULT: '#26734D',
        },
        warning: {
          bg: '#FFF2DB',
          text: '#98651C',
          DEFAULT: '#98651C',
        },
        danger: {
          bg: '#FCEAEA',
          text: '#B54747',
          DEFAULT: '#B54747',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(20,40,63,0.05)',
        'card-hover': '0 3px 10px rgba(20,40,63,0.08)',
        modal: '0 6px 24px rgba(20,40,63,0.12)',
      },
    },
  },
  plugins: [],
};
