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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRisolviProblema } from '@/hooks/useProblemi';

const schema = z.object({
  descrizione_risoluzione: z.string().min(10, 'La descrizione deve avere almeno 10 caratteri').max(2000),
});

type FormValues = z.infer<typeof schema>;

interface RisolviProblemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemaId: number;
}

export function RisolviProblemaDialog({ open, onOpenChange, problemaId }: RisolviProblemaDialogProps) {
  const risolviMutation = useRisolviProblema();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { descrizione_risoluzione: '' },
  });

  function onSubmit(data: FormValues) {
    risolviMutation.mutate(
      { id: problemaId, data },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Risolvi Problema</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descrizione_risoluzione">Descrizione Risoluzione *</Label>
            <Textarea
              id="descrizione_risoluzione"
              {...register('descrizione_risoluzione')}
              placeholder="Descrivi come e' stato risolto il problema..."
              className="min-h-[100px]"
            />
            {errors.descrizione_risoluzione && (
              <p className="text-sm text-destructive">{errors.descrizione_risoluzione.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={risolviMutation.isPending}>
              {risolviMutation.isPending ? 'Salvataggio...' : 'Risolvi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
