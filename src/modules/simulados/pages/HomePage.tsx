import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { score } from '../score';
import { openSimTab, useSimulados } from '../SimuladosContext';
import { esc, fmt } from '../utils';

export function HomePage() {
  const { sims, loading, createSim, setTab, setAluno, setLancar } = useSimulados();
  const nav = useNavigate();
  const [nNome, setNNome] = useState('');
  const [nQ, setNQ] = useState('20');
  const [nA, setNA] = useState('5');
  const [nM, setNM] = useState('10');

  if (loading) return <p className="muted">Carregando seus simulados…</p>;

  const list = sims.slice().sort((a, b) => (b.criado || 0) - (a.criado || 0));

  const criar = () => {
    const nq = Math.min(200, Math.max(1, parseInt(nQ, 10) || 20));
    const sim = createSim({
      nome: nNome,
      nq,
      na: parseInt(nA, 10),
      max: Math.max(1, parseFloat(String(nM).replace(',', '.')) || 10),
    });
    setTab('gabarito');
    setAluno(null);
    setLancar(false);
    nav(`/simulados/${sim.id}`);
    window.scrollTo(0, 0);
  };

  const open = (id: string) => {
    const s = sims.find((x) => x.id === id);
    if (!s) return;
    setTab(openSimTab(s));
    setAluno(null);
    setLancar(false);
    nav(`/simulados/${id}`);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <section className="card stack" aria-labelledby="novo">
        <h2 id="novo" style={{ fontSize: '1.15rem' }}>
          Novo simulado
        </h2>
        <div>
          <label className="f" htmlFor="nNome">
            Nome
          </label>
          <input
            type="text"
            id="nNome"
            value={nNome}
            onChange={(e) => setNNome(e.target.value)}
            placeholder="Ex.: Simulado de Fundamentos, turma A"
          />
        </div>
        <div className="row">
          <div>
            <label className="f" htmlFor="nQ">
              Questões
            </label>
            <input
              type="number"
              id="nQ"
              min={1}
              max={200}
              value={nQ}
              onChange={(e) => setNQ(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="f" htmlFor="nA">
              Alternativas
            </label>
            <select id="nA" value={nA} onChange={(e) => setNA(e.target.value)}>
              <option value="4">A a D</option>
              <option value="5">A a E</option>
            </select>
          </div>
          <div>
            <label className="f" htmlFor="nM">
              Nota máxima
            </label>
            <input
              type="number"
              id="nM"
              min={1}
              max={1000}
              value={nM}
              onChange={(e) => setNM(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="actions" style={{ marginTop: 4 }}>
          <button type="button" className="btn" onClick={criar}>
            Criar simulado
          </button>
        </div>
      </section>
      <h2 style={{ fontSize: '1.1rem', margin: '26px 0 10px' }}>Seus simulados</h2>
      {list.length ? (
        <div className="simlist">
          {list.map((s) => {
            const notas = s.alunos.map((a) => score(s, a.resp, a.pts).nota);
            const media = notas.length ? notas.reduce((x, y) => x + y, 0) / notas.length : null;
            return (
              <button key={s.id} type="button" className="simitem" data-open={s.id} onClick={() => open(s.id)}>
                <span>
                  <strong>{esc(s.nome)}</strong>
                  <span className="small muted">
                    {s.nq} questões, {s.alunos.length}{' '}
                    {s.alunos.length === 1 ? 'prova corrigida' : 'provas corrigidas'}
                  </span>
                </span>
                {media !== null ? <span className="pill">{fmt(media)}</span> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card empty muted">Nenhum simulado ainda. Crie o primeiro acima e cadastre o gabarito.</div>
      )}
      <p className="hint" style={{ marginTop: 16 }}>
        Os dados ficam salvos na sua conta de professor e sincronizam entre aparelhos.
      </p>
    </>
  );
}