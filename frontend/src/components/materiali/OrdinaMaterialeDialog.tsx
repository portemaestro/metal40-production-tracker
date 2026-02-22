import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrdinaMateriale } from '@/hooks/useMateriali';
import { TIPI_MATERIALE_LABELS } from '@/utils/constants';
import type { Materiale } from '@/types';

const schema = z
  .object({
    data_ordine_effettivo: z.string().min(1, 'Data ordine obbligatoria'),
    data_consegna_prevista: z.string().min(1, 'Data consegna obbligatoria'),
  })
  .refine((data) => new Date(data.data_consegna_prevista) >= new Date(data.data_ordine_effettivo), {
    message: 'La data di consegna deve essere uguale o successiva alla data ordine',
    path: ['data_consegna_prevista'],
  });

type FormValues = z.infer<typeof schema>;

interface OrdinaMaterialeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materiale: Materiale;
}

export function OrdinaMaterialeDialog({ open, onOpenChange, materiale }: OrdinaMaterialeDialogProps) {
  const ordinaMutation = useOrdinaMateriale();
  const oggi = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_ordine_effettivo: oggi,
      data_consegna_prevista: '',
    },
  });

  function onSubmit(data: FormValues) {
    ordinaMutation.mutate(
      { id: materiale.id, data },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Ordina {TIPI_MATERIALE_LABELS[materiale.tipo_materiale] || materiale.tipo_materiale}
            {materiale.sottotipo && ` (${materiale.sottotipo})`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_ordine_effettivo">Data Ordine</Label>
            <Input id="data_ordine_effettivo" type="date" {...register('data_ordine_effettivo')} />
            {errors.data_ordine_effettivo && (
              <p className="text-sm text-destructive">{errors.data_ordine_effettivo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_consegna_prevista">Data Consegna Prevista</Label>
            <Input id="data_consegna_prevista" type="date" {...register('data_consegna_prevista')} />
            {errors.data_consegna_prevista && (
              <p className="text-sm text-destructive">{errors.data_consegna_prevista.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={ordinaMutation.isPending}>
              {ordinaMutation.isPending ? 'Salvataggio...' : 'Conferma Ordine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
