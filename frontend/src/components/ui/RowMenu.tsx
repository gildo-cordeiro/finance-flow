import type { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';

interface RowMenuProps {
  /** Nome acessível do botão "⋯", ex.: "Ações de Aluguel". */
  label: string;
  disabled?: boolean;
  children: ReactNode;
}

/** Menu "⋯" com as ações de uma linha de lista. */
export function RowMenu({ label, disabled, children }: RowMenuProps) {
  // Não modal: um item pode abrir um Sheet, que precisa receber o foco
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} disabled={disabled}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
