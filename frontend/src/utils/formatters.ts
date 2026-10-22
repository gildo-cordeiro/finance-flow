import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (iso: string) => {
  if (!iso) return '';
  const formatPattern = localStorage.getItem('user_date_format') || 'dd/MM/yyyy';
  return format(parseISO(iso), formatPattern, { locale: ptBR });
};

export const formatMonth = (iso: string) => {
  if (!iso) return '';
  return format(parseISO(iso), 'MMMM yyyy', { locale: ptBR });
};

export const formatMonthShort = (iso: string) => {
  if (!iso) return '';
  return format(parseISO(iso), 'MMM/yy', { locale: ptBR });
};

export const formatCurrency = (value: number) => {
  const currency = localStorage.getItem('user_currency') || 'BRL';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
};

export const currentCompetenceMonth = () => {
  return format(startOfMonth(new Date()), 'yyyy-MM');
};

export const previousMonth = (month: string) => {
  const date = parseISO(`${month}-01`);
  const prevDate = new Date(date);
  prevDate.setMonth(date.getMonth() - 1);
  return format(startOfMonth(prevDate), 'yyyy-MM');
};

export const parseCurrencyToNumber = (value: unknown): number => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const cleaned = String(value)
    .replace(/[^0-9,-]/g, '')
    .replace(',', '.');
    
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrencyRaw = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const maskCurrency = (
  value: string | number | null | undefined,
  includePrefix = true
): string => {
  if (value === null || value === undefined || value === '') {
    const formatted = formatCurrencyRaw(0);
    return includePrefix ? `R$ ${formatted}` : formatted;
  }

  const rawDigits = typeof value === 'number'
    ? Math.floor(Math.abs(value)).toString()
    : String(value).replace(/\D/g, '');

  if (!rawDigits) {
    const formatted = formatCurrencyRaw(0);
    return includePrefix ? `R$ ${formatted}` : formatted;
  }

  const numValue = parseFloat(rawDigits) / 100;
  const formatted = formatCurrencyRaw(numValue);

  return includePrefix ? `R$ ${formatted}` : formatted;
};

export const formatCurrencyMask = maskCurrency;

