import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (iso: string) => {
  if (!iso) return '';
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
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
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
