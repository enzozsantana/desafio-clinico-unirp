import { Navigate, Route, Routes } from 'react-router-dom';
import { DesafioProvider } from './DesafioContext';
import { EvalPage } from './pages/EvalPage';
import { HistPage } from './pages/HistPage';
import { ResultPage } from './pages/ResultPage';
import { StartPage } from './pages/StartPage';

export function DesafioRoutes() {
  return (
    <DesafioProvider>
      <Routes>
        <Route index element={<StartPage />} />
        <Route path="historico" element={<HistPage />} />
        <Route path="avaliar" element={<EvalPage />} />
        <Route path="resultado/:id" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/desafio" replace />} />
      </Routes>
    </DesafioProvider>
  );
}