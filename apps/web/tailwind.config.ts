import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // CUSTOM BREAKPOINTS
      // ============================================
      screens: {
        xs: '475px', // Extra small devices (larger phones)
      },

      // ============================================
      // BITLOOT NEON CYBERPUNK COLOR SYSTEM
      // ============================================
      colors: {
        // Primary Neon Accent Colors
        'cyan-glow': 'hsl(var(--cyan-glow) / <alpha-value>)',
        'purple-neon': 'hsl(var(--purple-neon) / <alpha-value>)',
        'green-success': 'hsl(var(--green-success) / <alpha-value>)',
        'orange-warning': 'hsl(var(--orange-warning) / <alpha-value>)',
        'pink-featured': 'hsl(var(--pink-featured) / <alpha-value>)',

        // Background Colors (Deep Space Theme)
        'bg-primary': 'hsl(var(--bg-primary) / <alpha-value>)',
        'bg-secondary': 'hsl(var(--bg-secondary) / <alpha-value>)',
        'bg-tertiary': 'hsl(var(--bg-tertiary) / <alpha-value>)',

        // Text Colors
        'text-primary': 'hsl(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'hsl(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'hsl(var(--text-muted) / <alpha-value>)',

        // Border Colors
        'border-subtle': 'hsl(var(--border-subtle) / <alpha-value>)',
        'border-accent': 'hsl(var(--border-accent) / <alpha-value>)',

        // Overlay
        overlay: 'hsl(var(--overlay) / <alpha-value>)',

        // shadcn/ui semantic colors (mapped to neon system)
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'hsl(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'hsl(var(--sidebar-border) / <alpha-value>)',
          ring: 'hsl(var(--sidebar-ring) / <alpha-value>)',
        },
        chart: {
          '1': 'hsl(var(--chart-1) / <alpha-value>)',
          '2': 'hsl(var(--chart-2) / <alpha-value>)',
          '3': 'hsl(var(--chart-3) / <alpha-value>)',
          '4': 'hsl(var(--chart-4) / <alpha-value>)',
          '5': 'hsl(var(--chart-5) / <alpha-value>)',
        },
      },

      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },

      // ============================================
      // SPACING & LAYOUT
      // ============================================
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // ============================================
      // NEON GLOW BOX SHADOWS
      // ============================================
      boxShadow: {
        // Glow effects for interactive elements
        'glow-cyan': '0 0 20px hsl(var(--cyan-glow) / 0.4), 0 0 40px hsl(var(--cyan-glow) / 0.2)',
        'glow-cyan-sm': '0 0 10px hsl(var(--cyan-glow) / 0.3), 0 0 20px hsl(var(--cyan-glow) / 0.15)',
        'glow-cyan-lg': '0 0 30px hsl(var(--cyan-glow) / 0.5), 0 0 60px hsl(var(--cyan-glow) / 0.25)',
        'glow-purple': '0 0 20px hsl(var(--purple-neon) / 0.4), 0 0 40px hsl(var(--purple-neon) / 0.2)',
        'glow-purple-sm': '0 0 10px hsl(var(--purple-neon) / 0.3), 0 0 20px hsl(var(--purple-neon) / 0.15)',
        'glow-success': '0 0 20px hsl(var(--green-success) / 0.4), 0 0 40px hsl(var(--green-success) / 0.2)',
        'glow-error': '0 0 20px hsl(var(--orange-warning) / 0.4), 0 0 40px hsl(var(--orange-warning) / 0.2)',
        'glow-pink': '0 0 20px hsl(var(--pink-featured) / 0.4), 0 0 40px hsl(var(--pink-featured) / 0.2)',
        // Card shadows
        'card-sm': '0 1px 2px hsl(var(--bg-primary) / 0.5)',
        'card-md': '0 4px 6px -1px hsl(var(--bg-primary) / 0.5), 0 2px 4px -2px hsl(var(--bg-primary) / 0.25)',
        'card-lg': '0 10px 15px -3px hsl(var(--bg-primary) / 0.5), 0 4px 6px -4px hsl(var(--bg-primary) / 0.25)',
        // Inset glow for inputs
        'inset-glow': 'inset 0 0 10px hsl(var(--cyan-glow) / 0.1)',
      },

      // ============================================
      // BACKGROUND GRADIENTS
      // ============================================
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--cyan-glow)) 0%, hsl(var(--purple-neon)) 100%)',
        'gradient-primary-subtle': 'linear-gradient(135deg, hsl(var(--cyan-glow) / 0.2) 0%, hsl(var(--purple-neon) / 0.2) 100%)',
        'gradient-success': 'linear-gradient(135deg, hsl(var(--green-success)) 0%, hsl(160 100% 40%) 100%)',
        'gradient-featured': 'linear-gradient(135deg, hsl(var(--pink-featured)) 0%, hsl(var(--purple-neon)) 100%)',
        'gradient-dark': 'linear-gradient(180deg, hsl(var(--bg-primary)) 0%, hsl(var(--bg-secondary)) 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Mesh gradient for hero sections
        'mesh-gradient': `
          radial-gradient(at 40% 20%, hsl(var(--cyan-glow) / 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 0%, hsl(var(--purple-neon) / 0.12) 0px, transparent 50%),
          radial-gradient(at 0% 50%, hsl(var(--pink-featured) / 0.08) 0px, transparent 50%),
          radial-gradient(at 80% 50%, hsl(var(--cyan-glow) / 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, hsl(var(--purple-neon) / 0.1) 0px, transparent 50%),
          hsl(var(--bg-primary))
        `,
      },

      // ============================================
      // ANIMATIONS & KEYFRAMES
      // ============================================
      keyframes: {
        // Glow pulse for active elements
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px hsl(var(--cyan-glow) / 0.4), 0 0 40px hsl(var(--cyan-glow) / 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px hsl(var(--cyan-glow) / 0.6), 0 0 60px hsl(var(--cyan-glow) / 0.3)',
          },
        },
        // Float animation for hero elements
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        // Slide in from right
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Slide in from left
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Slide up
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Fade in
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Scale in
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Shimmer for loading states
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Spin with glow
        'spin-glow': {
          '0%': {
            transform: 'rotate(0deg)',
            filter: 'drop-shadow(0 0 8px hsl(var(--cyan-glow) / 0.6))',
          },
          '100%': {
            transform: 'rotate(360deg)',
            filter: 'drop-shadow(0 0 8px hsl(var(--cyan-glow) / 0.6))',
          },
        },
        // Subtle bounce
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        // Pulse ring for notifications
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '1' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        // Text gradient animation
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Accordion animations (for shadcn)
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Collapsible animations (for shadcn)
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'spin-glow': 'spin-glow 1s linear infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
      },

      // ============================================
      // TRANSITION TIMING FUNCTIONS
      // ============================================
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        gaming: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;
