import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import '../../styles/simulados.css';
import { JobBanner } from './components/JobBanner';
import { HomePage } from './pages/HomePage';
import { SimPage } from './pages/SimPage';
import { SimuladosProvider, useSimulados } from './SimuladosContext';

function SimuladosShell() {
  const { saveStatus } = useSimulados();
  const loc = useLocation();
  const atRoot = loc.pathname.replace(/\/$/, '') === '/simulados';

  return (
    <div className="sim-app">
      <div className="page-head">
        {atRoot ? (
          <Link className="back" to="/">
            ‹ Voltar ao início
          </Link>
        ) : null}
        <div className="page-head-row">
          <div>
            <h1>Correção de simulados</h1>
            <p className="lead">Gabarito, leitura óptica e resultados da turma</p>
          </div>
          <div className="page-head-meta">
            <div className="save" aria-live="polite">
              {saveStatus}
            </div>
          </div>
        </div>
      </div>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path=":id" element={<SimPage />} />
        <Route path="*" element={<Navigate to="/simulados" replace />} />
      </Routes>
      <JobBanner />
    </div>
  );
}

export function SimuladosRoutes() {
  return (
    <SimuladosProvider>
      <SimuladosShell />
    </SimuladosProvider>
  );
}
