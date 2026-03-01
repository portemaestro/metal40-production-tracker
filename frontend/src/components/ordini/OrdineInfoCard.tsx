import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TIPI_TELAIO_LABELS, TIPI_CONSEGNA_FT_LABELS } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { useMarkFtConsegnato } from '@/hooks/useOrdini';
import { Zap, Package, CheckCircle2, Truck } from 'lucide-react';
import type { Ordine } from '@/types';

interface OrdineInfoCardProps {
  ordine: Ordine;
}

export function OrdineInfoCard({ ordine }: OrdineInfoCardProps) {
  const { user } = useAuth();
  const ftConsegnatoMutation = useMarkFtConsegnato();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informazioni Ordine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Banner consegna anticipata falsotelaio */}
        {ordine.consegna_anticipata_ft && (
          <div className={`rounded-lg p-3 border ${
            ordine.ft_consegnato
              ? 'bg-green-50 border-green-300'
              : ordine.ft_preparato
              ? 'bg-green-50 border-green-200'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                {ordine.ft_consegnato ? (
                  <Truck className="h-5 w-5 text-green-700 shrink-0" />
                ) : ordine.ft_preparato ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Package className="h-5 w-5 text-purple-600 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    ordine.ft_consegnato
                      ? 'text-green-800'
                      : ordine.ft_preparato
                      ? 'text-green-700'
                      : 'text-purple-700'
                  }`}>
                    {ordine.ft_consegnato
                      ? `Falsotelaio consegnato/spedito il ${new Date(ordine.data_consegna_effettiva_ft!).toLocaleDateString('it-IT')}`
                      : ordine.ft_preparato
                      ? `Falsotelaio preparato da ${ordine.user_ft_preparato?.nome} ${ordine.user_ft_preparato?.cognome} - In attesa di consegna`
                      : 'Consegna anticipata falsotelaio richiesta'}
                  </p>
                  <p className={`text-xs ${
                    ordine.ft_consegnato ? 'text-green-600' : ordine.ft_preparato ? 'text-green-600' : 'text-purple-600'
                  }`}>
                    {ordine.tipo_consegna_ft && (TIPI_CONSEGNA_FT_LABELS[ordine.tipo_consegna_ft] || ordine.tipo_consegna_ft)}
                    {ordine.data_consegna_ft && !ordine.ft_consegnato &&
                      ` - Consegna prevista: ${new Date(ordine.data_consegna_ft).toLocaleDateString('it-IT')}`}
                  </p>
                </div>
              </div>
              {user?.ruolo === 'ufficio' && ordine.ft_preparato && !ordine.ft_consegnato && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                  disabled={ftConsegnatoMutation.isPending}
                  onClick={() => ftConsegnatoMutation.mutate(ordine.id)}
                >
                  <Truck className="mr-1 h-4 w-4" />
                  {ftConsegnatoMutation.isPending ? 'Salvataggio...' : 'Segna Consegnato'}
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Numero Conferma</span>
            <p className="font-medium">{ordine.numero_conferma}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cliente</span>
            <p className="font-medium">{ordine.cliente}</p>
          </div>
          {ordine.riferimento && (
            <div>
              <span className="text-muted-foreground">Riferimento</span>
              <p className="font-medium">{ordine.riferimento}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Data Ordine</span>
            <p className="font-medium">{new Date(ordine.data_ordine).toLocaleDateString('it-IT')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tipo Telaio</span>
            <p className="font-medium">{TIPI_TELAIO_LABELS[ordine.tipo_telaio] || ordine.tipo_telaio}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Quantita Porte</span>
            <p className="font-medium">{ordine.quantita_porte}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Stato</span>
            <div className="mt-1"><StatusBadge type="ordine" value={ordine.stato} /></div>
          </div>
          <div>
            <span className="text-muted-foreground">Urgente</span>
            <p className="font-medium flex items-center gap-1">
              {ordine.urgente ? (
                <>
                  <Zap className="h-4 w-4 text-orange-500" />
                  Si - {ordine.data_tassativa ? new Date(ordine.data_tassativa).toLocaleDateString('it-IT') : ''}
                </>
              ) : 'No'}
            </p>
          </div>
          {ordine.colore_telaio_esterno && (
            <div>
              <span className="text-muted-foreground">Colore Esterno</span>
              <p className="font-medium">{ordine.colore_telaio_esterno}</p>
            </div>
          )}
          {ordine.colore_telaio_interno && (
            <div>
              <span className="text-muted-foreground">Colore Interno</span>
              <p className="font-medium">{ordine.colore_telaio_interno}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Verniciatura</span>
            <p className="font-medium">{ordine.verniciatura_necessaria ? 'Necessaria' : 'Non necessaria'}</p>
          </div>
          {ordine.note_generali && (
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Note</span>
              <p className="font-medium">{ordine.note_generali}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
