import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronDown, Delete, User, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUsersApi } from '@/services/api';
import type { LoginUser } from '@/types';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [users, setUsers] = useState<LoginUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<LoginUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pin, setPin] = useState('');

  // Fetch lista utenti
  useEffect(() => {
    getUsersApi()
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch(() => {
        // Silently fail - users list will be empty
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  // PIN pad handler
  const addDigit = useCallback(
    (digit: string) => {
      if (error) clearError();
      setPin((prev) => (prev.length < 4 ? prev + digit : prev));
    },
    [error, clearError],
  );

  const removeDigit = useCallback(() => {
    if (error) clearError();
    setPin((prev) => prev.slice(0, -1));
  }, [error, clearError]);

  // Submit quando il PIN e' completo (4 cifre)
  const handleSubmit = useCallback(async () => {
    if (!selectedUser || pin.length !== 4) return;
    try {
      await login(selectedUser.email, pin);
      navigate('/', { replace: true });
    } catch {
      setPin('');
    }
  }, [selectedUser, pin, login, navigate]);

  // Auto-submit quando PIN raggiunge 4 cifre
  useEffect(() => {
    if (pin.length === 4 && selectedUser && !isLoading) {
      handleSubmit();
    }
  }, [pin, selectedUser, isLoading, handleSubmit]);

  const selectUser = (user: LoginUser) => {
    if (error) clearError();
    setSelectedUser(user);
    setDropdownOpen(false);
    setPin('');
  };

  const ruoloLabel = (ruolo: string) =>
    ruolo === 'ufficio' ? 'Ufficio' : 'Operatore';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-2xl font-bold">M4</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Metal 4.0</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestione Produzione
          </p>
        </div>

        {/* Card login */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          {/* Errore */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Dropdown operatore */}
          <div className="mb-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <User className="h-4 w-4" />
              Operatore
            </label>

            {loadingUsers ? (
              <div className="flex h-12 items-center justify-center rounded-lg border bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {selectedUser ? (
                    <span className="font-medium">
                      {selectedUser.nome} {selectedUser.cognome}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({ruoloLabel(selectedUser.ruolo)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Seleziona operatore...
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-card shadow-lg">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectUser(user)}
                        className={`flex w-full items-center px-3 py-3 text-left text-sm transition-colors hover:bg-accent ${
                          selectedUser?.id === user.id
                            ? 'bg-primary/10 font-medium'
                            : ''
                        }`}
                      >
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {user.nome[0]}
                          {user.cognome[0]}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.nome} {user.cognome}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ruoloLabel(user.ruolo)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PIN display */}
          {selectedUser && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4" />
                PIN
              </label>

              {/* PIN dots */}
              <div className="mb-4 flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                      i < pin.length
                        ? 'scale-110 border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
                  (digit) => (
                    <button
                      key={digit}
                      type="button"
                      disabled={isLoading || pin.length >= 4}
                      onClick={() => addDigit(digit)}
                      className="flex h-14 items-center justify-center rounded-xl border bg-background text-xl font-medium transition-colors hover:bg-accent active:bg-accent/80 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {digit}
                    </button>
                  ),
                )}

                {/* Riga inferiore: vuoto - 0 - cancella */}
                <div />
                <button
                  type="button"
                  disabled={isLoading || pin.length >= 4}
                  onClick={() => addDigit('0')}
                  className="flex h-14 items-center justify-center rounded-xl border bg-background text-xl font-medium transition-colors hover:bg-accent active:bg-accent/80 disabled:pointer-events-none disabled:opacity-50"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={isLoading || pin.length === 0}
                  onClick={removeDigit}
                  className="flex h-14 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent/80 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Accesso in corso...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
