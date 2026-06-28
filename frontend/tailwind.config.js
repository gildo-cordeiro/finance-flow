/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        'bg-base':     '#0F1117',
        'bg-surface':  '#1A1D27',
        'bg-elevated': '#21253A',
        'border-subtle': '#2A2E45',
        'brand':       '#7C5CFC',
        'brand-hover': '#6B4EE6',
        'success':  '#22C55E',
        'danger':   '#EF4444',
        'warning':  '#F59E0B',
        'info':     '#3B82F6',
        'text-primary':   '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted':     '#4B5563',

        // We'll define a sleek dark/light palette according to rich design requirements
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontSize: {
        // Design System Typography
        'value-xl':  ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'label-xs':  ['11px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }],
        'section':   ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body':      ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'hint':      ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
