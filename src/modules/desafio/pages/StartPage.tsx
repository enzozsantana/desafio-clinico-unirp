import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import { periodoLabel } from '../../../lib/storage';
import { useDesafio } from '../DesafioContext';
import { ST } from '../stations';
import type { EvalSession } from '../types';

function PeriodoSeg({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (p: 'diurno' | 'noturno') => void;
  id: string;
}) {
  return (
    <div className="periodo-seg" id={id} role="group" aria-label="Período do aluno">
      {(['diurno', 'noturno'] as const).map((p) => (
        <button
          key={p}
          type="button"
          data-periodo={p}
          className={value === p ? 'on' : ''}
          onClick={() => onChange(p)}
        >
          {periodoLabel(p)}
        </button>
      ))}
    </div>
  );
}

export function StartPage() {
  const nav = useNavigate();
  const { user, meProf } = useAuth();
  const { used, markUsed, clearUsed, evalActive, toast } = useDesafio();
  const [nome, setNome] = useState('');
  const [ra, setRa] = useState('');
  const [periodo, setPeriodo] = useState<'diurno' | 'noturno' | ''>('');
  const [chosen, setChosen] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [drumSpin, setDrumSpin] = useState(false);
  const [drumNum, setDrumNum] = useState('?');
  const [drumNm, setDrumNm] = useState('Toque em sortear');

  const profNome =
    meProf?.nome_completo ||
    (user?.user_metadata?.nome_completo as string | undefined) ||
    user?.email ||
    'Professor';

  const pick = useCallback((n: number) => {
    setChosen(n);
    const s = ST[n - 1];
    if (s) {
      setDrumNum(String(n));
      setDrumNm(s.nome);
    }
  }, []);

  const canStart = !!(chosen && periodo && nome.trim() && user);

  useEffect(() => {
    document.body.classList.add('has-dock');
    return () => document.body.classList.remove('has-dock');
  }, []);

  function sortear() {
    let pool = ST.map((s) => s.n).filter((n) => !used.includes(n));
    if (!pool.length) {
      clearUsed();
      pool = ST.map((s) => s.n);
    }
    const final = pool[Math.floor(Math.random() * pool.length)]!;
    setDrumSpin(true);
    setSpinning(true);
    let i = 0;
    const steps = 14;
    const iv = window.setInterval(() => {
      setDrumNum(String(1 + Math.floor(Math.random() * 7)));
      setDrumNm('Sorteando…');
      if (++i >= steps) {
        window.clearInterval(iv);
        setDrumSpin(false);
        markUsed(final);
        pick(final);
        setSpinning(false);
        if (navigator.vibrate) navigator.vibrate(40);
      }
    }, 70);
  }

  function iniciar() {
    if (!user) {
      toast('Faça login para avaliar');
      return;
    }
    if (!periodo) {
      toast('Selecione o período (diurno ou noturno)');
      return;
    }
    if (!chosen) return;
    const session: EvalSession = {
      profId: user.id,
      prof: profNome,
      nome: nome.trim(),
      ra: ra.trim(),
      periodo,
      st: chosen,
      ans: {},
      notaCaderno: '',
      crit: false,
      obs: '',
    };
    nav('/desafio/avaliar', { state: { session } });
  }

  return (
  <>
      <section>
        <h1>Nova avaliação</h1>
        <p className="lead">Informe o aluno e a estação para avaliar.</p>
        <div className="card">
          <label className="f" htmlFor="inNome">
            Nome do aluno
          </label>
          <input
            id="inNome"
            autoComplete="off"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <div style={{ height: 12 }} />
          <label className="f" htmlFor="inRA">
            RA (opcional)
          </label>
          <input
            id="inRA"
            autoComplete="off"
            inputMode="numeric"
            placeholder="RA"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
          />
          <div style={{ height: 12 }} />
          <label className="f">Período</label>
          <PeriodoSeg
            id="periodoSeg"
            value={periodo}
            onChange={(p) => setPeriodo(p)}
          />
        </div>

        <div className="card">
          <label className="f">Estação</label>
          <div className={`drum${drumSpin ? ' spin' : ''}`}>
            <div className="num">{drumNum}</div>
            <div className="nm">{drumNm}</div>
          </div>
          <button
            type="button"
            className="btn teal"
            disabled={spinning}
            onClick={sortear}
          >
            Sortear estação
          </button>
          <p className="legend" style={{ marginTop: 10 }}>
            O sorteio não repete estações até todas as 7 saírem.
          </p>
          <div className="pool">
            {ST.map((s) => (
              <span key={s.n} className={`chip${used.includes(s.n) ? ' used' : ''}`}>
                E{s.n}
              </span>
            ))}
          </div>
          <details style={{ marginTop: 14 }}>
            <summary>Escolher manualmente</summary>
            <div className="in">
              <div className="stations">
                {ST.map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    className={`st${chosen === s.n ? ' sel' : ''}`}
                    onClick={() => pick(s.n)}
                  >
                    <b>{s.n}</b>
                    <span>{s.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          </details>
        </div>
      </section>

      <div className="dock">
        <div className="dock-in cols-2">
          <Link className="btn ghost" to="/" onClick={(e) => evalActive && e.preventDefault()}>
            Voltar ao início
          </Link>
          <button type="button" className="btn" disabled={!canStart} onClick={iniciar}>
            Iniciar avaliação
          </button>
        </div>
      </div>
    </>
  );
}