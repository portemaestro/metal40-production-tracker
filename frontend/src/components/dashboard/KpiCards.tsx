import { Factory, AlertTriangle, PackageCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/common/LoadingState';
import type { DashboardStats } from '@/types';

interface KpiCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
}

const KPI_CONFIG = [
  {
    key: 'in_produzione' as const,
    label: 'In Produzione',
    icon: Factory,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    key: 'urgenti' as const,
    label: 'Urgenti',
    icon: Zap,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    key: 'problemi_aperti' as const,
    label: 'Problemi Aperti',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    key: 'pronte_spedizione' as const,
    label: 'Pronte Spedizione',
    icon: PackageCheck,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
];

export function KpiCards({ stats, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
            <div className={`rounded-md p-2 ${kpi.bg}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.kpi[kpi.key] ?? 0}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
