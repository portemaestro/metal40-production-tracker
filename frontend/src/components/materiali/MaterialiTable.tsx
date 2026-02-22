import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OrdinaMaterialeDialog } from './OrdinaMaterialeDialog';
import { useArrivoMateriale } from '@/hooks/useMateriali';
import { useAuth } from '@/hooks/useAuth';
import { TIPI_MATERIALE_LABELS } from '@/utils/constants';
import { ShoppingCart, Check, ExternalLink } from 'lucide-react';
import type { Materiale } from '@/types';

interface MaterialiTableProps {
  data: Materiale[];
  showOrdine?: boolean;
}

export function MaterialiTable({ data, showOrdine = false }: MaterialiTableProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nessun materiale trovato</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showOrdine && <TableHead>Ordine</TableHead>}
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Misure</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="hidden md:table-cell">Data Ordine</TableHead>
              <TableHead className="hidden md:table-cell">Consegna Prevista</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => {
              const stato = getMaterialeStato(m);
              return (
                <TableRow key={m.id}>
                  {showOrdine && (
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/ordini/${m.ordine_id}`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {m.ordine?.numero_conferma || `#${m.ordine_id}`}
                      </Button>
                    </TableCell>
                  )}
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
                  <TableCell className="hidden sm:table-cell text-sm">{m.misure || '-'}</TableCell>
                  <TableCell><StatusBadge type="materiale" value={stato} /></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {m.data_ordine_effettivo ? new Date(m.data_ordine_effettivo).toLocaleDateString('it-IT') : '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {m.data_consegna_prevista ? new Date(m.data_consegna_prevista).toLocaleDateString('it-IT') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isUfficio && !m.ordine_effettuato && (
                        <Button variant="outline" size="sm" onClick={() => setOrdinaDialogMat(m)}>
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      )}
                      {m.ordine_effettuato && !m.arrivato && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArrivo(m)}
                          disabled={arrivoMutation.isPending}
                        >
                          <Check className="h-3 w-3" />
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
