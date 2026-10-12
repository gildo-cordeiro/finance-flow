import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error Tailwind config file in project root without TS declaration
import tailwindConfig from '../tailwind.config.js';

// Helpers para cálculo de luminância e contraste WCAG 2.1
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function parseHslString(hslStr: string): [number, number, number] {
  // Formato: "225 21% 7%"
  const parts = hslStr.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));
  return [h, s, l];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Extrai variáveis CSS de um seletor (:root ou .dark) com controle de profundidade de chaves
function extractCssVariables(cssContent: string, selector: ':root' | '.dark'): Record<string, string> {
  const selectorIndex = cssContent.indexOf(selector);
  if (selectorIndex === -1) return {};

  const openBrace = cssContent.indexOf('{', selectorIndex);
  if (openBrace === -1) return {};

  let depth = 1;
  let closeBrace = -1;
  for (let i = openBrace + 1; i < cssContent.length; i++) {
    if (cssContent[i] === '{') depth++;
    else if (cssContent[i] === '}') {
      depth--;
      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }
  if (closeBrace === -1) return {};

  const block = cssContent.slice(openBrace + 1, closeBrace);
  const vars: Record<string, string> = {};
  const lines = block.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') && trimmed.includes(':')) {
      const [key, ...rest] = trimmed.split(':');
      const val = rest.join(':').replace(';', '').trim();
      vars[key.trim()] = val;
    }
  }
  return vars;
}

