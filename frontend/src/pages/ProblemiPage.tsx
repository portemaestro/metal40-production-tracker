import { useState } from 'react';
import { useProblemi } from '@/hooks/useProblemi';
import { ProblemiTable } from '@/components/problemi/ProblemiTable';
import { LoadingState } from '@/components/common/LoadingState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRAVITA_LABELS } from '@/utils/constants';

export function ProblemiPage() {
  const [page, setPage] = useState(1);
  const [risolto, setRisolto] = useState<'true' | 'false' | 'all'>('false');
  const [gravita, setGravita] = useState<string>('');

  const { data, isLoading } = useProblemi({
    page,
    limit: 20,
    risolto,
    gravita: gravita || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Problemi</h1>
        <p className="text-muted-foreground">Gestione segnalazioni e problemi di produzione</p>
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={risolto} onValueChange={(v) => { setRisolto(v as typeof risolto); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Aperti</SelectItem>
            <SelectItem value="true">Risolti</SelectItem>
            <SelectItem value="all">Tutti</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gravita} onValueChange={(v) => { setGravita(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tutte le gravita" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le gravita</SelectItem>
            {Object.entries(GRAVITA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabella */}
      {isLoading ? (
        <LoadingState rows={6} />
      ) : (
        <ProblemiTable
          data={data?.data ?? []}
          pagination={data?.pagination ? {
            page: data.pagination.page,
            totalPages: data.pagination.totalPages,
            total: data.pagination.total,
            onPageChange: setPage,
          } : undefined}
        />
      )}
    </div>
  );
}
