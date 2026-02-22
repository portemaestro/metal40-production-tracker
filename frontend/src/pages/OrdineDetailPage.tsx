import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrdine, useDeleteOrdine } from '@/hooks/useOrdini';
import { useAuth } from '@/hooks/useAuth';
import { OrdineInfoCard } from '@/components/ordini/OrdineInfoCard';
import { OrdineMaterialiCard } from '@/components/ordini/OrdineMaterialiCard';
import { OrdineTimelineCard } from '@/components/ordini/OrdineTimelineCard';
import { OrdineNoteProbCard } from '@/components/ordini/OrdineNoteProbCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export function OrdineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ordineId = parseInt(id || '0');
  const { data: ordine, isLoading } = useOrdine(ordineId);
  const deleteMutation = useDeleteOrdine();
  const [showDelete, setShowDelete] = useState(false);

  const isUfficio = user?.ruolo === 'ufficio';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState rows={8} />
      </div>
    );
  }

  if (!ordine) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ordine non trovato</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/ordini')}>
          Torna agli ordini
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteMutation.mutate(ordineId, {
      onSuccess: () => navigate('/ordini'),
    });
  }

  const canDelete = isUfficio && ordine.stato !== 'spedito' && ordine.stato !== 'pronto_spedizione';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ordini')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Ordine {ordine.numero_conferma}
            </h1>
            <p className="text-muted-foreground">{ordine.cliente}</p>
          </div>
        </div>

        {isUfficio && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/ordini/${ordineId}/modifica`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifica
            </Button>
            {canDelete && (
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <OrdineInfoCard ordine={ordine} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OrdineTimelineCard fasi={ordine.fasi || []} />
        <OrdineMaterialiCard materiali={ordine.materiali || []} ordineId={ordineId} />
      </div>

      <OrdineNoteProbCard
        ordineId={ordineId}
        note={ordine.note || []}
        problemi={ordine.problemi || []}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Elimina Ordine"
        description={`Sei sicuro di voler eliminare l'ordine ${ordine.numero_conferma}? Questa azione non puo' essere annullata.`}
        confirmLabel="Elimina"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
