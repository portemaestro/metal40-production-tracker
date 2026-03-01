import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { REPARTI_LABELS } from '@/utils/constants';
import type { AdminUser } from '@/types';
import { Loader2 } from 'lucide-react';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  cognome: z.string().min(1, 'Cognome obbligatorio'),
  email: z.string().email('Email non valida'),
  pin: z.string().length(4, 'PIN deve essere di 4 cifre').regex(/^\d{4}$/, 'Solo numeri'),
  ruolo: z.enum(['ufficio', 'operatore']),
  reparti: z.array(z.string()),
}).refine(
  (data) => data.ruolo !== 'operatore' || data.reparti.length > 0,
  { message: 'Seleziona almeno un reparto', path: ['reparti'] }
);

const editSchema = z.object({
  nome: z.string().min(1, 'Nome obbligatorio'),
  cognome: z.string().min(1, 'Cognome obbligatorio'),
  email: z.string().email('Email non valida'),
  pin: z.string().regex(/^(\d{4})?$/, 'PIN deve essere di 4 cifre').optional().or(z.literal('')),
  ruolo: z.enum(['ufficio', 'operatore']),
  reparti: z.array(z.string()),
}).refine(
  (data) => data.ruolo !== 'operatore' || data.reparti.length > 0,
  { message: 'Seleziona almeno un reparto', path: ['reparti'] }
);

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  user?: AdminUser | null;
  isLoading?: boolean;
}

export function UserForm({ open, onClose, onSubmit, user, isLoading }: UserFormProps) {
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      nome: user?.nome ?? '',
      cognome: user?.cognome ?? '',
      email: user?.email ?? '',
      pin: '',
      ruolo: user?.ruolo ?? 'operatore' as const,
      reparti: user?.reparti ?? [] as string[],
    },
  });

  const ruolo = watch('ruolo');
  const reparti = watch('reparti');

  function handleRepartoToggle(reparto: string) {
    const current = reparti || [];
    if (current.includes(reparto)) {
      setValue('reparti', current.filter((r) => r !== reparto), { shouldValidate: true });
    } else {
      setValue('reparti', [...current, reparto], { shouldValidate: true });
    }
  }

  function handleFormSubmit(data: z.infer<typeof createSchema | typeof editSchema>) {
    const payload: Record<string, unknown> = {
      nome: data.nome,
      cognome: data.cognome,
      email: data.email,
      ruolo: data.ruolo,
      reparti: data.ruolo === 'operatore' ? data.reparti : [],
    };
    if (data.pin) {
      payload.pin = data.pin;
    }
    onSubmit(payload);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Utente' : 'Nuovo Utente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica i dati dell\'utente. Il PIN e opzionale.'
              : 'Compila i dati per creare un nuovo utente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="cognome">Cognome</Label>
              <Input id="cognome" {...register('cognome')} />
              {errors.cognome && <p className="text-xs text-destructive">{errors.cognome.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="pin">PIN (4 cifre){isEdit && ' - lascia vuoto per non cambiare'}</Label>
            <Input
              id="pin"
              type="password"
              maxLength={4}
              inputMode="numeric"
              pattern="\d*"
              placeholder={isEdit ? '****' : ''}
              {...register('pin')}
            />
            {errors.pin && <p className="text-xs text-destructive">{errors.pin.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Ruolo</Label>
            <Select
              value={ruolo}
              onValueChange={(v) => setValue('ruolo', v as 'ufficio' | 'operatore', { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operatore">Operatore</SelectItem>
                <SelectItem value="ufficio">Ufficio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ruolo === 'operatore' && (
            <div className="space-y-2">
              <Label>Reparti</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(REPARTI_LABELS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reparti?.includes(value) ?? false}
                      onChange={() => handleRepartoToggle(value)}
                      className="rounded border-gray-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {errors.reparti && (
                <p className="text-xs text-destructive">{errors.reparti.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Salva' : 'Crea Utente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
