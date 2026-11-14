import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { AppLayout } from './layout/AppLayout';
import { DesafioRoutes } from './modules/desafio/DesafioRoutes';
import { SimuladosRoutes } from './modules/simulados/SimuladosRoutes';
import { HubPage } from './pages/Hub';
import { LoginPage } from './pages/Login';
import { ThemeProvider } from './theme/ThemeProvider';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="empty">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <HubPage />
                </RequireAuth>
              }
            />
            <Route
              path="/desafio/*"
              element={
                <RequireAuth>
                  <DesafioRoutes />
                </RequireAuth>
              }
            />
            <Route
              path="/simulados/*"
              element={
                <RequireAuth>
                  <SimuladosRoutes />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </ThemeProvider>
  );
}
