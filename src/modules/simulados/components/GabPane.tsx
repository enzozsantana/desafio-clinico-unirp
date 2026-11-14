import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  aplicaSeq,
  fmtN,
  gabFaltando,
  isDisc,
  numBR,
  pad,
  parseFaixas,
  peso,
  resumoEstrutura,
  seqTxt,
} from '../score';
import { useSimulados } from '../SimuladosContext';
import type { Simulado } from '../types';
import { LETTERS } from '../utils';
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

export function GabPane({ sim }: { sim: Simulado }) {
  const { mutateSim, removeSim, runFolhaPDF } = useSimulados();
  const nav = useNavigate();
  const [, tick] = useState(0);
  const bump = () => tick((n) => n + 1);
  const falta = gabFaltando(sim);

  const gabRows = () => {
    const rows = [];
    for (let i = 0; i < sim.nq; i++) {
      const an = sim.anul.includes(i);
      if (isDisc(sim, i)) {
        rows.push(
          <div key={i} className="q disc">
            <span className="qn">{i + 1}</span>
            <div>
              <span className="small muted">
                Dissertativa, vale {fmtN(peso(sim, i))} {peso(sim, i) === 1 ? 'ponto' : 'pontos'}
              </span>
              {espHTML(sim, i)}
            </div>
            <span />
          </div>,
        );
        continue;
      }
      rows.push(
        <div key={i} className={`q${an ? ' null' : ''}`}>
          <span className="qn">{i + 1}</span>
          <Bubbles
            sim={sim}
            i={i}
            val={sim.gab[i] || '.'}
            keyLetter={null}
            onPick={(qi, L) => {
              mutateSim(sim.id, (s) => {
                const arr = s.gab.split('');
                arr[qi] = arr[qi] === L ? '.' : L;
                s.gab = arr.join('');
              });
              bump();
            }}
          />
          <button
            type="button"
            className={`toggle${an ? ' on' : ''}`}
            data-anul={i}
            aria-pressed={an}
            onClick={() => {
              mutateSim(sim.id, (s) => {
                s.anul = s.anul.includes(i) ? s.anul.filter((x) => x !== i) : s.anul.concat(i);
              });
              bump();
            }}
          >
            {an ? 'Anulada' : 'Anular'}
          </button>
        </div>,
      );
    }
    return rows;
  };

  const [bQ, setBQ] = useState('');
  const [bT, setBT] = useState('');
  const [bP, setBP] = useState('');
  const [bMsg, setBMsg] = useState('');

  const applyBatch = () => {
    const idx = parseFaixas(bQ, sim.nq);
    const tipo = bT;
    const pt = bP.trim();
    if (!idx?.length) {
      setBMsg('Informe as questões, ex.: 17-20 ou 1-16, 18.');
      return;
    }
    const w = pt ? numBR(pt) : null;
    if (pt && (w === null || w < 0)) {
      setBMsg('Peso inválido.');
      return;
    }
    if (!tipo && !pt) {
      setBMsg('Escolha o tipo ou informe o peso.');
      return;
    }
    mutateSim(sim.id, (s) => {
      if (!s.peso) s.peso = [];
      if (!s.disc) s.disc = [];
      for (const i of idx) {
        if (pt) s.peso[i] = w;
        if (tipo === 'd' && !s.disc.includes(i)) {
          s.disc.push(i);
          s.gab = s.gab.slice(0, i) + '.' + s.gab.slice(i + 1);
          s.anul = s.anul.filter((x) => x !== i);
          s.alunos.forEach((a) => {
            a.resp = a.resp.slice(0, i) + '.' + a.resp.slice(i + 1);
            if (a.duv) a.duv = a.duv.filter((x) => x !== i);
          });
        }
        if (tipo === 'o' && s.disc.includes(i)) {
          s.disc = s.disc.filter((x) => x !== i);
          s.alunos.forEach((a) => {
            if (a.pts) delete a.pts[i];
          });
        }
      }
      s.disc.sort((a, b) => a - b);
    });
    setBMsg('');
    bump();
  };

  const [eNome, setENome] = useState(sim.nome);
  const [eQ, setEQ] = useState(String(sim.nq));
  const [eA, setEA] = useState(String(sim.na));
  const [eM, setEM] = useState(String(sim.max));

  const applyEdit = () => {
    const nq = Math.min(200, Math.max(1, parseInt(eQ, 10) || sim.nq));
    mutateSim(sim.id, (s) => {
      s.nome = eNome.trim() || s.nome;
      s.na = parseInt(eA, 10);
      s.max = Math.max(1, parseFloat(String(eM).replace(',', '.')) || s.max);
      s.nq = nq;
      s.gab = pad(s.gab, nq);
      s.anul = s.anul.filter((i) => i < nq);
      if (s.disc) s.disc = s.disc.filter((i) => i < nq);
      if (s.peso) s.peso = s.peso.slice(0, nq);
      const okL = LETTERS.slice(0, s.na);
      s.gab = s.gab
        .split('')
        .map((c) => (okL.includes(c) ? c : '.'))
        .join('');
      s.alunos.forEach((a) => {
        a.resp = pad(a.resp, nq)
          .split('')
          .map((c) => (okL.includes(c) ? c : '.'))
          .join('');
      });
    });
    bump();
  };

  const delSim = async () => {
    if (!confirm(`Excluir “${sim.nome}” e todas as provas corrigidas?`)) return;
    await removeSim(sim.id);
    nav('/simulados');
  };

  return (
    <>
      <div className="tools">
        <button type="button" className="btn ghost" onClick={() => void runFolhaPDF(sim)}>
          Baixar folha de respostas (PDF)
        </button>
      </div>
      <section className="card stack" style={{ marginBottom: 14 }} aria-labelledby="estrT">
        <h2 id="estrT" style={{ fontSize: '1.05rem' }}>
          Estrutura e pesos
        </h2>
        <p className="small" style={{ margin: 0 }}>
          {resumoEstrutura(sim)}
        </p>
        <div className="row">
          <div>
            <label className="f" htmlFor="bQ">
              Questões
            </label>
            <input
              type="text"
              id="bQ"
              value={bQ}
              onChange={(e) => setBQ(e.target.value)}
              placeholder="Ex.: 17-20"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="f" htmlFor="bT">
              Tipo
            </label>
            <select id="bT" value={bT} onChange={(e) => setBT(e.target.value)}>
              <option value="">Manter</option>
              <option value="o">Objetiva</option>
              <option value="d">Dissertativa</option>
            </select>
          </div>
          <div>
            <label className="f" htmlFor="bP">
              Peso (pontos)
            </label>
            <input
              type="text"
              id="bP"
              value={bP}
              onChange={(e) => setBP(e.target.value)}
              inputMode="decimal"
              placeholder="Manter"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn ghost" onClick={applyBatch}>
            Aplicar
          </button>
          <span className="small muted" aria-live="polite" style={{ alignSelf: 'center' }}>
            {bMsg}
          </span>
        </div>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Peso de cada questão</summary>
          <div className="pgrid">
            {Array.from({ length: sim.nq }, (_, i) => {
              const d = isDisc(sim, i);
              const p = sim.peso?.[i];
              return (
                <label key={i} className={`pcell${d ? ' d' : ''}`}>
                  <span>
                    {i + 1}
                    {d ? (
                      <>
                        {' '}
                        <b>D</b>
                      </>
                    ) : (
                      ''
                    )}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    data-pw={i}
                    value={p === undefined || p === null || p === '' ? '' : String(p).replace('.', ',')}
                    placeholder="1"
                    aria-label={`Peso da questão ${i + 1}`}
                    onChange={(e) => {
                      const v = numBR(e.target.value);
                      mutateSim(sim.id, (s) => {
                        if (!s.peso) s.peso = [];
                        s.peso[i] = e.target.value.trim() === '' || v === null ? null : Math.max(0, v);
                      });
                      bump();
                    }}
                  />
                </label>
              );
            })}
          </div>
        </details>
      </section>
      <p className="hint">
        Toque na alternativa certa de cada questão objetiva. Uma questão anulada conta como acerto para todos. As
        dissertativas são corrigidas por você e a pontuação é lançada em &quot;Corrigir&quot;.
      </p>
      <div className="card" style={{ margin: '12px 0' }}>
        <label className="f" htmlFor="gText">
          Ou digite o gabarito das objetivas em sequência
        </label>
        <textarea
          id="gText"
          rows={2}
          spellCheck={false}
          autoCapitalize="characters"
          placeholder="ABDCE BACDA…"
          value={seqTxt(sim, sim.gab)}
          onChange={(e) => {
            mutateSim(sim.id, (s) => {
              s.gab = aplicaSeq(s, s.gab, e.target.value);
            });
            bump();
          }}
        />
        <p className="hint" style={{ margin: '6px 0 0' }}>
          Espaços são ignorados. Use - para pular uma questão.
        </p>
      </div>
      {falta ? (
        <div className="warn">
          Faltam {falta} {falta === 1 ? 'questão' : 'questões'} no gabarito.
        </div>
      ) : null}
      <div className="sheet" style={{ marginTop: 12 }}>
        {gabRows()}
      </div>
      <details className="card" style={{ marginTop: 18 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Ajustes do simulado</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <div>
            <label className="f" htmlFor="eNome">
              Nome
            </label>
            <input type="text" id="eNome" value={eNome} onChange={(e) => setENome(e.target.value)} />
          </div>
          <div className="row">
            <div>
              <label className="f" htmlFor="eQ">
                Questões
              </label>
              <input type="number" id="eQ" min={1} max={200} value={eQ} onChange={(e) => setEQ(e.target.value)} />
            </div>
            <div>
              <label className="f" htmlFor="eA">
                Alternativas
              </label>
              <select id="eA" value={eA} onChange={(e) => setEA(e.target.value)}>
                <option value="4">A a D</option>
                <option value="5">A a E</option>
              </select>
            </div>
            <div>
              <label className="f" htmlFor="eM">
                Nota máxima
              </label>
              <input type="number" id="eM" min={1} value={eM} onChange={(e) => setEM(e.target.value)} />
            </div>
          </div>
          <div className="actions">
            <button type="button" className="btn danger" onClick={() => void delSim()}>
              Excluir simulado
            </button>
            <button type="button" className="btn ghost" onClick={applyEdit}>
              Aplicar ajustes
            </button>
          </div>
        </div>
      </details>
    </>
  );
}