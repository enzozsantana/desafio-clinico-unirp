import { useRef } from 'react';
import { fmtN, numBR, peso, score, temPts } from '../score';
import { useSimulados } from '../SimuladosContext';
import type { Simulado } from '../types';
import { esc, fmt } from '../utils';

export function LancarPane({ sim }: { sim: Simulado }) {
  const { setLancar, mutateSim } = useSimulados();
  const d = sim.disc || [];
  const al = sim.alunos.slice().sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  const esp = d.filter((i) => sim.esp?.[i]);
  const inputsRef = useRef<HTMLInputElement[]>([]);

  return (
    <>
      <button type="button" className="back" onClick={() => setLancar(false)}>
        ‹ Voltar às provas
      </button>
      <p className="hint" style={{ marginTop: 0 }}>
        Digite a pontuação de cada dissertativa. Deixe em branco o que ainda não corrigiu. Enter passa para o próximo
        campo.
      </p>
      {esp.length ? (
        <details className="card" style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Respostas esperadas</summary>
          {esp.map((i) => (
            <p key={i} className="small">
              <b>Questão {i + 1}:</b> {esc(sim.esp![i])}
            </p>
          ))}
        </details>
      ) : null}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="lt">
          <thead>
            <tr>
              <th className="ln">Aluno</th>
              {d.map((i) => (
                <th key={i}>
                  Q{i + 1}
                  <br />
                  <span className="small muted">de {fmtN(peso(sim, i))}</span>
                </th>
              ))}
              <th>Nota</th>
            </tr>
          </thead>
          <tbody
            onInput={(e) => {
              const t = (e.target as HTMLElement).closest('[data-pq]') as HTMLInputElement | null;
              if (!t) return;
              const tr = t.closest('tr');
              const a = sim.alunos.find((x) => x.id === tr?.dataset.al);
              const i = +t.dataset.pq!;
              if (!a) return;
              const v = numBR(t.value);
              mutateSim(sim.id, (s) => {
                const aluno = s.alunos.find((x) => x.id === a.id);
                if (!aluno) return;
                aluno.pts = aluno.pts || {};
                if (t.value.trim() === '' || v === null) delete aluno.pts[i];
                else aluno.pts[i] = Math.min(peso(s, i), Math.max(0, v));
              });
              t.classList.toggle('over', v !== null && v > peso(sim, i));
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const k = inputsRef.current.indexOf(e.target as HTMLInputElement);
              if (k >= 0 && inputsRef.current[k + 1]) {
                e.preventDefault();
                inputsRef.current[k + 1]!.focus();
                inputsRef.current[k + 1]!.select();
              }
            }}
          >
            {al.map((a) => {
              const s = score(sim, a.resp, a.pts);
              return (
                <tr key={a.id} data-al={a.id}>
                  <td className="ln">{esc(a.nome || 'Sem nome')}</td>
                  {d.map((i) => (
                    <td key={i}>
                      <input
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="next"
                        data-pq={i}
                        ref={(el) => {
                          if (el) inputsRef.current.push(el);
                        }}
                        defaultValue={temPts(a.pts, i) ? String(a.pts![i]).replace('.', ',') : ''}
                        aria-label={`${a.nome || 'Aluno'}, questão ${i + 1}`}
                      />
                    </td>
                  ))}
                  <td className="nt">
                    <span className="pill">{fmt(s.nota)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}