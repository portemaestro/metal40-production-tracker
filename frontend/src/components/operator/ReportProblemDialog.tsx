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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { useSegnalaProblema } from '@/hooks/useProblemi';
import { TIPI_PROBLEMA } from '@/utils/constants';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportProblemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordineId: number;
  faseCorrente?: string;
  onSuccess?: () => void;
}

const GRAVITA_OPTIONS = [
  { value: 'bassa', label: 'Bassa', description: 'Non blocca la produzione', color: 'border-yellow-400 bg-yellow-50' },
  { value: 'media', label: 'Media', description: 'Rallenta la produzione', color: 'border-orange-400 bg-orange-50' },
  { value: 'alta_bloccante', label: 'Alta (Bloccante)', description: 'Blocca la produzione', color: 'border-red-400 bg-red-50' },
] as const;

export function ReportProblemDialog({ open, onOpenChange, ordineId, faseCorrente, onSuccess }: ReportProblemDialogProps) {
  const [tipoProblema, setTipoProblema] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [gravita, setGravita] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const mutation = useSegnalaProblema();

  const isValid = tipoProblema && descrizione.trim() && gravita;

  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      await mutation.mutateAsync({
        ordineId,
        data: {
          tipo_problema: tipoProblema,
          descrizione: descrizione.trim(),
          gravita,
          ...(faseCorrente && { fase: faseCorrente }),
          ...(photos.length > 0 && { foto_paths: photos }),
        },
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setTipoProblema('');
    setDescrizione('');
    setGravita('');
    setPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Segnala Problema
          </DialogTitle>
          <DialogDescription>
            Segnala un problema riscontrato durante la lavorazione
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo problema */}
          <div className="space-y-2">
            <Label>Tipo problema *</Label>
            <div className="grid grid-cols-1 gap-2">
              {TIPI_PROBLEMA.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoProblema(tipo)}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm transition-colors',
                    tipoProblema === tipo
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'hover:bg-accent'
                  )}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Gravita */}
          <div className="space-y-2">
            <Label>Gravita *</Label>
            <div className="grid grid-cols-1 gap-2">
              {GRAVITA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGravita(opt.value)}
                  className={cn(
                    'rounded-lg border-2 p-3 text-left transition-colors',
                    gravita === opt.value ? opt.color : 'border-transparent hover:bg-accent'
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione *</Label>
            <Textarea
              id="descrizione"
              placeholder="Descrivi il problema riscontrato..."
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label>Foto (opzionale)</Label>
            <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={5} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || mutation.isPending} variant="destructive">
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio...</>
            ) : (
              <><AlertTriangle className="mr-2 h-4 w-4" /> Segnala Problema</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
