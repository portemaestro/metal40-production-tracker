import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { OperatorPhaseCard } from './OperatorPhaseCard';
import { Search, ClipboardList } from 'lucide-react';
import type { FaseProduzione } from '@/types';

interface OperatorPhasesListProps {
  fasi: FaseProduzione[] | undefined;
  isLoading: boolean;
}

export function OperatorPhasesList({ fasi, isLoading }: OperatorPhasesListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!fasi) return [];
    if (!search.trim()) return fasi;
    const s = search.toLowerCase();
    return fasi.filter((f) => {
      const o = f.ordine;
      return (
        f.nome_fase.toLowerCase().includes(s) ||
        o?.numero_conferma.toLowerCase().includes(s) ||
        o?.cliente.toLowerCase().includes(s)
      );
    });
  }, [fasi, search]);

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per ordine, cliente o fase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nessuna fase da completare"
          description="Non ci sono fasi assegnate ai tuoi reparti al momento"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((fase) => (
            <OperatorPhaseCard key={fase.id} fase={fase} />
          ))}
        </div>
      )}
    </div>
  );
}
