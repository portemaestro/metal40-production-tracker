import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useCreaNota } from '@/hooks/useNote';
import { MessageSquare, AlertTriangle, Send } from 'lucide-react';
import type { Nota, Problema } from '@/types';

interface OrdineNoteProbCardProps {
  ordineId: number;
  note: Nota[];
  problemi: Problema[];
}

export function OrdineNoteProbCard({ ordineId, note, problemi }: OrdineNoteProbCardProps) {
  const [nuovaNota, setNuovaNota] = useState('');
  const creaNotaMutation = useCreaNota();

  function handleCreaNota() {
    if (!nuovaNota.trim()) return;
    creaNotaMutation.mutate(
      { ordineId, data: { testo: nuovaNota.trim() } },
      {
        onSuccess: () => setNuovaNota(''),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Note e Problemi</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="note">
          <TabsList>
            <TabsTrigger value="note">
              <MessageSquare className="h-4 w-4 mr-1" />
              Note ({note.length})
            </TabsTrigger>
            <TabsTrigger value="problemi">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Problemi ({problemi.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="note" className="space-y-3 mt-3">
            {/* Nuova nota */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Scrivi una nota..."
                value={nuovaNota}
                onChange={(e) => setNuovaNota(e.target.value)}
                className="min-h-[60px]"
              />
              <Button
                size="sm"
                onClick={handleCreaNota}
                disabled={!nuovaNota.trim() || creaNotaMutation.isPending}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista note */}
            {note.map((n) => (
              <div key={n.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {n.user?.nome} {n.user?.cognome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString('it-IT')}
                  </span>
                </div>
                <p className="text-sm">{n.testo}</p>
              </div>
            ))}

            {note.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessuna nota per questo ordine
              </p>
            )}
          </TabsContent>

          <TabsContent value="problemi" className="space-y-3 mt-3">
            {problemi.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge type="gravita" value={p.gravita} />
                    <span className="text-sm font-medium">{p.tipo_problema}</span>
                  </div>
                  <span className={`text-xs font-medium ${p.risolto ? 'text-green-600' : 'text-red-600'}`}>
                    {p.risolto ? 'Risolto' : 'Aperto'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{p.descrizione}</p>
                {p.fase && (
                  <p className="text-xs text-muted-foreground mt-1">Fase: {p.fase}</p>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Segnalato da {p.user_segnalatore?.nome} {p.user_segnalatore?.cognome} - {new Date(p.data_segnalazione).toLocaleString('it-IT')}
                </div>
                {p.risolto && p.descrizione_risoluzione && (
                  <div className="mt-2 rounded bg-green-50 p-2 text-sm">
                    <span className="font-medium text-green-800">Risoluzione:</span>{' '}
                    <span className="text-green-700">{p.descrizione_risoluzione}</span>
                  </div>
                )}
              </div>
            ))}

            {problemi.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessun problema per questo ordine
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
