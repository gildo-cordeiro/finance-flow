import { ArrowLeftRight, LayoutDashboard, PiggyBank, Settings, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Transações', path: '/transacoes', icon: ArrowLeftRight },
  { label: 'Contas e cartões', path: '/contas', icon: Wallet },
  { label: 'Orçamento', path: '/orcamento', icon: PiggyBank },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
];
