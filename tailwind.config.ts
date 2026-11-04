import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1240px' },
    },
    extend: {
      colors: {
        // Warm-neutral palette. All text pairs meet WCAG AA on `paper` and `surface`.
        paper: '#FAF8F4',
        surface: '#FFFFFF',
        sand: '#F2EEE6',
        line: '#E6E0D5',
        ink: { DEFAULT: '#151412', soft: '#3B3833' },
        muted: '#6A655D', // 5.4:1 on paper
        accent: { DEFAULT: '#8A6A31', soft: '#F3ECDD', strong: '#6F5424' }, // bronze, 5.1:1 on paper
        whatsapp: { DEFAULT: '#15803D', hover: '#166534' }, // white text ≥ 5:1
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6.5vw, 5.25rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.25rem, 4.5vw, 3.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.875rem, 3.2vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(21,20,18,0.04), 0 8px 24px -12px rgba(21,20,18,0.12)',
        lift: '0 2px 4px rgba(21,20,18,0.04), 0 24px 48px -20px rgba(21,20,18,0.25)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
export default config
