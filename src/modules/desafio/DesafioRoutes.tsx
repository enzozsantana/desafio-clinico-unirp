import { Outlet } from 'react-router-dom';
import { DesafioProvider } from './DesafioContext';
import { EvalPage } from './pages/EvalPage';
import { HistPage } from './pages/HistPage';
import { ResultPage } from './pages/ResultPage';
import { StartPage } from './pages/StartPage';

export function DesafioLayout() {
  return (
    <DesafioProvider>
      <Outlet />
    </DesafioProvider>
  );
}

export const desafioChildRoutes = [
  { index: true, element: <StartPage /> },
  { path: 'historico', element: <HistPage /> },
  { path: 'avaliar', element: <EvalPage /> },
  { path: 'resultado/:id', element: <ResultPage /> },
];
