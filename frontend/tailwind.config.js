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
          DEFAULT: '#F4F7FA',
          card: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E3EAF0',
          hover: '#C8D6E5',
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
        // Keep for compatibility
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(20,40,63,0.07), 0 2px 8px rgba(20,40,63,0.05)',
        'card-hover': '0 4px 16px rgba(20,40,63,0.12)',
        modal: '0 8px 32px rgba(20,40,63,0.14)',
      },
    },
  },
  plugins: [],
};
