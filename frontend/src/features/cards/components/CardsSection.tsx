import { useState } from 'react';
import { CircleAlert, CreditCard, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArchivedToggle } from '@/components/ui/ArchivedToggle';
import { Button } from '@/components/ui/button';
import { Card as Panel, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/services/errors';
import { useCards } from '../hooks/useCards';
import type { Card } from '../types';
import { CardForm } from './CardForm';
import { CardRow } from './CardRow';
import { PurchaseForm } from './PurchaseForm';

type Editing = { kind: 'card'; card?: Card } | { kind: 'purchase'; card: Card } | null;

/** Cartões de crédito na tela "Contas e cartões" (RF-030). */
export function CardsSection() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const cards = useCards(includeArchived);

  return (
    <section aria-labelledby="cards-heading" className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="cards-heading" className="text-section">
          Cartões de crédito
        </h2>
        <div className="flex items-center gap-4">
          <ArchivedToggle
            id="show-archived-cards"
            label="Mostrar arquivados"
            checked={includeArchived}
            onCheckedChange={setIncludeArchived}
          />
          <Button variant="outline" onClick={() => setEditing({ kind: 'card' })}>
            <Plus />
            Novo cartão
          </Button>
        </div>
      </div>
      <Panel className="border-border-subtle">
        <CardContent className="p-0">
          {cards.isPending && (
            <div role="status" aria-label="Carregando cartões" className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {cards.isError && (
            <div className="p-6">
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
                <AlertDescription>{errorMessage(cards.error)}</AlertDescription>
              </Alert>
            </div>
          )}
          {cards.data?.length === 0 && (
            <EmptyState
              icon={<CreditCard className="h-6 w-6" />}
              title="Nenhum cartão cadastrado"
              description="Cadastre o cartão com o dia de fechamento e de vencimento: cada compra cai sozinha na fatura certa."
            />
          )}
          {cards.data && cards.data.length > 0 && (
            <ul className="divide-y divide-border-subtle">
              {cards.data.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  onEdit={() => setEditing({ kind: 'card', card })}
                  onPurchase={() => setEditing({ kind: 'purchase', card })}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Panel>
      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editing?.kind === 'purchase' ? `Nova compra em ${editing.card.name}` : editing?.card ? 'Editar cartão' : 'Novo cartão'}
            </SheetTitle>
            <SheetDescription>
              {editing?.kind === 'purchase'
                ? 'A data da compra decide a fatura; parcelada, cada parcela vai para a fatura seguinte.'
                : 'O fechamento decide em qual fatura cada compra cai.'}
            </SheetDescription>
          </SheetHeader>
          {editing?.kind === 'card' && <CardForm card={editing.card} onDone={() => setEditing(null)} />}
          {editing?.kind === 'purchase' && <PurchaseForm cardId={editing.card.id} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}
