import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AlunoPane } from '../components/AlunoPane';
import { GabPane } from '../components/GabPane';
import { LancarPane } from '../components/LancarPane';
import { ListaPane } from '../components/ListaPane';
import { ResPane } from '../components/ResPane';
import { useSimulados } from '../SimuladosContext';
import { esc } from '../utils';

export function SimPage() {
  const { id } = useParams<{ id: string }>();
  const { cur, tab, setTab, aluno, setAluno, lancar, setLancar, setOpenQ } = useSimulados();
  const sim = id ? cur(id) : undefined;

  useEffect(() => {
    setOpenQ(null);
  }, [tab, aluno, lancar, setOpenQ]);

  if (!id || !sim) return <Navigate to="/simulados" replace />;

  return (
    <>
      <Link to="/simulados" className="back" onClick={() => { setAluno(null); setLancar(false); }}>
        ‹ Voltar aos simulados
      </Link>
      <h1 className="simtitle">{esc(sim.nome)}</h1>
      <div className="tabs" role="tablist">
        {(
          [
            ['gabarito', 'Gabarito'],
            ['corrigir', 'Corrigir'],
            ['resultados', 'Resultados'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-tab={k}
            onClick={() => {
              setTab(k);
              setAluno(null);
              setLancar(false);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div id="pane">
        {tab === 'gabarito' ? <GabPane sim={sim} /> : null}
        {tab === 'corrigir' ? (
          aluno ? (
            <AlunoPane sim={sim} alunoId={aluno} />
          ) : lancar ? (
            <LancarPane sim={sim} />
          ) : (
            <ListaPane sim={sim} />
          )
        ) : null}
        {tab === 'resultados' ? <ResPane sim={sim} /> : null}
      </div>
    </>
  );
}