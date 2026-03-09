import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        terracotta: {
          DEFAULT: 'rgb(var(--color-terracotta) / <alpha-value>)',
          light: 'rgb(var(--color-terracotta-light) / <alpha-value>)',
          muted: 'rgb(var(--color-terracotta-muted) / <alpha-value>)',
        },
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        srs: {
          new: 'rgb(var(--color-srs-new) / <alpha-value>)',
          learning: 'rgb(var(--color-srs-learning) / <alpha-value>)',
          review: 'rgb(var(--color-srs-review) / <alpha-value>)',
          mature: 'rgb(var(--color-srs-mature) / <alpha-value>)',
        },
        mindmap: {
          grey: 'rgb(var(--color-border) / <alpha-value>)',
          orange: 'rgb(var(--color-srs-learning) / <alpha-value>)',
          green: 'rgb(var(--color-srs-mature) / <alpha-value>)',
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
