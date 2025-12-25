import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Existing shadcn/ui colors (CSS variable references)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        // NEW: Neon Cyberpunk Color System
        'cyan-glow': 'hsl(var(--cyan-glow))',
        'purple-neon': 'hsl(var(--purple-neon))',
        'green-success': 'hsl(var(--green-success))',
        'orange-warning': 'hsl(var(--orange-warning))',
        'pink-featured': 'hsl(var(--pink-featured))',

        // NEW: Semantic Accent Colors (for status indicators)
        'accent-success': 'hsl(var(--accent-success))',
        'accent-warning': 'hsl(var(--accent-warning))',
        'accent-error': 'hsl(var(--accent-error))',
        'accent-info': 'hsl(var(--accent-info))',
        'accent-purple': 'hsl(var(--accent-purple))',

        // Enhanced backgrounds
        'bg-primary': 'hsl(var(--bg-primary))',
        'bg-secondary': 'hsl(var(--bg-secondary))',
        'bg-tertiary': 'hsl(var(--bg-tertiary))',

        // Enhanced text colors
        'text-primary': 'hsl(var(--text-primary))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-muted': 'hsl(var(--text-muted))',

        // Enhanced borders
        'border-subtle': 'hsl(var(--border-subtle))',
        'border-accent': 'hsl(var(--border-accent))',

        // Overlay colors
        overlay: 'hsl(var(--overlay))',
        'overlay-light': 'hsl(var(--overlay-light))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        serif: ['var(--font-serif)', 'serif'],
      },
      borderRadius: {
        lg: 'calc(var(--radius) + 4px)',
        md: 'calc(var(--radius) + 2px)',
        sm: 'calc(var(--radius))',
        xl: 'calc(var(--radius) + 8px)',
        '2xl': 'calc(var(--radius) + 12px)',
      },
      spacing: {
        // Safe area insets for PWA
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        // Glow shadows
        'glow-cyan': 'var(--shadow-glow-cyan)',
        'glow-purple': 'var(--shadow-glow-purple)',
        'glow-success': 'var(--shadow-glow-success)',
        'glow-error': 'var(--shadow-glow-error)',
        // Elevation shadows
        'elevation-sm': 'var(--shadow-sm)',
        'elevation-md': 'var(--shadow-md)',
        'elevation-lg': 'var(--shadow-lg)',
      },
      backgroundImage: {
        // Gradient utilities
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-featured': 'var(--gradient-featured)',
        'gradient-dark': 'var(--gradient-dark)',
        // Radial gradients for spotlight effects
        'radial-cyan': 'radial-gradient(circle at center, hsl(var(--cyan-glow) / 0.15) 0%, transparent 70%)',
        'radial-purple': 'radial-gradient(circle at center, hsl(var(--purple-neon) / 0.15) 0%, transparent 70%)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        // NEW: Enhanced animations for gaming aesthetic
        'glow-pulse': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px hsl(var(--cyan-glow))',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 30px hsl(var(--cyan-glow))',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'slide-in-from-right': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        // NEW: Shimmer effect for loading states
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
        // NEW: Spin with glow (for loaders)
        'spin-glow': {
          '0%': {
            transform: 'rotate(0deg)',
            filter: 'drop-shadow(0 0 4px hsl(var(--cyan-glow)))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 8px hsl(var(--cyan-glow)))',
          },
          '100%': {
            transform: 'rotate(360deg)',
            filter: 'drop-shadow(0 0 4px hsl(var(--cyan-glow)))',
          },
        },
        // NEW: Bounce subtle (for notifications)
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-4px)',
          },
        },
        // NEW: Pulse ring (for attention)
        'pulse-ring': {
          '0%': {
            boxShadow: '0 0 0 0 hsl(var(--cyan-glow) / 0.7)',
          },
          '70%': {
            boxShadow: '0 0 0 10px hsl(var(--cyan-glow) / 0)',
          },
          '100%': {
            boxShadow: '0 0 0 0 hsl(var(--cyan-glow) / 0)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'slide-in-right': 'slide-in-from-right 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        // NEW: Additional animation classes
        shimmer: 'shimmer 2s linear infinite',
        'spin-glow': 'spin-glow 1s linear infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      // Custom transition timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      // Custom transition durations
      transitionDuration: {
        '0': '0ms',
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
} satisfies Config;
