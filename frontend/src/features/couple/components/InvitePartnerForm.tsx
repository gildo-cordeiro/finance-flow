import React from 'react';
import { Mail } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface InvitePartnerFormProps {
  partnerEmail: string;
  onPartnerEmailChange: (email: string) => void;
  isInviting: boolean;
  onSendInvite: (e: React.FormEvent) => void;
}

export function InvitePartnerForm({
  partnerEmail,
  onPartnerEmailChange,
  isInviting,
  onSendInvite,
}: InvitePartnerFormProps) {
  return (
    <form onSubmit={onSendInvite} className="space-y-4">
      <p className="text-sm text-zinc-300">
        Você ainda não possui um parceiro vinculado. Digite o e-mail do seu parceiro abaixo para
        enviar um convite e iniciar a gestão financeira conjunta.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <div className="flex-1 w-full">
          <Input
            type="email"
            label="E-mail do Parceiro"
            placeholder="parceiro@email.com"
            value={partnerEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPartnerEmailChange(e.target.value)}
            disabled={isInviting}
            leftIcon={<Mail className="w-5 h-5 text-zinc-500" />}
            required
          />
        </div>
        <Button type="submit" loading={isInviting} className="w-full sm:w-auto h-[42px] px-6">
          Enviar convite
        </Button>
      </div>
    </form>
  );
}
