import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CompletePhaseDialog } from './CompletePhaseDialog';
import { ReportProblemDialog } from './ReportProblemDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { MaterialReceiptDialog } from './MaterialReceiptDialog';
import { TIPI_TELAIO_LABELS, TIPI_MATERIALE_LABELS } from '@/utils/constants';
import {
  Zap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MessageSquarePlus,
  Package,
  FileText,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ordine, FaseProduzione } from '@/types';

interface OperatorOrdineDetailProps {
  ordine: Ordine;
  fasiOperatore: FaseProduzione[];
}

export function OperatorOrdineDetail({ ordine, fasiOperatore }: OperatorOrdineDetailProps) {
  const [completeDialogFase, setCompleteDialogFase] = useState<FaseProduzione | null>(null);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [materialReceiptOpen, setMaterialReceiptOpen] = useState(false);

  // Find phases that the operator can complete (da_fare)
  const fasiDaFare = fasiOperatore.filter((f) => f.stato === 'da_fare');

  // Count materials status
  const materialiNecessari = ordine.materiali?.filter((m) => m.necessario) ?? [];
  const materialiDaOrdinare = materialiNecessari.filter((m) => !m.ordine_effettuato);
  const materialiInAttesa = materialiNecessari.filter((m) => m.ordine_effettuato && !m.arrivato);
  const materialiArrivati = materialiNecessari.filter((m) => m.arrivato);

  return (
    <div className="space-y-4">
      {/* Order Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{ordine.numero_conferma}</h2>
                {ordine.urgente && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500">
                    <Zap className="mr-1 h-3 w-3" /> Urgente
                  </Badge>
                )}
                <StatusBadge type="ordine" value={ordine.stato} />
              </div>
              <p className="text-muted-foreground mt-1">{ordine.cliente}</p>
            </div>
            {ordine.pdf_path && (
              <a
                href={ordine.pdf_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                <FileText className="h-4 w-4" /> PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo telaio</span>
              <p className="font-medium">{TIPI_TELAIO_LABELS[ordine.tipo_telaio] || ordine.tipo_telaio}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Porte</span>
              <p className="font-medium">{ordine.quantita_porte}</p>
            </div>
            {ordine.data_tassativa && (
              <div>
                <span className="text-muted-foreground">Data tassativa</span>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(ordine.data_tassativa).toLocaleDateString('it-IT')}
                </p>
              </div>
            )}
            {ordine.riferimento && (
              <div>
                <span className="text-muted-foreground">Riferimento</span>
                <p className="font-medium">{ordine.riferimento}</p>
              </div>
            )}
          </div>

          {ordine.note_generali && (
            <div className="mt-3 rounded-lg bg-muted/50 p-3">
              <p className="text-sm">{ordine.note_generali}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        {fasiDaFare.length > 0 && (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 h-14 text-base"
            onClick={() => setCompleteDialogFase(fasiDaFare[0])}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Completa Fase
          </Button>
        )}
        <Button
          size="lg"
          variant="destructive"
          className="h-14 text-base"
          onClick={() => setReportProblemOpen(true)}
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          Segnala Problema
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base"
          onClick={() => setAddNoteOpen(true)}
        >
          <MessageSquarePlus className="mr-2 h-5 w-5" />
          Aggiungi Nota
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base"
          onClick={() => setMaterialReceiptOpen(true)}
        >
          <Package className="mr-2 h-5 w-5" />
          Arrivo Materiale
        </Button>
      </div>

      {/* Materiali status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" /> Materiali
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materialiNecessari.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun materiale necessario</p>
          ) : (
            <div className="space-y-2">
              {/* Summary */}
              <div className="flex gap-3 text-xs mb-3">
                {materialiDaOrdinare.length > 0 && (
                  <span className="text-yellow-700">
                    {materialiDaOrdinare.length} da ordinare
                  </span>
                )}
                {materialiInAttesa.length > 0 && (
                  <span className="text-blue-700">
                    {materialiInAttesa.length} in attesa
                  </span>
                )}
                {materialiArrivati.length > 0 && (
                  <span className="text-green-700">
                    {materialiArrivati.length} arrivati
                  </span>
                )}
              </div>

              {/* Material list */}
              {materialiNecessari.map((m) => {
                const stato = m.arrivato ? 'arrivato' : m.ordine_effettuato ? 'in_attesa' : 'da_ordinare';
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg p-2 text-sm',
                      stato === 'arrivato' && 'bg-green-50',
                      stato === 'in_attesa' && 'bg-blue-50',
                      stato === 'da_ordinare' && 'bg-yellow-50',
                    )}
                  >
                    <span>
                      {TIPI_MATERIALE_LABELS[m.tipo_materiale] || m.tipo_materiale}
                      {m.sottotipo && ` - ${m.sottotipo}`}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        stato === 'arrivato' && 'bg-green-200 text-green-800',
                        stato === 'in_attesa' && 'bg-blue-200 text-blue-800',
                        stato === 'da_ordinare' && 'bg-yellow-200 text-yellow-800',
                      )}
                    >
                      {stato === 'arrivato' ? 'Arrivato' : stato === 'in_attesa' ? 'In attesa' : 'Da ordinare'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline fasi */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" /> Fasi Produzione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {ordine.fasi?.map((fase, index) => {
              const isMyPhase = fasiOperatore.some((f) => f.id === fase.id);
              return (
                <div
                  key={fase.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-2 text-sm',
                    isMyPhase && 'bg-primary/5 font-medium',
                  )}
                >
                  <div className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0',
                    fase.stato === 'completata'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    {fase.stato === 'completata' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      fase.stato === 'completata' && 'text-green-700'
                    )}>
                      {fase.nome_fase}
                    </span>
                  </div>
                  {fase.stato === 'completata' && fase.user && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <User className="h-3 w-3" />
                      {fase.user.nome}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Note recenti */}
      {ordine.note && ordine.note.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4" /> Note ({ordine.note.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordine.note.slice(0, 5).map((nota) => (
                <div key={nota.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{nota.user?.nome} {nota.user?.cognome}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(nota.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{nota.testo}</p>
                  {nota.foto_paths && nota.foto_paths.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {nota.foto_paths.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="h-12 w-12 rounded object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  <Separator className="mt-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Problemi aperti */}
      {ordine.problemi && ordine.problemi.filter((p) => !p.risolto).length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Problemi Aperti ({ordine.problemi.filter((p) => !p.risolto).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordine.problemi
                .filter((p) => !p.risolto)
                .map((problema) => (
                  <div key={problema.id} className="rounded-lg bg-red-50 p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge type="gravita" value={problema.gravita} />
                      <span className="font-medium">{problema.tipo_problema}</span>
                    </div>
                    <p className="text-muted-foreground">{problema.descrizione}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Segnalato da {problema.user_segnalatore?.nome} {problema.user_segnalatore?.cognome} -{' '}
                      {new Date(problema.data_segnalazione).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {completeDialogFase && (
        <CompletePhaseDialog
          open={!!completeDialogFase}
          onOpenChange={(open) => { if (!open) setCompleteDialogFase(null); }}
          fase={completeDialogFase}
        />
      )}

      <ReportProblemDialog
        open={reportProblemOpen}
        onOpenChange={setReportProblemOpen}
        ordineId={ordine.id}
        faseCorrente={fasiDaFare[0]?.nome_fase}
      />

      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        ordineId={ordine.id}
      />

      <MaterialReceiptDialog
        open={materialReceiptOpen}
        onOpenChange={setMaterialReceiptOpen}
        ordineId={ordine.id}
      />
    </div>
  );
}
