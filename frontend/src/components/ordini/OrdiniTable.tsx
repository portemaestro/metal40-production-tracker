import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Zap, Eye, Pencil } from 'lucide-react';
import { TIPI_TELAIO_LABELS } from '@/utils/constants';
import type { Ordine } from '@/types';

interface OrdiniTableProps {
  data: Ordine[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function OrdiniTable({ data, loading, pagination }: OrdiniTableProps) {
  const navigate = useNavigate();

  const columns: Column<Ordine>[] = [
    {
      header: 'Conferma',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{row.numero_conferma}</span>
          {row.urgente && <Zap className="h-4 w-4 text-orange-500" />}
        </div>
      ),
    },
    {
      header: 'Cliente',
      accessorKey: 'cliente',
    },
    {
      header: 'Tipo Telaio',
      cell: (row) => TIPI_TELAIO_LABELS[row.tipo_telaio] || row.tipo_telaio,
      className: 'hidden md:table-cell',
    },
    {
      header: 'Stato',
      cell: (row) => <StatusBadge type="ordine" value={row.stato} />,
    },
    {
      header: 'Azioni',
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/ordini/${row.id}`); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/ordini/${row.id}/modifica`); }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-[100px]',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage="Nessun ordine trovato"
      pagination={pagination}
    />
  );
}
