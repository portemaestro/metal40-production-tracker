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
import { useCompleteFase } from '@/hooks/useFasi';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { FaseProduzione } from '@/types';

interface CompletePhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fase: FaseProduzione;
  onSuccess?: () => void;
}

export function CompletePhaseDialog({ open, onOpenChange, fase, onSuccess }: CompletePhaseDialogProps) {
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const mutation = useCompleteFase();

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync({
        id: fase.id,
        data: {
          ...(note.trim() && { note: note.trim() }),
          ...(photos.length > 0 && { foto_paths: photos }),
        },
      });
      setNote('');
      setPhotos([]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Completa Fase
          </DialogTitle>
          <DialogDescription>
            Conferma il completamento della fase di lavorazione
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fase info */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-sm font-medium">{fase.nome_fase}</p>
            <p className="text-xs text-muted-foreground">
              Ordine: {fase.ordine?.numero_conferma} - {fase.ordine?.cliente}
            </p>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (opzionale)</Label>
            <Textarea
              id="note"
              placeholder="Aggiungi note sulla lavorazione..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
          <Button onClick={handleConfirm} disabled={mutation.isPending} className="bg-green-600 hover:bg-green-700">
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Completamento...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Conferma Completamento</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
