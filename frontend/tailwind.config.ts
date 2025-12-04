import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Emerald Seashell Noon Palette (from Figma)
                primary: {
                    50: '#f0fdf7',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#05B084', // Main emerald from Figma
                    600: '#048a6a',
                    700: '#036950',
                    800: '#024d3d',
                    900: '#01362b',
                },
                secondary: {
                    50: '#FCFAF9',
                    100: '#F9F5F2',
                    200: '#F5ECEB',
                    300: '#F3E9E5',
                    400: '#F2EBEA',
                    500: '#F1EDEA', // Main seashell from Figma
                    600: '#c1beb8',
                    700: '#918e86',
                    800: '#615f57',
                    900: '#302f2b',
                },
                accent: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#b9e6fe',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#015A84', // Noon blue from Figma
                    600: '#014768',
                    700: '#01354d',
                    800: '#012332',
                    900: '#001119',
                },
                mint: {
                    50: '#f5fdfb',
                    100: '#ebfbf6',
                    200: '#d7f7ed',
                    300: '#c3f3e4',
                    400: '#BADFCD', // Light mint from Figma
                    500: '#9dd1ba',
                    600: '#7ab399',
                    700: '#5a9579',
                    800: '#3a7759',
                    900: '#1a593a',
                },
                success: {
                    DEFAULT: '#05B084',
                    light: '#BADFCD',
                    dark: '#036950',
                },
                danger: {
                    DEFAULT: '#ef4444',
                    light: '#fca5a5',
                    dark: '#dc2626',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    light: '#fcd34d',
                    dark: '#d97706',
                },
                neutral: {
                    DEFAULT: '#6b7280',
                    light: '#d1d5db',
                    dark: '#374151',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow-emerald': '0 0 20px rgba(5, 176, 132, 0.4)',
                'glow-mint': '0 0 20px rgba(186, 223, 205, 0.5)',
                'glow-noon': '0 0 20px rgba(1, 90, 132, 0.4)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-lg': '0 20px 60px 0 rgba(31, 38, 135, 0.2)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-emerald': 'linear-gradient(135deg, #05B084 0%, #BADFCD 100%)',
                'gradient-seashell': 'linear-gradient(135deg, #F1EDEA 0%, #FCFAF9 100%)',
                'gradient-noon': 'linear-gradient(135deg, #015A84 0%, #38bdf8 100%)',
                'gradient-mesh': 'linear-gradient(135deg, #05B084 0%, #F1EDEA 50%, #015A84 100%)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce-slow': 'bounce 2s infinite',
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'fade-in-down': 'fadeInDown 0.6s ease-out',
                'slide-in-right': 'slideInRight 0.5s ease-out',
                'slide-in-left': 'slideInLeft 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(-30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
        },
    },
    plugins: [],
}

export default config
