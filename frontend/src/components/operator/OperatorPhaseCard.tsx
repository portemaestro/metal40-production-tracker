import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Zap, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FaseProduzione } from '@/types';

interface OperatorPhaseCardProps {
  fase: FaseProduzione;
}

export function OperatorPhaseCard({ fase }: OperatorPhaseCardProps) {
  const navigate = useNavigate();
  const ordine = fase.ordine;

  if (!ordine) return null;

  const dataTassativa = ordine.data_tassativa
    ? new Date(ordine.data_tassativa)
    : null;

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const giorniRimanenti = dataTassativa
    ? Math.ceil((dataTassativa.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isScaduto = giorniRimanenti !== null && giorniRimanenti < 0;
  const isUrgenzaTempo = giorniRimanenti !== null && giorniRimanenti <= 3 && giorniRimanenti >= 0;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer active:scale-[0.98]',
        ordine.urgente && 'border-orange-300 bg-orange-50/50',
        ordine.stato === 'bloccato' && 'border-red-300 bg-red-50/50',
        isScaduto && !ordine.urgente && 'border-red-200',
      )}
      onClick={() => navigate(`/ordine/${ordine.id}`)}
    >
      <CardContent className="p-4">
        {/* Header: numero conferma + badges */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg">{ordine.numero_conferma}</span>
            {ordine.urgente && (
              <Badge className="bg-orange-500 text-white hover:bg-orange-500">
                <Zap className="mr-1 h-3 w-3" /> Urgente
              </Badge>
            )}
            <StatusBadge type="ordine" value={ordine.stato} />
          </div>
        </div>

        {/* Cliente */}
        <p className="text-sm text-muted-foreground mb-3">{ordine.cliente}</p>

        {/* Fase corrente */}
        <div className="flex items-center gap-2 mb-3 bg-primary/5 rounded-lg p-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{fase.nome_fase}</span>
        </div>

        {/* Footer: data tassativa + bottone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dataTassativa && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                isScaduto ? 'text-red-600 font-medium' : isUrgenzaTempo ? 'text-orange-600' : 'text-muted-foreground'
              )}>
                <Calendar className="h-3 w-3" />
                {dataTassativa.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                {giorniRimanenti !== null && (
                  <span>
                    ({isScaduto ? `${Math.abs(giorniRimanenti)}gg ritardo` : `${giorniRimanenti}gg`})
                  </span>
                )}
              </div>
            )}
            {!dataTassativa && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Senza scadenza
              </div>
            )}
          </div>

          <Button size="sm" variant="ghost" className="text-primary">
            Apri <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
