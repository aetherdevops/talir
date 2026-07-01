import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',

                surface: {
                    DEFAULT: 'var(--surface)',
                    secondary: 'var(--surface-secondary)',
                    tertiary: 'var(--surface-tertiary)',
                    elevated: 'var(--surface-elevated)',
                },

                border: {
                    DEFAULT: 'var(--border)',
                    active: 'var(--border-active)',
                },

                brand: {
                    active: 'var(--brand-active)',
                    text: 'var(--brand-text)',
                    500: 'var(--accent)',
                    600: 'var(--talir-gold)',
                },

                talir: {
                    navy: 'var(--talir-navy)',
                    'navy-deep': 'var(--talir-navy-deep)',
                    'navy-2': 'var(--talir-navy-2)',
                    gold: 'var(--talir-gold)',
                    'gold-soft': 'var(--talir-gold-soft)',
                    ivory: 'var(--talir-ivory)',
                },

                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                },

                up: 'var(--up)',
                down: 'var(--down)',
                neutral: 'var(--neutral)',

                success: 'var(--up)',
                danger: 'var(--down)',
                loss: 'var(--down)',

                accent: {
                    DEFAULT: 'var(--accent)',
                    muted: 'var(--accent-muted)',
                },
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                serif: ['var(--font-serif)', 'Georgia', 'serif'],
                mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
                display: ['var(--font-serif)', 'Georgia', 'serif'],
            },
            transitionTimingFunction: {
                sidebar: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            boxShadow: {
                sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [],
}
export default config
