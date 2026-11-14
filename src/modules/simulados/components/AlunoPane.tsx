import { useEffect, useRef, useState } from 'react';
import { objetivas } from '../omr/core.js';
import {
  aplicaSeq,
  fmtN,
  isDisc,
  numBR,
  peso,
  score,
  seqTxt,
  temPts,
} from '../score';
import { useSimulados } from '../SimuladosContext';
import type { Simulado } from '../types';
import { fmt, uid } from '../utils';
import { Bubbles } from './Bubbles';

function espHTML(sim: Simulado, i: number) {
  const t = sim.esp?.[i];
  if (!t) return null;
  return (
    <details className="esp">
      <summary>Resposta esperada</summary>
      <p>{t}</p>
    </details>
  );
}

export function AlunoPane({ sim, alunoId }: { sim: Simulado; alunoId: string }) {
  const { mutateSim, setAluno, prev } = useSimulados();
  const a = sim.alunos.find((x) => x.id === alunoId);
  const nomeRef = useRef<HTMLInputElement>(null);
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);

  useEffect(() => {
    nomeRef.current?.focus();
  }, [alunoId]);

  useEffect(() => {
    if (!a) setAluno(null);
  }, [a, setAluno]);

  if (!a) return null;

  const pv = prev[a.id];
  const semNome = /\(nome a conferir\)$/.test(a.nome);
  const s = score(sim, a.resp, a.pts);
  const ob = objetivas(sim);
  const marcadas = ob.filter((i) => a.resp[i] && a.resp[i] !== '.').length;

  const drawRows = () => {
    const rows = [];
    for (let i = 0; i < sim.nq; i++) {
      if (isDisc(sim, i)) {
        const w = peso(sim, i);
        const tem = temPts(a.pts, i);
        rows.push(
          <div key={i} className={`q disc${tem ? '' : ' blank'}`} data-row={i}>
            <span className="qn">{i + 1}</span>
            <div>
              <div className="dinput">
                <input
                  type="text"
                  inputMode="decimal"
                  className="pts"
                  data-pq={i}
                  defaultValue={tem ? String(a.pts![i]).replace('.', ',') : ''}
                  placeholder="–"
                  aria-label={`Pontos da questão ${i + 1}`}
                  onChange={(e) => {
                    const v = numBR(e.target.value);
                    mutateSim(sim.id, (sx) => {
                      const al = sx.alunos.find((x) => x.id === alunoId);
                      if (!al) return;
                      al.pts = al.pts || {};
                      if (e.target.value.trim() === '' || v === null) delete al.pts[i];
                      else al.pts[i] = Math.min(w, Math.max(0, v));
                    });
                    e.target.classList.toggle('over', v !== null && v > w);
                    refresh();
                  }}
                />
                <span className="small muted">de {fmtN(w)}</span>
              </div>
              {espHTML(sim, i)}
            </div>
            <span className="mark">{tem ? '' : 'corrigir'}</span>
          </div>,
        );
        continue;
      }
      const g = sim.gab[i];
      const r = a.resp[i];
      const an = sim.anul.includes(i);
      let cls = '';
      let mk = '';
      if (an) {
        cls = 'null';
        mk = 'anulada';
      } else if (!g || g === '.') {
        mk = '';
      } else if (r === '.' || !r) {
        cls = 'blank';
        mk = 'em branco';
      } else if (r === g) {
        cls = 'ok';
        mk = '✓ certa';
      } else {
        cls = 'bad';
        mk = '✗ era ' + g;
      }
      const showKey = cls === 'bad' || cls === 'blank' ? g : null;
      if (a.duv?.includes(i)) {
        cls += ' doubt';
        mk = 'conferir';
      }
      rows.push(
        <div key={i} className={`q ${cls}`}>
          <span className="qn">{i + 1}</span>
          <Bubbles
            sim={sim}
            i={i}
            val={r || '.'}
            keyLetter={showKey}
            onPick={(qi, L) => {
              mutateSim(sim.id, (sx) => {
                const al = sx.alunos.find((x) => x.id === alunoId);
                if (!al) return;
                const arr = al.resp.split('');
                arr[qi] = arr[qi] === L ? '.' : L;
                al.resp = arr.join('');
                if (al.duv) al.duv = al.duv.filter((x) => x !== qi);
              });
              refresh();
            }}
          />
          <span className="mark">{mk}</span>
        </div>,
      );
    }
    return rows;
  };

  const isVazio = (al = a) =>
    !al.nome.trim() && !al.resp.replace(/\./g, '') && !(al.pts && Object.keys(al.pts).length);

  const novaProva = () => {
    const newId = uid('a');
    mutateSim(sim.id, (s) => {
      const al = s.alunos.find((x) => x.id === alunoId);
      if (al && isVazio(al)) s.alunos = s.alunos.filter((x) => x.id !== alunoId);
      s.alunos.push({ id: newId, nome: '', resp: '.'.repeat(s.nq) });
    });
    setAluno(newId);
  };

  const salvar = () => {
    mutateSim(sim.id, (s) => {
      const al = s.alunos.find((x) => x.id === alunoId);
      if (al && isVazio(al)) s.alunos = s.alunos.filter((x) => x.id !== alunoId);
    });
    setAluno(null);
    window.scrollTo(0, 0);
  };

  const excluir = () => {
    if (!isVazio() && !confirm('Excluir esta prova corrigida?')) return;
    mutateSim(sim.id, (s) => {
      s.alunos = s.alunos.filter((x) => x.id !== alunoId);
    });
    setAluno(null);
  };

  return (
    <>
      <button type="button" className="back" onClick={salvar}>
        ‹ Voltar às provas
      </button>
      {a.duv?.length ? (
        <div
          className="warn"
          style={{
            marginBottom: 12,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <span>
            Lida por foto. Confira na folha{' '}
            {a.duv.length === 1 ? 'a questão destacada' : `as ${a.duv.length} questões destacadas`}.
          </span>
          <button
            type="button"
            className="toggle on"
            onClick={() => {
              mutateSim(sim.id, (s) => {
                const al = s.alunos.find((x) => x.id === alunoId);
                if (al) al.duv = [];
              });
              refresh();
            }}
          >
            Tudo conferido
          </button>
        </div>
      ) : null}
      <div className="card stack">
        {pv?.nome ? (
          <div>
            <span className="f">Nome escrito na folha</span>
            <img className="namecrop" src={pv.nome} alt="Recorte do campo Nome da folha fotografada" />
          </div>
        ) : null}
        <div>
          <label className="f" htmlFor="aNome">
            Nome do aluno
          </label>
          <input
            ref={nomeRef}
            type="text"
            id="aNome"
            defaultValue={semNome ? '' : a.nome}
            placeholder={semNome ? a.nome : 'Nome como está na prova'}
            autoComplete="off"
            onChange={(e) => {
              mutateSim(sim.id, (s) => {
                const al = s.alunos.find((x) => x.id === alunoId);
                if (al) al.nome = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="f" htmlFor="aText">
            Respostas das objetivas em sequência (opcional)
          </label>
          <textarea
            id="aText"
            rows={2}
            spellCheck={false}
            autoCapitalize="characters"
            placeholder="Digite as letras marcadas: ABDC-E…"
            defaultValue={seqTxt(sim, a.resp)}
            onChange={(e) => {
              mutateSim(sim.id, (s) => {
                const al = s.alunos.find((x) => x.id === alunoId);
                if (al) al.resp = aplicaSeq(s, al.resp, e.target.value);
              });
              refresh();
            }}
          />
          <p className="hint" style={{ margin: '6px 0 0' }}>
            Ou toque nas bolinhas abaixo. Use - para questão em branco ou rasurada.
          </p>
        </div>
      </div>
      <div className="score">
        <div className="grade">
          {fmt(s.nota)} <small>/ {fmt(sim.max)}</small>
        </div>
        <div className="tally">
          <b>{fmtN(s.pt)}</b> de {fmtN(s.tot)} pontos
          <br />
          {s.ac} de {s.val} objetivas certas ({marcadas} marcadas)
          {s.pend ? (
            <>
              <br />
              <span className="amber">
                {s.pend} {s.pend === 1 ? 'dissertativa' : 'dissertativas'} sem nota
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="sheet">{drawRows()}</div>
      {pv?.paginas.some(Boolean) ? (
        <details className="card" style={{ marginTop: 14 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Ver a folha como foi lida</summary>
          <p className="hint">Azul: marcação lida. Laranja: questão para conferir.</p>
          {pv.paginas.map((u, i) =>
            u ? <img key={i} className="scan" src={u} alt={`Folha fotografada, página ${i + 1}`} /> : null,
          )}
        </details>
      ) : null}
      <div className="actions">
        <button type="button" className="btn" onClick={novaProva}>
          Salvar e corrigir a próxima
        </button>
        <button type="button" className="btn ghost" onClick={salvar}>
          Salvar
        </button>
        <button type="button" className="btn plain" onClick={excluir}>
          Excluir prova
        </button>
      </div>
    </>
  );
}