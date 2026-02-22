import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useArrivoMateriale, useMaterialiOrdine } from '@/hooks/useMateriali';
import { TIPI_MATERIALE_LABELS } from '@/utils/constants';
import { Package, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Materiale } from '@/types';

interface MaterialReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordineId: number;
  onSuccess?: () => void;
}

export function MaterialReceiptDialog({ open, onOpenChange, ordineId, onSuccess }: MaterialReceiptDialogProps) {
  const { data: materiali, isLoading } = useMaterialiOrdine(ordineId);
  const [selected, setSelected] = useState<number[]>([]);
  const mutation = useArrivoMateriale();
  const [submitting, setSubmitting] = useState(false);

  // Only show materials that are ordered but not yet arrived
  const inAttesa = materiali?.filter(
    (m: Materiale) => m.necessario && m.ordine_effettuato && !m.arrivato
  ) ?? [];

  const toggleMaterial = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const oggi = new Date().toISOString().split('T')[0];
      for (const id of selected) {
        await mutation.mutateAsync({
          id,
          data: { data_arrivo_effettivo: oggi },
        });
      }
      setSelected([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Registra Arrivo Materiale
          </DialogTitle>
          <DialogDescription>
            Seleziona i materiali arrivati per questo ordine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inAttesa.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              Tutti i materiali ordinati sono gia arrivati
            </div>
          ) : (
            <>
              <Label>Materiali in attesa</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {inAttesa.map((m: Materiale) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMaterial(m.id)}
                    className={cn(
                      'w-full rounded-lg border-2 p-3 text-left transition-colors',
                      selected.includes(m.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-transparent hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {TIPI_MATERIALE_LABELS[m.tipo_materiale] || m.tipo_materiale}
                          {m.sottotipo && ` - ${m.sottotipo}`}
                        </p>
                        {m.data_consegna_prevista && (
                          <p className="text-xs text-muted-foreground">
                            Consegna prevista: {new Date(m.data_consegna_prevista).toLocaleDateString('it-IT')}
                          </p>
                        )}
                        {m.note && (
                          <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>
                        )}
                      </div>
                      <div className={cn(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        selected.includes(m.id)
                          ? 'border-green-500 bg-green-500'
                          : 'border-muted-foreground/30'
                      )}>
                        {selected.includes(m.id) && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0 || submitting}
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrazione...</>
            ) : (
              <>Registra Arrivo ({selected.length})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
