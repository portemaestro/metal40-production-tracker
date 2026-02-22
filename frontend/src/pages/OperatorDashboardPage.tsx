import { useAuth } from '@/hooks/useAuth';
import { useFasiMie } from '@/hooks/useFasi';
import { OperatorPhasesList } from '@/components/operator/OperatorPhasesList';
import { OperatorCompletedList } from '@/components/operator/OperatorCompletedList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { REPARTI_LABELS } from '@/utils/constants';
import { ClipboardList, CheckCircle2 } from 'lucide-react';

export function OperatorDashboardPage() {
  const { user } = useAuth();
  const { data: fasiDaFare, isLoading: loadingDaFare } = useFasiMie({ completate: 'false' });
  const { data: fasiCompletate, isLoading: loadingCompletate } = useFasiMie({ completate: 'true' });

  const countDaFare = fasiDaFare?.length ?? 0;
  const countCompletate = fasiCompletate?.length ?? 0;

  // reparti puo' arrivare come JSON dal backend - assicuriamoci sia un array
  const reparti = Array.isArray(user?.reparti) ? user.reparti : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Ciao, {user?.nome}
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {reparti.map((r: string) => (
            <Badge key={r} variant="secondary" className="text-xs">
              {REPARTI_LABELS[r] || r}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="da_fare">
        <TabsList className="w-full h-12">
          <TabsTrigger value="da_fare" className="flex-1 h-10 text-sm gap-2">
            <ClipboardList className="h-4 w-4" />
            Da fare
            {countDaFare > 0 && (
              <Badge className="ml-1 bg-primary text-primary-foreground h-5 min-w-[20px] px-1.5">
                {countDaFare}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completate" className="flex-1 h-10 text-sm gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completate
            {countCompletate > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5">
                {countCompletate}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="da_fare" className="mt-4">
          <OperatorPhasesList fasi={fasiDaFare} isLoading={loadingDaFare} />
        </TabsContent>

        <TabsContent value="completate" className="mt-4">
          <OperatorCompletedList fasi={fasiCompletate} isLoading={loadingCompletate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
