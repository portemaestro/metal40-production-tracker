import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FaseProduzione } from '@/types';

interface OrdineTimelineCardProps {
  fasi: FaseProduzione[];
}

export function OrdineTimelineCard({ fasi }: OrdineTimelineCardProps) {
  const completate = fasi.filter((f) => f.stato === 'completata').length;
  const totali = fasi.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Fasi Produzione</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completate}/{totali} completate
          </span>
        </CardTitle>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: totali > 0 ? `${(completate / totali) * 100}%` : '0%' }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fasi.map((fase, i) => {
            const completata = fase.stato === 'completata';
            return (
              <div key={fase.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  {completata ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  {i < fasi.length - 1 && (
                    <div className={cn('w-0.5 h-6 mt-1', completata ? 'bg-green-600' : 'bg-muted')} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    completata ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {fase.nome_fase}
                  </p>
                  {completata && fase.user && (
                    <p className="text-xs text-muted-foreground">
                      {fase.user.nome} {fase.user.cognome}
                      {fase.data_completamento && (
                        <> - {new Date(fase.data_completamento).toLocaleDateString('it-IT')}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
