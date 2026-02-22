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
import { RisolviProblemaDialog } from './RisolviProblemaDialog';
import { useAuth } from '@/hooks/useAuth';
import { Check, ExternalLink } from 'lucide-react';
import type { Problema } from '@/types';

interface ProblemiTableProps {
  data: Problema[];
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function ProblemiTable({ data, pagination }: ProblemiTableProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [risolviId, setRisolviId] = useState<number | null>(null);

  const canResolve = (p: Problema) =>
    !p.risolto && (user?.ruolo === 'ufficio' || user?.id === p.segnalato_da);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nessun problema trovato</p>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordine</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Descrizione</TableHead>
              <TableHead>Gravita</TableHead>
              <TableHead className="hidden md:table-cell">Segnalato</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/ordini/${p.ordine_id}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {p.ordine?.numero_conferma || `#${p.ordine_id}`}
                  </Button>
                </TableCell>
                <TableCell className="font-medium text-sm">{p.tipo_problema}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                  {p.descrizione}
                </TableCell>
                <TableCell><StatusBadge type="gravita" value={p.gravita} /></TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {p.user_segnalatore?.nome} {p.user_segnalatore?.cognome}
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${p.risolto ? 'text-green-600' : 'text-red-600'}`}>
                    {p.risolto ? 'Risolto' : 'Aperto'}
                  </span>
                </TableCell>
                <TableCell>
                  {canResolve(p) && (
                    <Button variant="outline" size="sm" onClick={() => setRisolviId(p.id)}>
                      <Check className="h-3 w-3 mr-1" />
                      Risolvi
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginazione */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Pagina {pagination.page} di {pagination.totalPages} ({pagination.total} risultati)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Prec.
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Succ.
            </Button>
          </div>
        </div>
      )}

      {risolviId && (
        <RisolviProblemaDialog
          open={!!risolviId}
          onOpenChange={(open) => { if (!open) setRisolviId(null); }}
          problemaId={risolviId}
        />
      )}
    </>
  );
}
