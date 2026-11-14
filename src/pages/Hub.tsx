import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { firstName, fmt, periodoLabel } from '../lib/storage';
import { sb } from '../lib/supabase';
import { mapAvaliacao, type AvaliacaoRec } from '../modules/desafio/types';

export function HubPage() {
  const { meProf, user } = useAuth();
  const nav = useNavigate();
  const [hist, setHist] = useState<AvaliacaoRec[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await sb
        .from('avaliacoes')
        .select('*,professores(nome_completo)')
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false });
      setHist(
        (data || []).map((row) => mapAvaliacao(row as Parameters<typeof mapAvaliacao>[0])),
      );
    })();
  }, [user]);

  const n = hist.length;
  const media = n ? hist.reduce((a, r) => a + Number(r.nota || 0), 0) / n : null;
  const crit = hist.filter((r) => r.crit).length;
  const recent = hist.slice(0, 5);

  return (
    <section>
      <div className="page-head">
        <h1>Olá, {firstName(meProf?.nome_completo || 'professor')}</h1>
        <p className="lead">Sistema de Avaliações UNIRP · área do professor</p>
      </div>
      <div className="stats" aria-live="polite">
        <div className="stat"><div className="v">{n}</div><div className="l">Avaliações</div></div>
        <div className="stat"><div className="v">{media !== null ? fmt(media) : '—'}</div><div className="l">Média</div></div>
        <div className="stat"><div className="v">{crit}</div><div className="l">Erro crítico</div></div>
      </div>
      <div className="sec-head"><h2>Módulos</h2></div>
      <div className="mod-grid">
        <article className="mod active">
          <span className="tag">Ativo</span>
          <h3>Desafio Clínico</h3>
          <p>OSCE de enfermagem com 7 estações, sorteio e checklist padronizado.</p>
          <Link className="btn teal" to="/desafio">Nova avaliação</Link>
        </article>
        <article className="mod active">
          <span className="tag">Ativo</span>
          <h3>Correção de Simulados</h3>
          <p>Provas objetivas com gabarito, leitura óptica da folha padronizada e resultados da turma.</p>
          <Link className="btn teal" to="/simulados">Abrir módulo</Link>
        </article>
      </div>
      <div className="sec-head">
        <h2>Recentes</h2>
        <Link className="link" to="/desafio/historico">Ver tudo</Link>
      </div>
      <div className="card recent">
        {!recent.length ? (
          <div className="empty">Nenhuma avaliação ainda. Inicie pelo módulo Desafio Clínico.</div>
        ) : (
          recent.map((r) => (
            <button
              key={r.id}
              type="button"
              className="h"
              onClick={() => nav(`/desafio/resultado/${r.id}`, { state: { fromHist: true } })}
            >
              <div>
                <strong>{r.nome}</strong>
                <small>
                  {periodoLabel(r.periodo)} · Estação {r.st} ·{' '}
                  {new Date(r.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {r.crit ? <> <span className="badge">Crítico</span></> : null}
                </small>
              </div>
              <span className="g">{fmt(r.nota)}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
