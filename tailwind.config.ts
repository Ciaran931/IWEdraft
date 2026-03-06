import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FDFBF7',
        terracotta: {
          DEFAULT: '#B5573A',
          light: '#D4735A',
          muted: '#C8886E',
        },
        ink: '#2C2C2C',
        muted: '#6B6B6B',
        sidebar: '#F4F0EA',
        border: '#D9D3C9',
        srs: {
          new: '#6B7FD7',
          learning: '#E8A850',
          review: '#5BA4CF',
          mature: '#6BBF6B',
        },
        mindmap: {
          grey: '#D0D0D0',
          orange: '#E8A850',
          green: '#6BBF6B',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {},
    },
  },
  plugins: [],
}

export default config
