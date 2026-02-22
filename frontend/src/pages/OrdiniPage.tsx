import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdini } from '@/hooks/useOrdini';
import { useAuth } from '@/hooks/useAuth';
import { OrdiniTable } from '@/components/ordini/OrdiniTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { STATI_ORDINE_LABELS } from '@/utils/constants';

export function OrdiniPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stato, setStato] = useState<string>('');
  const [urgente, setUrgente] = useState<string>('');

  const { data, isLoading } = useOrdini({
    page,
    limit: 20,
    search: search || undefined,
    stato: stato || undefined,
    urgente: urgente || undefined,
  });

  const isUfficio = user?.ruolo === 'ufficio';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordini</h1>
          <p className="text-muted-foreground">Gestione ordini di produzione</p>
        </div>
        {isUfficio && (
          <Button onClick={() => navigate('/ordini/nuovo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Ordine
          </Button>
        )}
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero conferma o cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={stato} onValueChange={(v) => { setStato(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(STATI_ORDINE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgente} onValueChange={(v) => { setUrgente(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Urgenza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="true">Urgenti</SelectItem>
            <SelectItem value="false">Non urgenti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabella */}
      <OrdiniTable
        data={data?.data ?? []}
        loading={isLoading}
        pagination={data?.pagination ? {
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          onPageChange: setPage,
        } : undefined}
      />
    </div>
  );
}