describe('Design System Tokens & Tailwind Configuration', () => {
  const indexCssPath = path.resolve(process.cwd(), 'src/index.css');
  const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

  const rootVars = extractCssVariables(indexCssContent, ':root');
  const darkVars = extractCssVariables(indexCssContent, '.dark');

  describe('Tailwind Config', () => {
    it('should configure darkMode using class strategy when inspecting tailwind.config.js', () => {
      expect(tailwindConfig.darkMode).toEqual(['class']);
    });

    it('should map shadcn and FinanceFlow color tokens to HSL CSS variables when inspecting theme colors', () => {
      const colors = tailwindConfig.theme.extend.colors;

      // Base shadcn tokens
      expect(colors.border).toBe('hsl(var(--border))');
      expect(colors.input).toBe('hsl(var(--input))');
      expect(colors.ring).toBe('hsl(var(--ring))');
      expect(colors.background).toBe('hsl(var(--background))');
      expect(colors.foreground).toBe('hsl(var(--foreground))');
      expect(colors.primary.DEFAULT).toBe('hsl(var(--primary))');
      expect(colors.secondary.DEFAULT).toBe('hsl(var(--secondary))');
      expect(colors.destructive.DEFAULT).toBe('hsl(var(--destructive))');
      expect(colors.muted.DEFAULT).toBe('hsl(var(--muted))');
      expect(colors.accent.DEFAULT).toBe('hsl(var(--accent))');
      expect(colors.popover.DEFAULT).toBe('hsl(var(--popover))');
      expect(colors.card.DEFAULT).toBe('hsl(var(--card))');

      // FinanceFlow Design System Tokens
      expect(colors['bg-base']).toBe('hsl(var(--background))');
      expect(colors['bg-surface']).toBe('hsl(var(--card))');
      expect(colors['bg-elevated']).toBe('hsl(var(--popover))');
      expect(colors['border-subtle']).toBe('hsl(var(--border))');
      expect(colors.brand).toBe('hsl(var(--primary))');
      expect(colors['brand-hover']).toBe('hsl(var(--brand-hover))');
      expect(colors['text-primary']).toBe('hsl(var(--foreground))');
      expect(colors['text-label']).toBe('hsl(var(--secondary-foreground))');
      expect(colors['text-secondary']).toBe('hsl(var(--secondary-foreground))');
      expect(colors['text-muted']).toBe('hsl(var(--muted-foreground))');
    });

    it('should retain legacy alias text-secondary matching text-label when accessing colors', () => {
      const colors = tailwindConfig.theme.extend.colors;
      expect(colors['text-secondary']).toBe(colors['text-label']);
    });
  });

  describe('Dark Mode CSS Variables (.dark)', () => {
    it('should define official Dark Premium tokens with exact HSL values when dark class is applied', () => {
      expect(darkVars['--background']).toBe('225 21% 7%'); // #0F1117
      expect(darkVars['--card']).toBe('227 20% 13%'); // #1A1D27
      expect(darkVars['--popover']).toBe('229 27% 18%'); // #21253A
      expect(darkVars['--border']).toBe('231 24% 22%'); // #2A2E45
      expect(darkVars['--primary']).toBe('257 95% 67%'); // #7C5CFC
      expect(darkVars['--foreground']).toBe('231 38% 97%'); // #F4F5FA
      expect(darkVars['--secondary-foreground']).toBe('228 20% 81%'); // #C4C8D8 (label & secondary)
      expect(darkVars['--muted-foreground']).toBe('226 14% 65%'); // #9AA0B4 (muted)
      expect(darkVars['--radius']).toBe('0.75rem');
    });

    it('should satisfy WCAG AA minimum 4.5:1 contrast for muted text against card and background in dark mode', () => {
      const mutedRgb = hslToRgb(...parseHslString(darkVars['--muted-foreground']));
      const cardRgb = hslToRgb(...parseHslString(darkVars['--card']));
      const bgRgb = hslToRgb(...parseHslString(darkVars['--background']));

      const cardContrast = contrastRatio(mutedRgb, cardRgb);
      const bgContrast = contrastRatio(mutedRgb, bgRgb);

      expect(cardContrast).toBeGreaterThanOrEqual(4.5);
      expect(bgContrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should satisfy WCAG AAA minimum 7.0:1 contrast for foreground and label text against card in dark mode', () => {
      const fgRgb = hslToRgb(...parseHslString(darkVars['--foreground']));
      const labelRgb = hslToRgb(...parseHslString(darkVars['--secondary-foreground']));
      const cardRgb = hslToRgb(...parseHslString(darkVars['--card']));

      const fgContrast = contrastRatio(fgRgb, cardRgb);
      const labelContrast = contrastRatio(labelRgb, cardRgb);

      expect(fgContrast).toBeGreaterThanOrEqual(7.0);
      expect(labelContrast).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe('Light Mode CSS Variables (:root)', () => {
    it('should define complete light palette variables when root is evaluated', () => {
      expect(rootVars['--background']).toBeDefined();
      expect(rootVars['--card']).toBeDefined();
      expect(rootVars['--foreground']).toBeDefined();
      expect(rootVars['--secondary-foreground']).toBeDefined();
      expect(rootVars['--muted-foreground']).toBeDefined();
      expect(rootVars['--primary']).toBeDefined();
      expect(rootVars['--border']).toBeDefined();
      expect(rootVars['--radius']).toBe('0.75rem');
    });

    it('should satisfy WCAG AA minimum 4.5:1 contrast for all text elements against card and background in light mode', () => {
      const cardRgb = hslToRgb(...parseHslString(rootVars['--card']));
      const bgRgb = hslToRgb(...parseHslString(rootVars['--background']));

      const fgRgb = hslToRgb(...parseHslString(rootVars['--foreground']));
      const labelRgb = hslToRgb(...parseHslString(rootVars['--secondary-foreground']));
      const mutedRgb = hslToRgb(...parseHslString(rootVars['--muted-foreground']));
      const primaryRgb = hslToRgb(...parseHslString(rootVars['--primary']));

      // Textos sobre card (fundo branco)
      expect(contrastRatio(fgRgb, cardRgb)).toBeGreaterThanOrEqual(7.0);
      expect(contrastRatio(labelRgb, cardRgb)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(mutedRgb, cardRgb)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(primaryRgb, cardRgb)).toBeGreaterThanOrEqual(4.5);

      // Textos sobre background geral
      expect(contrastRatio(fgRgb, bgRgb)).toBeGreaterThanOrEqual(7.0);
      expect(contrastRatio(labelRgb, bgRgb)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(mutedRgb, bgRgb)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
