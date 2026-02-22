import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TIPI_TELAIO_LABELS } from '@/utils/constants';
import { FileText } from 'lucide-react';
import type { Ordine } from '@/types';

const ordineFormSchema = z
  .object({
    numero_conferma: z.string().min(1, 'Numero conferma obbligatorio').max(20),
    cliente: z.string().min(1, 'Cliente obbligatorio').max(255),
    riferimento: z.string().max(255).optional(),
    data_ordine: z.string().min(1, 'Data ordine obbligatoria'),
    quantita_porte: z.coerce.number().int().positive('Deve essere positivo'),
    tipo_telaio: z.string().min(1, 'Tipo telaio obbligatorio'),
    colore_telaio_interno: z.string().max(50).optional(),
    colore_telaio_esterno: z.string().max(50).optional(),
    verniciatura_necessaria: z.boolean().optional(),
    urgente: z.boolean(),
    data_tassativa: z.string().optional(),
    note_generali: z.string().optional(),
  })
  .refine((data) => !data.urgente || data.data_tassativa, {
    message: 'Data tassativa obbligatoria per ordini urgenti',
    path: ['data_tassativa'],
  });

type OrdineFormValues = z.infer<typeof ordineFormSchema>;

interface OrdineFormProps {
  defaultValues?: Partial<OrdineFormValues>;
  ordine?: Ordine;
  pdfPath?: string;
  onSubmit: (data: OrdineFormValues) => void;
  loading?: boolean;
}

export function OrdineForm({ defaultValues, ordine, pdfPath, onSubmit, loading }: OrdineFormProps) {
  const isEditing = !!ordine;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrdineFormValues>({
    resolver: zodResolver(ordineFormSchema),
    defaultValues: {
      numero_conferma: ordine?.numero_conferma || '',
      cliente: ordine?.cliente || '',
      riferimento: ordine?.riferimento || '',
      data_ordine: ordine?.data_ordine ? ordine.data_ordine.split('T')[0] : new Date().toISOString().split('T')[0],
      quantita_porte: ordine?.quantita_porte || 1,
      tipo_telaio: ordine?.tipo_telaio || '',
      colore_telaio_interno: ordine?.colore_telaio_interno || '',
      colore_telaio_esterno: ordine?.colore_telaio_esterno || '',
      verniciatura_necessaria: ordine?.verniciatura_necessaria || false,
      urgente: ordine?.urgente || false,
      data_tassativa: ordine?.data_tassativa ? ordine.data_tassativa.split('T')[0] : '',
      note_generali: ordine?.note_generali || '',
      ...defaultValues,
    },
  });

  const urgente = watch('urgente');

  function handleFormSubmit(data: OrdineFormValues) {
    // Clean empty strings to undefined for optional fields
    const cleaned = { ...data } as Record<string, unknown>;
    const optionalStringFields = ['riferimento', 'data_tassativa', 'note_generali', 'colore_telaio_interno', 'colore_telaio_esterno'];
    for (const field of optionalStringFields) {
      if (cleaned[field] === '') {
        delete cleaned[field];
      }
    }
    onSubmit(cleaned as OrdineFormValues);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {pdfPath && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">Dati importati da PDF - verifica e completa i campi</span>
              <Badge variant="outline" className="ml-auto text-blue-600 border-blue-300">PDF</Badge>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Numero conferma */}
            <div className="space-y-2">
              <Label htmlFor="numero_conferma">Numero Conferma *</Label>
              <Input
                id="numero_conferma"
                {...register('numero_conferma')}
                disabled={isEditing}
                placeholder="Es. 2024-001"
              />
              {errors.numero_conferma && (
                <p className="text-sm text-destructive">{errors.numero_conferma.message}</p>
              )}
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input id="cliente" {...register('cliente')} placeholder="Nome cliente" />
              {errors.cliente && (
                <p className="text-sm text-destructive">{errors.cliente.message}</p>
              )}
            </div>

            {/* Riferimento */}
            <div className="space-y-2">
              <Label htmlFor="riferimento">Riferimento</Label>
              <Input id="riferimento" {...register('riferimento')} placeholder="Riferimento ordine" />
            </div>

            {/* Data ordine */}
            <div className="space-y-2">
              <Label htmlFor="data_ordine">Data Ordine *</Label>
              <Input id="data_ordine" type="date" {...register('data_ordine')} />
              {errors.data_ordine && (
                <p className="text-sm text-destructive">{errors.data_ordine.message}</p>
              )}
            </div>

            {/* Quantita porte */}
            <div className="space-y-2">
              <Label htmlFor="quantita_porte">Quantita Porte *</Label>
              <Input id="quantita_porte" type="number" min={1} {...register('quantita_porte')} />
              {errors.quantita_porte && (
                <p className="text-sm text-destructive">{errors.quantita_porte.message}</p>
              )}
            </div>

            {/* Tipo telaio */}
            <div className="space-y-2">
              <Label>Tipo Telaio *</Label>
              <Select
                value={watch('tipo_telaio')}
                onValueChange={(v) => setValue('tipo_telaio', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo telaio" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPI_TELAIO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo_telaio && (
                <p className="text-sm text-destructive">{errors.tipo_telaio.message}</p>
              )}
            </div>

            {/* Colore esterno */}
            <div className="space-y-2">
              <Label htmlFor="colore_telaio_esterno">Colore Esterno</Label>
              <Input id="colore_telaio_esterno" {...register('colore_telaio_esterno')} placeholder="Es. marrone, bianco, RAL 7016" />
            </div>

            {/* Colore interno */}
            <div className="space-y-2">
              <Label htmlFor="colore_telaio_interno">Colore Interno</Label>
              <Input id="colore_telaio_interno" {...register('colore_telaio_interno')} placeholder="Es. marrone, bianco, RAL 9010" />
            </div>
          </div>

          {/* Verniciatura */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verniciatura_necessaria"
              {...register('verniciatura_necessaria')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="verniciatura_necessaria">Verniciatura necessaria</Label>
          </div>

          {/* Urgente */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="urgente"
              {...register('urgente')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="urgente">Ordine urgente</Label>
          </div>

          {/* Data tassativa (solo se urgente) */}
          {urgente && (
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="data_tassativa">Data Tassativa *</Label>
              <Input id="data_tassativa" type="date" {...register('data_tassativa')} />
              {errors.data_tassativa && (
                <p className="text-sm text-destructive">{errors.data_tassativa.message}</p>
              )}
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note_generali">Note Generali</Label>
            <Textarea
              id="note_generali"
              {...register('note_generali')}
              placeholder="Note aggiuntive..."
              className="min-h-[80px]"
            />
          </div>

          {/* Azioni */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Ordine'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
