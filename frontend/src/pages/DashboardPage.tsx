import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useDashboardAlert } from '@/hooks/useDashboard';
import { useOrdini } from '@/hooks/useOrdini';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { AlertModal } from '@/components/dashboard/AlertModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Zap } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const { data: stats, isLoading: statsLoading } = useDashboardStats(period);
  const { data: alert } = useDashboardAlert();
  const { data: ordiniData, isLoading: ordiniLoading } = useOrdini({ limit: 5 });
  const navigate = useNavigate();

  const isUfficio = user?.ruolo === 'ufficio';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto, {user?.nome} {user?.cognome}
          </p>
        </div>
        {isUfficio && (
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Oggi</SelectItem>
              <SelectItem value="week">Settimana</SelectItem>
              <SelectItem value="month">Mese</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isUfficio && <KpiCards stats={stats} loading={statsLoading} />}

      {/* Stats details */}
      {isUfficio && stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Materiali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Da ordinare</span>
                <span className="font-medium">{stats.dettagli.materiali.da_ordinare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In attesa</span>
                <span className="font-medium">{stats.dettagli.materiali.ordinati_in_attesa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrivati</span>
                <span className="font-medium">{stats.dettagli.materiali.arrivati}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tempi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produzione media</span>
                <span className="font-medium">
                  {stats.dettagli.tempi.tempo_medio_produzione_giorni != null
                    ? `${stats.dettagli.tempi.tempo_medio_produzione_giorni} gg`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In ritardo</span>
                <span className="font-medium text-red-600">{stats.dettagli.tempi.ordini_in_ritardo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risoluzione problemi</span>
                <span className="font-medium">
                  {stats.dettagli.tempi.tempo_medio_risoluzione_problemi_ore != null
                    ? `${stats.dettagli.tempi.tempo_medio_risoluzione_problemi_ore}h`
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Problemi per Gravita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(stats.dettagli.problemi_per_gravita).map(([gravita, count]) => (
                <div key={gravita} className="flex justify-between items-center">
                  <StatusBadge type="gravita" value={gravita} />
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ultimi ordini */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Ultimi Ordini</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/ordini')}>
            Vedi tutti <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {ordiniLoading ? (
            <LoadingState rows={3} />
          ) : (
            <div className="space-y-3">
              {ordiniData?.data.map((ordine) => (
                <div
                  key={ordine.id}
                  className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/ordini/${ordine.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ordine.numero_conferma}</span>
                        {ordine.urgente && <Zap className="h-4 w-4 text-orange-500" />}
                      </div>
                      <span className="text-sm text-muted-foreground">{ordine.cliente}</span>
                    </div>
                  </div>
                  <StatusBadge type="ordine" value={ordine.stato} />
                </div>
              ))}
              {ordiniData?.data.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun ordine presente
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert modal per ufficio */}
      {isUfficio && <AlertModal alert={alert} />}
    </div>
  );
}
