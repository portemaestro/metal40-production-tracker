import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Search, CheckCircle2 } from 'lucide-react';
import type { FaseProduzione } from '@/types';

interface OperatorCompletedListProps {
  fasi: FaseProduzione[] | undefined;
  isLoading: boolean;
}

export function OperatorCompletedList({ fasi, isLoading }: OperatorCompletedListProps) {
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
          placeholder="Cerca nelle fasi completate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nessuna fase completata"
          description="Le fasi completate appariranno qui"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((fase) => (
            <Card key={fase.id} className="bg-green-50/30">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{fase.ordine?.numero_conferma}</span>
                      <Badge variant="secondary" className="text-xs">
                        {fase.nome_fase}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{fase.ordine?.cliente}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {fase.data_completamento
                      ? new Date(fase.data_completamento).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
