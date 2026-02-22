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
import { useCreaNota } from '@/hooks/useNote';
import { MessageSquarePlus, Loader2 } from 'lucide-react';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordineId: number;
  onSuccess?: () => void;
}

export function AddNoteDialog({ open, onOpenChange, ordineId, onSuccess }: AddNoteDialogProps) {
  const [testo, setTesto] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const mutation = useCreaNota();

  const handleSubmit = async () => {
    if (!testo.trim()) return;
    try {
      await mutation.mutateAsync({
        ordineId,
        data: {
          testo: testo.trim(),
          ...(photos.length > 0 && { foto_paths: photos }),
        },
      });
      setTesto('');
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
            <MessageSquarePlus className="h-5 w-5 text-blue-500" />
            Aggiungi Nota
          </DialogTitle>
          <DialogDescription>
            Aggiungi una nota o comunicazione per questo ordine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testo">Nota *</Label>
            <Textarea
              id="testo"
              placeholder="Scrivi la tua nota..."
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Foto (opzionale)</Label>
            <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={5} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={!testo.trim() || mutation.isPending}>
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio...</>
            ) : (
              <><MessageSquarePlus className="mr-2 h-4 w-4" /> Aggiungi Nota</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
