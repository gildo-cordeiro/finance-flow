import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { applyFieldErrors } from '@/lib/forms';
import { errorMessage } from '@/services/errors';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { profileSchema, type ProfileForm as ProfileFormValues } from '../schemas/profileSchema';
import { timezoneGroups } from '../timezones';
import type { Profile } from '../types';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive md:text-sm';

export function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, timezone: profile.timezone },
  });
  const { isSubmitting, isDirty } = form.formState;
  const groups = useMemo(() => timezoneGroups(profile.timezone), [profile.timezone]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const saved = await updateProfile.mutateAsync(values);
      form.reset({ name: saved.name, timezone: saved.timezone });
      toast.success('Perfil atualizado.');
    } catch (err) {
      const marked = applyFieldErrors(err, form.setError, { name: 'name', timezone: 'timezone' });
      setError(marked ? null : errorMessage(err));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="profile-email">E-mail</Label>
          <Input id="profile-email" value={profile.email} readOnly disabled />
        </div>
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuso horário</FormLabel>
              <FormControl>
                <select className={selectClass} {...field}>
                  <optgroup label="Brasil">
                    {groups.brazil.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Outros fusos">
                    {groups.others.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </FormControl>
              <FormDescription>Define o que é “hoje” para vencimentos, atrasos e o mês corrente.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
