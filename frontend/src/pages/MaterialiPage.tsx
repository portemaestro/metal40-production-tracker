import { useMaterialiDaOrdinare } from '@/hooks/useMateriali';
import { MaterialiTable } from '@/components/materiali/MaterialiTable';
import { LoadingState } from '@/components/common/LoadingState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Materiale } from '@/types';

export function MaterialiPage() {
  const { data, isLoading } = useMaterialiDaOrdinare();

  // Flatten all materiali from ordini groups
  const allMateriali: Materiale[] = data?.ordini?.flatMap((o) => o.materiali) ?? [];
  const daOrdinare = allMateriali.filter((m) => !m.ordine_effettuato && !m.arrivato);
  const ordinati = allMateriali.filter((m) => m.ordine_effettuato && !m.arrivato);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Materiali</h1>
        <p className="text-muted-foreground">
          Gestione materiali da ordinare e in arrivo
          {data && ` - ${data.totale} materiali da ordinare`}
        </p>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : (
        <Tabs defaultValue="da_ordinare">
          <TabsList>
            <TabsTrigger value="da_ordinare">
              Da Ordinare ({daOrdinare.length})
            </TabsTrigger>
            <TabsTrigger value="ordinati">
              Ordinati ({ordinati.length})
            </TabsTrigger>
            <TabsTrigger value="tutti">
              Tutti ({allMateriali.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="da_ordinare" className="mt-4">
            <MaterialiTable data={daOrdinare} showOrdine />
          </TabsContent>

          <TabsContent value="ordinati" className="mt-4">
            <MaterialiTable data={ordinati} showOrdine />
          </TabsContent>

          <TabsContent value="tutti" className="mt-4">
            <MaterialiTable data={allMateriali} showOrdine />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
