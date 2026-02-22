import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useSocket } from '@/hooks/useSocket';
import { MainLayout } from '@/components/Layout/MainLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OperatorDashboardPage } from '@/pages/OperatorDashboardPage';
import { OperatorOrdineDetailPage } from '@/pages/OperatorOrdineDetailPage';
import { OrdiniPage } from '@/pages/OrdiniPage';
import { OrdineDetailPage } from '@/pages/OrdineDetailPage';
import { OrdineFormPage } from '@/pages/OrdineFormPage';
import { MaterialiPage } from '@/pages/MaterialiPage';
import { ProblemiPage } from '@/pages/ProblemiPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // While restoring session (token exists but user not yet loaded)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function RoleDashboard() {
  const user = useAuthStore((s) => s.user);
  if (user?.ruolo === 'operatore') {
    return <OperatorDashboardPage />;
  }
  return <DashboardPage />;
}

function AppRoutes() {
  const { restoreSession } = useAuth();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [initializing, setInitializing] = useState(true);

  // Connect WebSocket when authenticated
  useSocket();

  useEffect(() => {
    async function init() {
      if (token && !user) {
        await restoreSession();
      }
      setInitializing(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        token && user ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<RoleDashboard />} />
        {/* Operator routes */}
        <Route path="/ordine/:id" element={<OperatorOrdineDetailPage />} />
        {/* Office routes */}
        <Route path="/ordini" element={<OrdiniPage />} />
        <Route path="/ordini/nuovo" element={<OrdineFormPage />} />
        <Route path="/ordini/:id" element={<OrdineDetailPage />} />
        <Route path="/ordini/:id/modifica" element={<OrdineFormPage />} />
        <Route path="/materiali" element={<MaterialiPage />} />
        <Route path="/problemi" element={<ProblemiPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
