import type { ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { AppLayout } from './layout/AppLayout';
import { DesafioLayout, desafioChildRoutes } from './modules/desafio/DesafioRoutes';
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

function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { path: 'login', element: <LoginPage /> },
        {
          index: true,
          element: (
            <RequireAuth>
              <HubPage />
            </RequireAuth>
          ),
        },
        {
          path: 'desafio',
          element: (
            <RequireAuth>
              <DesafioLayout />
            </RequireAuth>
          ),
          children: [
            ...desafioChildRoutes,
            { path: '*', element: <Navigate to="/desafio" replace /> },
          ],
        },
        {
          path: 'simulados/*',
          element: (
            <RequireAuth>
              <SimuladosRoutes />
            </RequireAuth>
          ),
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename },
);
