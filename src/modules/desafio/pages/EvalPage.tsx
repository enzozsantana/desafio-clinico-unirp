import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { fmt, periodoLabel } from '../../../lib/storage';
import { sb } from '../../../lib/supabase';
import { useDesafio } from '../DesafioContext';
import { calc } from '../scoring';
import { BASE, ST, type AnsVal } from '../stations';
import { buildPhases, phaseAt } from '../timer';
import type { AvaliacaoRec, EvalSession } from '../types';

type LocState = { session?: EvalSession };

export function EvalPage() {
  const loc = useLocation();
  const nav = useNavigate();
  const initial = (loc.state as LocState | null)?.session;
  const {
    durMin,
    setDurMin,
    confirm,
    toast,
    prependHist,
    replaceSavedRec,
    setLastRec,
    setEvalActive,
  } = useDesafio();

  const [session, setSession] = useState<EvalSession | null>(initial ?? null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastPh, setLastPh] = useState(-1);
  const tickRef = useRef<number | null>(null);
  const finalizingRef = useRef(false);

  const station = session ? ST[session.st - 1] : undefined;
  const { total, phases } = useMemo(() => buildPhases(durMin), [durMin]);

  const nAns = session ? Object.keys(session.ans).length : 0;
  const notaLive = session ? calc(session.ans) : 0;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !!session &&
      !finalizingRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!initial) {
      toast('Inicie uma nova avaliação');
      nav('/desafio', { replace: true });
    }
  }, [initial, nav, toast]);

  useEffect(() => {
    if (session) setEvalActive(true);
    return () => setEvalActive(false);
  }, [session, setEvalActive]);

  useEffect(() => {
    document.body.classList.add('has-dock', 'has-dock-tall');
    return () => document.body.classList.remove('has-dock', 'has-dock-tall');
  }, []);

  useEffect(() => {
  const fn = (e: BeforeUnloadEvent) => {
      if (session && !finalizingRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [session]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    void (async () => {
      const ok = await confirm('Cancelar esta avaliação? As marcações serão perdidas.', {
        title: 'Sair da avaliação',
        danger: true,
      });
      if (ok) blocker.proceed();
      else blocker.reset();
    })();
  }, [blocker, confirm]);

  const stopTimer = useCallback(() => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setElapsed(0);
    setLastPh(-1);
  }, [stopTimer]);

  useEffect(() => resetTimer(), [durMin, resetTimer]);

  const left = Math.max(0, total - elapsed);
  const { idx: phIdx, phase: ph } = phaseAt(elapsed, phases);
  const timerAlert = running || elapsed > 0 ? !!ph.alert : false;
  const timerOver = left <= 60 && elapsed > 0;

  useEffect(() => {
    if (!running && elapsed === 0) return;
    if (phIdx !== lastPh) {
      if (lastPh !== -1 && navigator.vibrate) {
        navigator.vibrate(ph.alert ? [200, 100, 200] : 120);
      }
      setLastPh(phIdx);
    }
  }, [running, elapsed, phIdx, lastPh, ph.alert]);

  function setAns(k: string, v: AnsVal, firstTime: boolean, el: HTMLElement | null) {
    if (!session) return;
    setSession((s) => (s ? { ...s, ans: { ...s.ans, [k]: v } } : s));
    if (firstTime && el) {
      window.setTimeout(() => {
        const items = document.querySelectorAll<HTMLElement>('.item[data-k]');
        const next = [...items].find((x) => {
          const key = x.dataset.k;
          return key && !session.ans[key] && key !== k;
        });
        next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 180);
    }
  }

  async function finalize(porTempo: boolean) {
    if (!session || !station) return;
    finalizingRef.current = true;
    stopTimer();
    const obs = session.obs.trim();
    const rec: AvaliacaoRec = {
      id: null,
      data: new Date().toISOString(),
      profId: session.profId,
      prof: session.prof,
      nome: session.nome,
      ra: session.ra,
      periodo: session.periodo,
      st: station.n,
      stNome: station.nome,
      ans: { ...session.ans },
      nota: calc(session.ans),
      crit: session.crit,
      obs,
      tempo: elapsed,
      dur: durMin,
      porTempo,
      avaliados: Object.keys(session.ans).length,
    };
    prependHist(rec);
    setLastRec(rec);
    setEvalActive(false);
    nav('/desafio/resultado/rascunho', { state: { rec, fromHist: false }, replace: true });
    if (porTempo) {
      if (navigator.vibrate) navigator.vibrate([300, 120, 300]);
      toast('Tempo esgotado: avaliação encerrada');
    }
    try {
      const payload = {
        professor_id: session.profId,
        aluno_nome: session.nome,
        aluno_ra: session.ra || null,
        periodo: session.periodo,
        estacao: station.n,
        estacao_nome: station.nome,
        respostas: { ...session.ans },
        nota: rec.nota,
        erro_critico: !!session.crit,
        observacoes: obs || null,
        tempo_segundos: elapsed,
        duracao_min: durMin,
        encerrada_por_tempo: !!porTempo,
        criterios_avaliados: rec.avaliados,
      };
      const { data, error } = await sb
        .from('avaliacoes')
        .insert(payload)
        .select('id,created_at')
        .single();
      if (error) throw error;
      if (data) {
        const updated = {
          ...rec,
          id: data.id as string,
          data: (data.created_at as string) || rec.data,
        };
        setLastRec(updated);
        replaceSavedRec(
          (x) => x.id === null && x.data === rec.data && x.nome === rec.nome && x.st === rec.st,
          updated,
        );
        nav(`/desafio/resultado/${data.id}`, { replace: true, state: { fromHist: false } });
      }
      if (!porTempo) toast('Avaliação salva na nuvem');
    } catch (e) {
      console.error(e);
      toast('Salva localmente; falha ao enviar à nuvem');
    }
  }

  async function onFinalizar() {
    if (!session) return;
    const n = Object.keys(session.ans).length;
    if (
      n < 10 &&
      !(await confirm(
        `Encerrar com ${n} de 10 critérios avaliados? Os itens não marcados valem 0.`,
        { title: 'Encerrar avaliação', danger: true },
      ))
    ) {
      return;
    }
    await finalize(false);
  }

  async function onCancelar() {
    if (
      !(await confirm('Cancelar esta avaliação? As marcações serão perdidas.', {
        title: 'Cancelar avaliação',
        danger: true,
      }))
    ) {
      return;
    }
    finalizingRef.current = true;
    stopTimer();
    setEvalActive(false);
    nav('/desafio', { replace: true });
  }

  function toggleTimer() {
    if (running) {
      stopTimer();
      return;
    }
    setRunning(true);
    tickRef.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (next >= total) {
          stopTimer();
          window.setTimeout(() => void finalize(true), 0);
        }
        return Math.min(next, total);
      });
    }, 1000);
  }

  if (!session || !station) return null;

  const tVal = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  const tPhHtml = running || elapsed > 0
    ? { title: ph.t, sub: ph.s }
    : { title: 'Pronto para começar', sub: `${durMin} minutos no total` };

  const btnFinalizeDisabled = nAns === 0 && !running && elapsed === 0;

  return (
    <>
      <section>
        <p className="sub" style={{ marginTop: 14 }}>
          {session.nome}
          {session.ra ? ` · RA ${session.ra}` : ''} · {periodoLabel(session.periodo)} · Prof.{' '}
          {session.prof}
        </p>
        <h1>
          Estação {station.n} · {station.nome}
        </h1>

        <div className="dur">
          <span className="lb">Tempo da estação</span>
          {[10, 15, 20].map((m) => (
            <button
              key={m}
              type="button"
              data-m={m}
              className={durMin === m ? 'on' : ''}
              disabled={running || elapsed > 0}
              onClick={() => setDurMin(m)}
            >
              {m} min
            </button>
          ))}
        </div>

        <div className={`timer${timerAlert ? ' alert' : ''}${timerOver ? ' over' : ''}`}>
          <div className="t">{tVal}</div>
          <div className="ph">
            <strong>{tPhHtml.title}</strong>
            {tPhHtml.sub}
          </div>
          <button
            type="button"
            className="tbtn"
            disabled={elapsed >= total && !running}
            onClick={toggleTimer}
          >
            {running ? 'Pausar' : elapsed > 0 && !running ? 'Retomar' : 'Iniciar'}
          </button>
        </div>

        <details>
          <summary>Caso clínico</summary>
          <div className="in">
            <p>{station.caso}</p>
          </div>
        </details>
        <details>
          <summary>Intercorrência e gabarito</summary>
          <div className="in">
            <p className="sub">Intercorrência</p>
            <p>{station.inter}</p>
            <p className="sub" style={{ color: 'var(--orange)' }}>
              Resposta esperada
            </p>
            <p>{station.gab}</p>
            <p className="sub">Nota docente</p>
            <p>{station.nota}</p>
          </div>
        </details>

        <h2>Critérios</h2>
        <p className="legend">Correto = 1 · Parcial = 0,5 · Incorreto = 0</p>
        <div id="items">
          {BASE.map((b, i) => {
            const v = session.ans[b.k];
            const crit =
              b.k === 'inter'
                ? 'Reconhece o problema, interrompe quando necessário e descreve a conduta segura.'
                : b.d || station.c[b.k];
            return (
              <div
                key={b.k}
                className={`item${v ? ` s-${v} done` : ''}`}
                data-k={b.k}
              >
                <div className="ih">
                  <div className="n">{i + 1}</div>
                  <h3>{b.t}</h3>
                </div>
                <p className="crit">{crit}</p>
                {b.k === 'inter' ? (
                  <div className="gab">
                    <p className="sub">{station.inter}</p>
                    {station.gab}
                  </div>
                ) : null}
                <div className="seg">
                  {(['ok', 'mid', 'bad'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`${opt}${v === opt ? ' on' : ''}`}
                      data-v={opt}
                      onClick={(e) => {
                        const firstTime = !session.ans[b.k];
                        setAns(b.k, opt, firstTime, e.currentTarget.closest('.item'));
                      }}
                    >
                      {opt === 'ok' ? 'Correto' : opt === 'mid' ? 'Parcial' : 'Incorreto'}
                      <span>{opt === 'ok' ? '1' : opt === 'mid' ? '0,5' : '0'}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={session.crit}
            onChange={(e) => setSession((s) => (s ? { ...s, crit: e.target.checked } : s))}
          />
          <div>
            <strong>Erro crítico</strong>
            Registra que houve risco grave ao paciente (não altera a nota automaticamente).
          </div>
        </label>
        <div className="card">
          <label className="f" htmlFor="inObs">
            Observações
          </label>
          <textarea
            id="inObs"
            placeholder="Pontos fortes, falhas, conduta na intercorrência…"
            value={session.obs}
            onChange={(e) => setSession((s) => (s ? { ...s, obs: e.target.value } : s))}
          />
        </div>
      </section>

      <div className="bar">
        <div className="bar-in">
          <div className="score">
            <div className="v">{fmt(notaLive)}</div>
            <div className="l">{nAns} de 10</div>
          </div>
          <div className="prog">
            <i style={{ width: `${nAns * 10}%` } as CSSProperties} />
          </div>
          <button type="button" className="btn" disabled={btnFinalizeDisabled} onClick={() => void onFinalizar()}>
            {nAns < 10 ? 'Encerrar' : 'Finalizar'}
          </button>
        </div>
        <div className="bar-sec">
          <button type="button" className="btn ghost" onClick={() => void onCancelar()}>
            Cancelar avaliação
          </button>
        </div>
      </div>
    </>
  );
}