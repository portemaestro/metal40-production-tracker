import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OrdinaMaterialeDialog } from '@/components/materiali/OrdinaMaterialeDialog';
import { useArrivoMateriale } from '@/hooks/useMateriali';
import { useAuth } from '@/hooks/useAuth';
import { TIPI_MATERIALE_LABELS } from '@/utils/constants';
import { Check, ShoppingCart } from 'lucide-react';
import type { Materiale } from '@/types';

interface OrdineMaterialiCardProps {
  materiali: Materiale[];
  ordineId: number;
}

export function OrdineMaterialiCard({ materiali }: OrdineMaterialiCardProps) {
  const { user } = useAuth();
  const isUfficio = user?.ruolo === 'ufficio';
  const [ordinaDialogMat, setOrdinaDialogMat] = useState<Materiale | null>(null);
  const arrivoMutation = useArrivoMateriale();

  function getMaterialeStato(m: Materiale): string {
    if (m.arrivato) return 'arrivato';
    if (m.ordine_effettuato) return 'ordinato';
    return 'da_ordinare';
  }

  function handleArrivo(m: Materiale) {
    const oggi = new Date().toISOString().split('T')[0];
    arrivoMutation.mutate({ id: m.id, data: { data_arrivo_effettivo: oggi } });
  }

  const necessari = materiali.filter((m) => m.necessario);

  if (necessari.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiali</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nessun materiale necessario per questo ordine.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiali ({necessari.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Misure</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="hidden md:table-cell">Consegna Prevista</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {necessari.map((m) => {
                  const stato = getMaterialeStato(m);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {TIPI_MATERIALE_LABELS[m.tipo_materiale] || m.tipo_materiale}
                          </span>
                          {m.sottotipo && (
                            <span className="text-xs text-muted-foreground ml-1">({m.sottotipo})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {m.misure || '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge type="materiale" value={stato} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {m.data_consegna_prevista
                          ? new Date(m.data_consegna_prevista).toLocaleDateString('it-IT')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isUfficio && !m.ordine_effettuato && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOrdinaDialogMat(m)}
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Ordina
                            </Button>
                          )}
                          {m.ordine_effettuato && !m.arrivato && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArrivo(m)}
                              disabled={arrivoMutation.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Arrivato
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {ordinaDialogMat && (
        <OrdinaMaterialeDialog
          open={!!ordinaDialogMat}
          onOpenChange={(open) => { if (!open) setOrdinaDialogMat(null); }}
          materiale={ordinaDialogMat}
        />
      )}
    </>
  );
}
