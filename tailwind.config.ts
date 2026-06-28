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
                // True Design System mappings
                // These don't hardcode colors; they read variables from globals.css
                // This makes "Theme Flashing" impossible if variables are set in <head>

                background: 'var(--background)',
                foreground: 'var(--foreground)',

                surface: {
                    DEFAULT: 'var(--surface)',
                    secondary: 'var(--surface-secondary)',
                    tertiary: 'var(--surface-tertiary)',
                    elevated: 'var(--surface-elevated)', // For dropdowns/modals
                },

                border: {
                    DEFAULT: 'var(--border)',
                    active: 'var(--border-active)',
                },

                // Brand Scale - Kept for accents, but dark mode active states rely on variables
                brand: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                    active: 'var(--brand-active)', // specific for Sidebar active bg
                    text: 'var(--brand-text)',     // specific for Sidebar active text
                },

                // Semantic Text
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                }
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            transitionTimingFunction: {
                'sidebar': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }
        },
    },
    plugins: [],
}
export default config
