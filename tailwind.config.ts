import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DB7144',
          hover: '#C86636',
          light: '#FFF4EF',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#666666',
        },
        background: '#F8F9FA',
        card: '#FFFFFF',
        border: '#E5E5E5',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      fontSize: {
        'h1': ['32px', { fontWeight: '700' }],
        'h2': ['24px', { fontWeight: '600' }],
        'h3': ['20px', { fontWeight: '600' }],
        'body': ['16px', { fontWeight: '400' }],
        'caption': ['14px', { fontWeight: '400' }],
      },
      borderRadius: {
        'button': '8px',
        'card': '16px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
export default config
