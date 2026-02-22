import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TIPI_TELAIO_LABELS } from '@/utils/constants';
import { Zap } from 'lucide-react';
import type { Ordine } from '@/types';

interface OrdineInfoCardProps {
  ordine: Ordine;
}

export function OrdineInfoCard({ ordine }: OrdineInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informazioni Ordine</CardTitle>
      </CardHeader>
      <CardContent>
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
