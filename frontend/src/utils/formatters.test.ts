import { describe, expect, it } from 'vitest';
import { formatCurrencyRaw, maskCurrency } from './formatters';

describe('maskCurrency (UX-14 Currency mask pure function)', () => {
  it('formats numeric digits 12345 to "R$ 123,45"', () => {
    expect(maskCurrency(12345)).toBe('R$ 123,45');
  });

  it('formats string digits "12345" to "R$ 123,45"', () => {
    expect(maskCurrency('12345')).toBe('R$ 123,45');
  });

  it('returns "R$ 0,00" for empty string, 0, null, and undefined', () => {
    expect(maskCurrency('')).toBe('R$ 0,00');
    expect(maskCurrency(0)).toBe('R$ 0,00');
    expect(maskCurrency('0')).toBe('R$ 0,00');
    expect(maskCurrency(null)).toBe('R$ 0,00');
    expect(maskCurrency(undefined)).toBe('R$ 0,00');
    expect(maskCurrency('   ')).toBe('R$ 0,00');
  });

  it('correctly forms currency values by cents step-by-step', () => {
    expect(maskCurrency('1')).toBe('R$ 0,01');
    expect(maskCurrency('12')).toBe('R$ 0,12');
    expect(maskCurrency('123')).toBe('R$ 1,23');
    expect(maskCurrency('1234')).toBe('R$ 12,34');
    expect(maskCurrency('12345')).toBe('R$ 123,45');
  });

  it('handles large numbers with thousands separators', () => {
    expect(maskCurrency(100000)).toBe('R$ 1.000,00');
    expect(maskCurrency(123456789)).toBe('R$ 1.234.567,89');
  });

  it('extracts only digits from strings containing symbols and formatting', () => {
    expect(maskCurrency('R$ 123,45')).toBe('R$ 123,45');
    expect(maskCurrency('abc 999 xyz')).toBe('R$ 9,99');
  });

  it('supports formatting without "R$ " prefix when includePrefix is false', () => {
    expect(maskCurrency('12345', false)).toBe('123,45');
    expect(maskCurrency(12345, false)).toBe('123,45');
    expect(maskCurrency('', false)).toBe('0,00');
    expect(maskCurrency(0, false)).toBe('0,00');
  });

  it('formatCurrencyRaw formats numbers to pt-BR decimal strings', () => {
    expect(formatCurrencyRaw(123.45)).toBe('123,45');
    expect(formatCurrencyRaw(0)).toBe('0,00');
    expect(formatCurrencyRaw(1000)).toBe('1.000,00');
  });
});
