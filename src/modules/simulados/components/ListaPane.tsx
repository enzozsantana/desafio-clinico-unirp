import { gabFaltando, score } from '../score';
import { useSimulados } from '../SimuladosContext';
import type { Simulado } from '../types';
import { esc, fmt, uid } from '../utils';

export function ListaPane({ sim }: { sim: Simulado }) {
  const { setAluno, setLancar, runFolhaPDF, runLerFotos, mutateSim } = useSimulados();
  const falta = gabFaltando(sim);
  const al = sim.alunos
    .map((a) => ({ a, s: score(sim, a.resp, a.pts) }))
    .sort((x, y) => x.a.nome.localeCompare(y.a.nome, 'pt-BR'));

  const novaProva = () => {
    const newId = uid('a');
    mutateSim(sim.id, (s) => {
      s.alunos.push({ id: newId, nome: '', resp: '.'.repeat(s.nq) });
    });
    setAluno(newId);
    window.scrollTo(0, 0);
  };

  return (
    <>
      {falta ? (
        <div className="warn" style={{ marginBottom: 12 }}>
          O gabarito ainda tem {falta} {falta === 1 ? 'questão' : 'questões'} sem resposta. Elas não entram na nota até
          serem preenchidas.
        </div>
      ) : null}
      <div className="tools">
        <button type="button" className="btn" onClick={() => void runLerFotos(sim.id)}>
          Ler folhas por foto
        </button>
        <button type="button" className="btn ghost" onClick={novaProva}>
          Corrigir à mão
        </button>
        {(sim.disc || []).length && sim.alunos.length ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setLancar(true);
              window.scrollTo(0, 0);
            }}
          >
            Lançar notas das dissertativas
          </button>
        ) : null}
        <button type="button" className="btn ghost" onClick={() => void runFolhaPDF(sim)}>
          Baixar folha de respostas (PDF)
        </button>
      </div>
      <p className="hint" style={{ margin: '-4px 0 14px' }}>
        Use a folha de respostas gerada pelo sistema: a leitura óptica é feita no próprio aparelho. Uma foto por página,
        com os 4 quadrados pretos aparecendo; dá para escolher várias de uma vez.
      </p>
      {al.length ? (
        <div className="alunos">
          {al.map(({ a, s }) => (
            <button
              key={a.id}
              type="button"
              className="aluno"
              data-al={a.id}
              onClick={() => {
                setAluno(a.id);
                window.scrollTo(0, 0);
              }}
            >
              <span>
                <strong>{esc(a.nome || 'Sem nome')}</strong>
                <br />
                <span className="small muted">
                  {s.ac} de {s.val} acertos
                </span>
                {a.duv?.length ? (
                  <span className="small amber">
                    {' '}
                    · {a.duv.length} para conferir
                  </span>
                ) : null}
                {s.pend ? (
                  <span className="small amber">
                    {' '}
                    · {s.pend} {s.pend === 1 ? 'dissertativa' : 'dissertativas'} sem nota
                  </span>
                ) : null}
              </span>
              <span className="pill">{fmt(s.nota)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card empty muted">
          Nenhuma prova corrigida ainda. Pegue a primeira da pilha e toque em “Corrigir nova prova”.
        </div>
      )}
    </>
  );
}