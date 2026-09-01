/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111184',
          dark: '#03035B',
          darker: '#000080',
          light: '#E8E8F7',
          lighter: '#F4F4FB',
        },
        accent: {
          DEFAULT: '#FFA500',
          dark: '#D97706',
          light: '#FFF4E5',
          lighter: '#FFF9F0',
        },
        danger: {
          DEFAULT: '#DF2C2E',
          dark: '#B91C1C',
          light: '#FDE8E8',
          lighter: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          lighter: '#FFFBEB',
        },
        success: {
          DEFAULT: '#15803D',
          dark: '#166534',
          light: '#E6F4EA',
          lighter: '#F0FDF4',
        },
        neutral: {
          25: '#FCFCFD',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        surface: '#FFFFFF',
        background: '#F6F8FC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sm: '0 1px 2px rgba(15, 23, 42, 0.03), 0 2px 6px rgba(15, 23, 42, 0.04)',
        md: '0 10px 30px rgba(15, 23, 42, 0.06)',
        lg: '0 20px 40px rgba(15, 23, 42, 0.08)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
      maxWidth: {
        content: '1440px',
      },
    },
  },
  plugins: [],
}
