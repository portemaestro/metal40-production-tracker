import { useParams, useNavigate } from 'react-router-dom';
import { useOrdine, useCreateOrdine, useUpdateOrdine } from '@/hooks/useOrdini';
import { OrdineForm } from '@/components/ordini/OrdineForm';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function OrdineFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const ordineId = parseInt(id || '0');

  const { data: ordine, isLoading } = useOrdine(ordineId);
  const createMutation = useCreateOrdine();
  const updateMutation = useUpdateOrdine();

  if (isEditing && isLoading) {
    return <LoadingState rows={8} />;
  }

  if (isEditing && !ordine) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ordine non trovato</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/ordini')}>
          Torna agli ordini
        </Button>
      </div>
    );
  }

  function handleSubmit(data: Record<string, unknown>) {
    if (isEditing) {
      updateMutation.mutate(
        { id: ordineId, data },
        { onSuccess: () => navigate(`/ordini/${ordineId}`) }
      );
    } else {
      createMutation.mutate(data as unknown as Parameters<typeof createMutation.mutate>[0], {
        onSuccess: (newOrdine) => navigate(`/ordini/${newOrdine.id}`),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(isEditing ? `/ordini/${ordineId}` : '/ordini')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? `Modifica Ordine ${ordine?.numero_conferma}` : 'Nuovo Ordine'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica i dati dell\'ordine' : 'Inserisci i dati del nuovo ordine'}
          </p>
        </div>
      </div>

      <OrdineForm
        ordine={ordine}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
