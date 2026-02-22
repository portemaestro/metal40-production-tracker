import { useParams, useNavigate } from 'react-router-dom';
import { useOrdine } from '@/hooks/useOrdini';
import { useFasiMie } from '@/hooks/useFasi';
import { OperatorOrdineDetail } from '@/components/operator/OperatorOrdineDetail';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function OperatorOrdineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ordineId = parseInt(id || '0');

  const { data: ordine, isLoading: ordineLoading } = useOrdine(ordineId);
  const { data: fasiMie } = useFasiMie({ completate: 'false' });

  // Filter phases belonging to this order
  const fasiOperatore = fasiMie?.filter((f) => f.ordine_id === ordineId) ?? [];

  if (ordineLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        <LoadingState rows={6} />
      </div>
    );
  }

  if (!ordine) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">Ordine non trovato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
      </Button>
      <OperatorOrdineDetail ordine={ordine} fasiOperatore={fasiOperatore} />
    </div>
  );
}
