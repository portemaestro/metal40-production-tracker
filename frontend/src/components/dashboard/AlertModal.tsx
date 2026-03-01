import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AlertTriangle, Package, Truck } from 'lucide-react';
import { TIPI_CONSEGNA_FT_LABELS } from '@/utils/constants';
import type { DashboardAlert } from '@/types';

const ALERT_DISMISSED_KEY = 'metal40_alert_dismissed_date';

interface AlertModalProps {
  alert?: DashboardAlert;
}

export function AlertModal({ alert }: AlertModalProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!alert?.ha_alert) return;
    const today = new Date().toISOString().split('T')[0];
    const dismissed = localStorage.getItem(ALERT_DISMISSED_KEY);
    if (dismissed !== today) {
      setOpen(true);
    }
  }, [alert]);

  function handleClose() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(ALERT_DISMISSED_KEY, today);
    setOpen(false);
  }

  if (!alert?.ha_alert) return null;

  const matCount = alert.materiali_da_ordinare.length;
  const probCount = alert.problemi_aperti.length;
  const arrCount = alert.materiali_in_arrivo.length;
  const ftCount = alert.ft_in_attesa?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alert Giornalieri
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={matCount > 0 ? 'materiali' : probCount > 0 ? 'problemi' : ftCount > 0 ? 'falsotelaio' : 'arrivi'}>
          <TabsList className="w-full">
            {matCount > 0 && (
              <TabsTrigger value="materiali" className="flex-1">
                <Package className="h-4 w-4 mr-1" />
                Da Ordinare
                <Badge variant="secondary" className="ml-1">{matCount}</Badge>
              </TabsTrigger>
            )}
            {probCount > 0 && (
              <TabsTrigger value="problemi" className="flex-1">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Problemi
                <Badge variant="secondary" className="ml-1">{probCount}</Badge>
              </TabsTrigger>
            )}
            {ftCount > 0 && (
              <TabsTrigger value="falsotelaio" className="flex-1">
                <Package className="h-4 w-4 mr-1" />
                Falsotelaio
                <Badge variant="secondary" className="ml-1">{ftCount}</Badge>
              </TabsTrigger>
            )}
            {arrCount > 0 && (
              <TabsTrigger value="arrivi" className="flex-1">
                <Truck className="h-4 w-4 mr-1" />
                In Arrivo
                <Badge variant="secondary" className="ml-1">{arrCount}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {matCount > 0 && (
            <TabsContent value="materiali">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alert.materiali_da_ordinare.map((ordine) => (
                    <div key={ordine.ordine_id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{ordine.numero_conferma}</span>
                          <span className="text-sm text-muted-foreground ml-2">{ordine.cliente}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { handleClose(); navigate(`/ordini/${ordine.ordine_id}`); }}
                        >
                          Vedi
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ordine.materiali.map((m) => (
                          <Badge key={m.materiale_id} variant="outline" className="text-xs">
                            {m.tipo_materiale}{m.sottotipo ? ` (${m.sottotipo})` : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {probCount > 0 && (
            <TabsContent value="problemi">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alert.problemi_aperti.map((p) => (
                    <div key={p.problema_id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.numero_conferma}</span>
                          <StatusBadge type="gravita" value={p.gravita} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(p.ore_aperto)}h fa
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.tipo_problema}: {p.descrizione.substring(0, 100)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Segnalato da {p.segnalato_da_nome} - {p.cliente}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {ftCount > 0 && (
            <TabsContent value="falsotelaio">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alert.ft_in_attesa.map((ft) => (
                    <div key={ft.ordine_id} className="rounded-lg border border-purple-200 bg-purple-50/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{ft.numero_conferma}</span>
                          <span className="text-sm text-muted-foreground ml-2">{ft.cliente}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { handleClose(); navigate(`/ordini/${ft.ordine_id}`); }}
                        >
                          Vedi
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge
                          variant="secondary"
                          className={ft.ft_preparato
                            ? 'bg-green-200 text-green-800'
                            : 'bg-purple-200 text-purple-800'
                          }
                        >
                          {ft.ft_preparato ? 'Preparato' : 'Da preparare'}
                        </Badge>
                        {ft.tipo_consegna_ft && (
                          <span className="text-muted-foreground text-xs">
                            {TIPI_CONSEGNA_FT_LABELS[ft.tipo_consegna_ft] || ft.tipo_consegna_ft}
                          </span>
                        )}
                        {ft.giorni_mancanti !== null && (
                          <span className={`text-xs font-medium ${
                            ft.giorni_mancanti <= 0 ? 'text-red-600' : ft.giorni_mancanti <= 3 ? 'text-orange-600' : ''
                          }`}>
                            {ft.giorni_mancanti <= 0
                              ? 'Scaduto'
                              : `Tra ${ft.giorni_mancanti} gg`}
                          </span>
                        )}
                      </div>
                      {ft.ft_preparato && ft.preparato_da && (
                        <p className="text-xs text-green-600 mt-1">
                          Preparato da {ft.preparato_da}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {arrCount > 0 && (
            <TabsContent value="arrivi">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alert.materiali_in_arrivo.map((m) => (
                    <div key={m.materiale_id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{m.numero_conferma}</span>
                        <span className="text-sm text-muted-foreground ml-2">{m.cliente}</span>
                        <div className="text-sm mt-1">
                          {m.tipo_materiale}{m.sottotipo ? ` (${m.sottotipo})` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {m.giorni_mancanti <= 0 ? (
                            <span className="text-red-600">Oggi</span>
                          ) : m.giorni_mancanti === 1 ? (
                            <span className="text-orange-600">Domani</span>
                          ) : (
                            <span>Tra {m.giorni_mancanti} giorni</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.data_consegna_prevista}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleClose}>Chiudi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
