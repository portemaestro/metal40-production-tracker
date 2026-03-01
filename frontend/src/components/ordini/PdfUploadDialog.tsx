import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { uploadPdf, type PdfUploadResponse } from '@/services/upload';
import type { MaterialePdf } from '@/services/ordini';
import { TIPI_TELAIO_LABELS, TIPI_CONSEGNA_FT_LABELS } from '@/utils/constants';
import { FileUp, Loader2, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

interface PdfUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = 'upload' | 'review';

const COLORI_STANDARD = ['marrone', 'bianco'];

function isVerniciaturaNecessaria(coloreEsterno: string, coloreInterno: string): boolean {
  const ext = coloreEsterno.toLowerCase().trim();
  const int = coloreInterno.toLowerCase().trim();
  const extStandard = !ext || COLORI_STANDARD.some(c => ext.includes(c));
  const intStandard = !int || COLORI_STANDARD.some(c => int.includes(c));
  return !extStandard || !intStandard;
}

function buildMaterialiFromExtracted(data: { pannello_esterno_tipo: string; pannello_esterno_colore: string; pannello_interno_tipo: string; pannello_interno_colore: string; mostrine: string; kit_imbotte: string; vetro: string; maniglione: string }): MaterialePdf[] {
  const materiali: MaterialePdf[] = [];

  if (data.pannello_esterno_tipo) {
    materiali.push({
      tipo_materiale: 'pannello_esterno',
      sottotipo: data.pannello_esterno_tipo.toLowerCase(),
      note: data.pannello_esterno_colore || null,
    });
  }
  if (data.pannello_interno_tipo) {
    materiali.push({
      tipo_materiale: 'pannello_interno_speciale',
      sottotipo: data.pannello_interno_tipo.toLowerCase(),
      note: data.pannello_interno_colore || null,
    });
  }
  if (data.mostrine) {
    materiali.push({ tipo_materiale: 'mostrine', note: data.mostrine });
  }
  if (data.kit_imbotte) {
    materiali.push({ tipo_materiale: 'kit_imbotte', note: data.kit_imbotte });
  }
  if (data.vetro) {
    materiali.push({ tipo_materiale: 'vetro', note: data.vetro });
  }
  if (data.maniglione) {
    materiali.push({ tipo_materiale: 'maniglione', note: data.maniglione });
  }

  return materiali;
}

function mapTipoTelaio(raw: string): string {
  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  if (normalized in TIPI_TELAIO_LABELS) return normalized;

  if (normalized.includes('falsotelaio') && !normalized.includes('non_nostro')) return 'standard_falsotelaio';
  if (normalized.includes('ristrutturazione') && normalized.includes('l')) return 'ristrutturazione_l';
  if (normalized.includes('ristrutturazione') && normalized.includes('z')) return 'ristrutturazione_z';
  if (normalized.includes('non_nostro') || normalized.includes('non nostro')) return 'falsotelaio_non_nostro';

  return raw;
}

export function PdfUploadDialog({ open, onOpenChange }: PdfUploadDialogProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfUploadResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setPhase('upload');
    setUploading(false);
    setError(null);
    setResult(null);
    setDragOver(false);
  }, []);

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Seleziona un file PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Il file supera il limite di 10MB');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const data = await uploadPdf(file);
      setResult(data);
      setPhase('review');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore durante il caricamento';
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleCreateOrdine() {
    if (!result) return;

    const extracted = result.extracted_data;
    const tipoTelaio = extracted ? mapTipoTelaio(extracted.tipo_telaio) : '';
    const coloreEst = extracted?.colore_telaio_esterno || '';
    const coloreInt = extracted?.colore_telaio_interno || '';

    const materialiPdf = extracted ? buildMaterialiFromExtracted(extracted) : [];

    const defaultValues: Record<string, unknown> = {
      numero_conferma: extracted?.numero_conferma || '',
      cliente: extracted?.cliente || '',
      tipo_telaio: tipoTelaio in TIPI_TELAIO_LABELS ? tipoTelaio : '',
      colore_telaio_esterno: coloreEst,
      colore_telaio_interno: coloreInt,
      verniciatura_necessaria: extracted ? isVerniciaturaNecessaria(coloreEst, coloreInt) : false,
      note_generali: extracted?.note || '',
      consegna_anticipata_ft: extracted?.consegna_anticipata_ft || false,
      tipo_consegna_ft: extracted?.tipo_consegna_ft || '',
      data_consegna_ft: extracted?.data_consegna_ft || '',
    };

    onOpenChange(false);
    navigate('/ordini/nuovo', {
      state: {
        defaultValues,
        pdfPath: result.pdf_key,
        materialiPdf,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importa Ordine da PDF
          </DialogTitle>
        </DialogHeader>

        {phase === 'upload' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              } ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!uploading) document.getElementById('pdf-file-input')?.click();
              }}
            >
              <input
                id="pdf-file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInput}
              />
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Caricamento e analisi AI in corso...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileUp className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Trascina il PDF qui</p>
                    <p className="text-sm text-muted-foreground">
                      oppure clicca per selezionare (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {phase === 'review' && result && (
          <div className="space-y-4">
            {/* AI status */}
            <div className="flex items-center gap-2">
              {result.ai_success ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Dati estratti con successo</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Estrazione AI non riuscita. Il PDF e stato caricato, compila i dati manualmente.
                  </span>
                </>
              )}
            </div>

            {/* Extracted data table */}
            {result.extracted_data && (
              <div className="border rounded-lg divide-y text-sm max-h-[350px] overflow-y-auto">
                <DataRow label="Numero Conferma" value={result.extracted_data.numero_conferma} />
                <DataRow label="Cliente" value={result.extracted_data.cliente} />
                <DataRow label="Tipo Telaio" value={
                  TIPI_TELAIO_LABELS[mapTipoTelaio(result.extracted_data.tipo_telaio)] ||
                  result.extracted_data.tipo_telaio
                } />
                <DataRow label="Colore Esterno" value={result.extracted_data.colore_telaio_esterno} />
                <DataRow label="Colore Interno" value={result.extracted_data.colore_telaio_interno} />
                <DataRow label="Pannello Esterno" value={
                  [result.extracted_data.pannello_esterno_tipo, result.extracted_data.pannello_esterno_colore]
                    .filter(Boolean).join(' - ')
                } />
                <DataRow label="Pannello Interno" value={
                  [result.extracted_data.pannello_interno_tipo, result.extracted_data.pannello_interno_colore]
                    .filter(Boolean).join(' - ')
                } />
                <DataRow label="Mostrine" value={result.extracted_data.mostrine} />
                <DataRow label="Kit Imbotte" value={result.extracted_data.kit_imbotte} />
                <DataRow label="Vetro" value={result.extracted_data.vetro} />
                <DataRow label="Maniglione" value={result.extracted_data.maniglione} />
                <DataRow label="Note" value={result.extracted_data.note} />
                {result.extracted_data.consegna_anticipata_ft && (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 bg-purple-50">
                      <span className="text-muted-foreground">Consegna Anticipata FT</span>
                      <Badge variant="outline" className="text-purple-700 border-purple-300">
                        Si
                      </Badge>
                    </div>
                    {result.extracted_data.tipo_consegna_ft && (
                      <DataRow
                        label="Tipo Consegna FT"
                        value={TIPI_CONSEGNA_FT_LABELS[result.extracted_data.tipo_consegna_ft] || result.extracted_data.tipo_consegna_ft}
                      />
                    )}
                    {result.extracted_data.data_consegna_ft && (
                      <DataRow label="Data Consegna FT" value={result.extracted_data.data_consegna_ft} />
                    )}
                  </>
                )}
                {isVerniciaturaNecessaria(
                  result.extracted_data.colore_telaio_esterno,
                  result.extracted_data.colore_telaio_interno,
                ) && (
                  <div className="flex items-center justify-between px-3 py-2 bg-yellow-50">
                    <span className="text-muted-foreground">Verniciatura</span>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      Necessaria
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { reset(); }}>
                Carica un altro PDF
              </Button>
              <Button onClick={handleCreateOrdine}>
                Crea Ordine con questi dati
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between px-3 py-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right ml-4 font-medium">{value || '-'}</span>
    </div>
  );
}
