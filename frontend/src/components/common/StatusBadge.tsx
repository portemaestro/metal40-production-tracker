import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATO_ORDINE_STYLES: Record<string, string> = {
  in_produzione: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  bloccato: 'bg-red-100 text-red-800 hover:bg-red-100',
  pronto_spedizione: 'bg-green-100 text-green-800 hover:bg-green-100',
  spedito: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

const STATO_ORDINE_LABELS: Record<string, string> = {
  in_produzione: 'In Produzione',
  bloccato: 'Bloccato',
  pronto_spedizione: 'Pronto Spedizione',
  spedito: 'Spedito',
};

const GRAVITA_STYLES: Record<string, string> = {
  bassa: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  media: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  alta_bloccante: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const GRAVITA_LABELS: Record<string, string> = {
  bassa: 'Bassa',
  media: 'Media',
  alta_bloccante: 'Alta (Bloccante)',
};

const MATERIALE_STYLES: Record<string, string> = {
  da_ordinare: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  ordinato: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  arrivato: 'bg-green-100 text-green-800 hover:bg-green-100',
};

interface StatusBadgeProps {
  type: 'ordine' | 'gravita' | 'materiale' | 'fase';
  value: string;
  className?: string;
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  let style = '';
  let label = value;

  switch (type) {
    case 'ordine':
      style = STATO_ORDINE_STYLES[value] || '';
      label = STATO_ORDINE_LABELS[value] || value;
      break;
    case 'gravita':
      style = GRAVITA_STYLES[value] || '';
      label = GRAVITA_LABELS[value] || value;
      break;
    case 'materiale':
      style = MATERIALE_STYLES[value] || '';
      label = value === 'da_ordinare' ? 'Da Ordinare' : value === 'ordinato' ? 'Ordinato' : 'Arrivato';
      break;
    case 'fase':
      style = value === 'completata'
        ? 'bg-green-100 text-green-800 hover:bg-green-100'
        : 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      label = value === 'completata' ? 'Completata' : 'Da Fare';
      break;
  }

  return (
    <Badge variant="secondary" className={cn(style, className)}>
      {label}
    </Badge>
  );
}
