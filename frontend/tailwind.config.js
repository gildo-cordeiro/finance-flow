import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn UI HSL base tokens
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

        // FinanceFlow Design System Tokens (unificados em variáveis CSS HSL)
        'bg-base': "hsl(var(--background))",
        'bg-surface': "hsl(var(--card))",
        'bg-elevated': "hsl(var(--popover))",
        'border-subtle': "hsl(var(--border))",
        'brand': "hsl(var(--primary))",
        'brand-hover': "hsl(var(--brand-hover))",
        'success': "hsl(var(--success))",
        'danger': "hsl(var(--destructive))",
        'warning': "hsl(var(--warning))",
        'info': "hsl(var(--info))",
        'text-primary': "hsl(var(--foreground))",
        'text-label': "hsl(var(--secondary-foreground))",
        'text-secondary': "hsl(var(--secondary-foreground))",
        'text-muted': "hsl(var(--muted-foreground))",
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
  plugins: [animate],
}
