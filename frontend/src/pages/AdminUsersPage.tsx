import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, createUserApi, updateUserApi, deleteUserApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { UserForm } from '@/components/admin/UserForm';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { REPARTI_LABELS, RUOLI_LABELS } from '@/utils/constants';
import type { AdminUser } from '@/types';
import { UserPlus, Pencil, UserX, UserCheck } from 'lucide-react';

export function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await getAdminUsers();
      return res.data.users;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      createUserApi(payload as unknown as Parameters<typeof createUserApi>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateUserApi(id, payload as Parameters<typeof updateUserApi>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, attivo }: { id: number; attivo: boolean }) => {
      if (attivo) {
        await updateUserApi(id, { attivo: true });
      } else {
        await deleteUserApi(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Guard: only ufficio
  if (user?.ruolo !== 'ufficio') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Utenti</h1>
          <p className="text-muted-foreground">Crea, modifica e gestisci gli utenti del sistema</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      {(createMutation.error || updateMutation.error || toggleMutation.error) && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {getErrorMessage(createMutation.error || updateMutation.error || toggleMutation.error)}
        </div>
      )}

      {isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Reparti</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((u) => (
                  <TableRow key={u.id} className={!u.attivo ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      {u.nome} {u.cognome}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.ruolo === 'ufficio' ? 'default' : 'secondary'}>
                        {RUOLI_LABELS[u.ruolo] || u.ruolo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.ruolo === 'operatore' && u.reparti.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.reparti.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs">
                              {REPARTI_LABELS[r] || r}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.attivo ? 'default' : 'destructive'}>
                        {u.attivo ? 'Attivo' : 'Disattivato'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(u)}
                          title="Modifica"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleMutation.mutate({ id: u.id, attivo: !u.attivo })
                          }
                          disabled={toggleMutation.isPending}
                          title={u.attivo ? 'Disattiva' : 'Riattiva'}
                        >
                          {u.attivo ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nessun altro utente trovato
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <UserForm
        open={formOpen}
        onClose={() => { setFormOpen(false); createMutation.reset(); }}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <UserForm
        key={editingUser?.id ?? 'new'}
        open={!!editingUser}
        onClose={() => { setEditingUser(null); updateMutation.reset(); }}
        onSubmit={(data) =>
          editingUser && updateMutation.mutate({ id: editingUser.id, payload: data })
        }
        user={editingUser}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error && 'response' in error) {
    const axiosErr = error as { response?: { data?: { error?: { message?: string } } } };
    return axiosErr.response?.data?.error?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Errore sconosciuto';
}
