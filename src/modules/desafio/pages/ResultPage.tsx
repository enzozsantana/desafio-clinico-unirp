import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import { fmt, periodoLabel } from '../../../lib/storage';
import { sb } from '../../../lib/supabase';
import { useDesafio } from '../DesafioContext';
import { calc, calcFinal, isNotaCadernoValida, parseNotaCaderno } from '../scoring';
import { BASE, lbl, type AnsVal } from '../stations';
import {
  canManageRec,
  type AvaliacaoRec,
  type EditDraft,
  recText,
} from '../types';

type LocState = { rec?: AvaliacaoRec; fromHist?: boolean; openEdit?: boolean };

function PeriodoSeg({
  value,
  onChange,
}: {
  value: string;
  onChange: (p: 'diurno' | 'noturno') => void;
}) {
  return (
    <div className="periodo-seg" role="group" aria-label="Período do aluno">
      {(['diurno', 'noturno'] as const).map((p) => (
        <button
          key={p}
          type="button"
          className={value === p ? 'on' : ''}
          onClick={() => onChange(p)}
        >
          {periodoLabel(p)}
        </button>
      ))}
    </div>
  );
}

async function copyTxt(txt: string, toast: (m: string) => void) {
  try {
    await navigator.clipboard.writeText(txt);
    toast('Copiado');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('Copiado');
    } catch {
      toast('Não foi possível copiar');
    }
    ta.remove();
  }
}

export function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const loc = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();
  const {
    hist,
    lastRec,
    setLastRec,
    toast,
    confirm,
    replaceSavedRec,
    removeHistById,
  } = useDesafio();
  const locState = loc.state as LocState | null;
  const fromHist = !!locState?.fromHist;

  const rec = useMemo(() => {
    if (id && id !== 'rascunho') {
      const found = hist.find((h) => h.id === id);
      if (found) return found;
    }
    if (locState?.rec) return locState.rec;
    if (lastRec && (lastRec.id === id || id === 'rascunho')) return lastRec;
    return null;
  }, [hist, id, lastRec, locState?.rec]);

  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const manage = canManageRec(rec, user?.id);

  useEffect(() => {
    document.body.classList.add('has-dock', 'has-dock-tall');
    return () => document.body.classList.remove('has-dock', 'has-dock-tall');
  }, []);

  useEffect(() => {
    if (!rec && id && id !== 'rascunho') {
      toast('Avaliação não encontrada');
      nav('/desafio/historico', { replace: true });
    }
  }, [rec, id, nav, toast]);

  useEffect(() => {
    if (locState?.openEdit && rec && manage && !editMode) {
      setEditDraft({
        nome: rec.nome,
        ra: rec.ra,
        periodo: rec.periodo,
        crit: !!rec.crit,
        obs: rec.obs,
        ans: { ...(rec.ans || {}) },
        notaCaderno: rec.notaCaderno != null ? String(rec.notaCaderno) : '',
      });
      setEditMode(true);
    }
  }, [locState?.openEdit, rec, manage, editMode]);

  if (!rec) return null;

  const notaColor =
    rec.nota >= 7 ? 'var(--ok)' : rec.nota >= 5 ? 'var(--mid)' : 'var(--bad)';
  const n = rec.avaliados ?? Object.keys(rec.ans || {}).length;
  const obsTxt = (rec.obs ?? '').trim();

  function startEdit() {
    if (!manage) {
      toast('Só é possível editar suas próprias avaliações');
      return;
    }
    setEditDraft({
      nome: rec!.nome,
      ra: rec!.ra,
      periodo: rec!.periodo,
      crit: !!rec!.crit,
      obs: rec!.obs,
      ans: { ...(rec!.ans || {}) },
      notaCaderno: rec!.notaCaderno != null ? String(rec!.notaCaderno) : '',
    });
    setEditMode(true);
  }

  async function saveEdit() {
    if (!rec || !editDraft || !manage) return;
    const nome = editDraft.nome.trim();
    if (!nome) {
      toast('Informe o nome do aluno');
      return;
    }
    if (editDraft.periodo !== 'diurno' && editDraft.periodo !== 'noturno') {
      toast('Selecione o período');
      return;
    }
    const caderno = parseNotaCaderno(editDraft.notaCaderno);
    if (!isNotaCadernoValida(caderno)) {
      toast('Informe a nota do caderno (0 a 10)');
      return;
    }
    const ans = { ...editDraft.ans };
    const notaPratica = calc(ans);
    const nota = calcFinal(notaPratica, caderno);
    const avaliados = Object.keys(ans).length;
    setBusy(true);
    try {
      const { error } = await sb
        .from('avaliacoes')
        .update({
          aluno_nome: nome,
          aluno_ra: editDraft.ra.trim() || null,
          periodo: editDraft.periodo,
          respostas: ans,
          nota,
          nota_caderno: caderno,
          erro_critico: editDraft.crit,
          observacoes: editDraft.obs.trim() || null,
          criterios_avaliados: avaliados,
        })
        .eq('id', rec.id);
      if (error) throw error;
      const updated: AvaliacaoRec = {
        ...rec,
        nome,
        ra: editDraft.ra.trim(),
        periodo: editDraft.periodo,
        ans,
        nota,
        notaPratica,
        notaCaderno: caderno,
        crit: editDraft.crit,
        obs: editDraft.obs.trim(),
        avaliados,
      };
      replaceSavedRec((x) => x.id === rec.id, updated);
      setLastRec(updated);
      toast('Avaliação atualizada');
      setEditMode(false);
      setEditDraft(null);
    } catch (e) {
      console.error(e);
      toast(e instanceof Error ? e.message : 'Não foi possível salvar');
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrent() {
    if (!rec || !manage) {
      toast('Só é possível excluir suas próprias avaliações');
      return;
    }
    if (
      !(await confirm(`Excluir a avaliação de ${rec.nome}? Esta ação não pode ser desfeita.`, {
        title: 'Excluir avaliação',
        danger: true,
      }))
    ) {
      return;
    }
    try {
      const { error } = await sb.from('avaliacoes').delete().eq('id', rec.id);
      if (error) throw error;
      if (rec.id) removeHistById(rec.id);
      setLastRec(null);
      toast('Avaliação excluída');
      nav(fromHist ? '/desafio/historico' : '/desafio', { replace: true });
    } catch (e) {
      console.error(e);
      toast(e instanceof Error ? e.message : 'Não foi possível excluir');
    }
  }

  const editPratica = editDraft ? calc(editDraft.ans) : 0;
  const editCaderno = editDraft ? parseNotaCaderno(editDraft.notaCaderno) : null;
  const editNotaLive = isNotaCadernoValida(editCaderno)
    ? fmt(calcFinal(editPratica, editCaderno))
    : fmt(editPratica);

  return (
    <>
      <section>
        {!editMode ? (
          <div id="rView">
            <div className="card big">
              <div className="nota" style={{ color: notaColor }}>
                {fmt(rec.nota)}
              </div>
              <div className="de">nota final · de 10</div>
              <div className="st2" style={{ marginTop: 8 }}>
                Prática {fmt(rec.notaPratica)}
                {rec.notaCaderno != null ? ` · Caderno ${fmt(rec.notaCaderno)}` : ''}
              </div>
              <div className="who">
                {rec.nome}
                {rec.ra ? ` · RA ${rec.ra}` : ''}
              </div>
              <div className="st2">Período: {periodoLabel(rec.periodo)}</div>
              <div className="st2">
                Estação {rec.st} · {rec.stNome} ·{' '}
                {new Date(rec.data).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </div>
              {rec.prof ? <div className="st2">Avaliador: {rec.prof}</div> : null}
              <div>
                {rec.crit ? <span className="flag">Erro crítico registrado</span> : null}{' '}
                {rec.porTempo ? (
                  <span className="flag time">
                    Encerrada por tempo · {n} de 10 avaliados
                  </span>
                ) : n < 10 ? (
                  <span className="flag time">{n} de 10 avaliados</span>
                ) : null}
              </div>
            </div>
            <div className="card">
              <div className="res">
                {BASE.map((b, i) => {
                  const v = rec.ans[b.k];
                  return (
                    <div key={b.k} className="r">
                      <b>{i + 1}</b>
                      <span>{b.t}</span>
                      <em className={`pill ${v || 'na'}`} style={{ fontStyle: 'normal' }}>
                        {lbl(v as AnsVal | undefined)}
                      </em>
                    </div>
                  );
                })}
              </div>
            </div>
            {obsTxt ? (
              <div className="card">
                <p className="sub">Observações</p>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>{obsTxt}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div id="rEdit">
            <div className="page-head">
              <h1>Editar avaliação</h1>
              <p className="lead">
                Estação {rec.st} · {rec.stNome}
              </p>
            </div>
            <div className="card">
              <label className="f" htmlFor="editNome">
                Nome do aluno
              </label>
              <input
                id="editNome"
                autoComplete="off"
                value={editDraft?.nome ?? ''}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, nome: e.target.value } : d))
                }
              />
              <div style={{ height: 12 }} />
              <label className="f" htmlFor="editRA">
                RA (opcional)
              </label>
              <input
                id="editRA"
                autoComplete="off"
                inputMode="numeric"
                value={editDraft?.ra ?? ''}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, ra: e.target.value } : d))
                }
              />
              <div style={{ height: 12 }} />
              <label className="f">Período</label>
              <PeriodoSeg
                value={editDraft?.periodo ?? ''}
                onChange={(p) =>
                  setEditDraft((d) => (d ? { ...d, periodo: p } : d))
                }
              />
            </div>
            <div className="card">
              <p className="sub" style={{ marginBottom: 10 }}>
                Critérios · prática <strong>{fmt(editPratica)}</strong>
                {isNotaCadernoValida(editCaderno)
                  ? ` · final ${editNotaLive}`
                  : null}
              </p>
              <div className="edit-crit">
                {BASE.map((b, i) => {
                  const v = editDraft?.ans[b.k] || '';
                  return (
                    <div key={b.k} className="ec" data-k={b.k}>
                      <div className="et">
                        {i + 1}. {b.t}
                      </div>
                      <div className="seg">
                        {(['ok', 'mid', 'bad'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`${v === opt ? `on ${opt}` : ''}`}
                            onClick={() => {
                              setEditDraft((d) =>
                                d
                                  ? { ...d, ans: { ...d.ans, [b.k]: opt } }
                                  : d,
                              );
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
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!editDraft?.crit}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, crit: e.target.checked } : d))
                }
              />
              <div>
                <strong>Erro crítico</strong>
                Risco grave ao paciente (não altera a nota automaticamente).
              </div>
            </label>
            <div className="card">
              <label className="f" htmlFor="editCaderno">
                Nota do caderno
              </label>
              <input
                id="editCaderno"
                type="number"
                inputMode="decimal"
                min={0}
                max={10}
                step={0.5}
                placeholder="0 a 10"
                value={editDraft?.notaCaderno ?? ''}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, notaCaderno: e.target.value } : d))
                }
              />
              <p className="legend" style={{ marginTop: 8 }}>
                Nota final = (prática + caderno) ÷ 2
              </p>
            </div>
            <div className="card">
              <label className="f" htmlFor="editObs">
                Observações
              </label>
              <textarea
                id="editObs"
                placeholder="Observações…"
                value={editDraft?.obs ?? ''}
                onChange={(e) =>
                  setEditDraft((d) => (d ? { ...d, obs: e.target.value } : d))
                }
              />
            </div>
          </div>
        )}
      </section>

      {!editMode ? (
        <div className="dock">
          <div className="dock-in cols-2">
            <button
              type="button"
              className="btn teal"
              onClick={() => void copyTxt(recText(rec), toast)}
            >
              Copiar resultado
            </button>
            <Link className="btn" to="/desafio">
              Avaliar próximo
            </Link>
            {manage ? (
              <>
                <button type="button" className="btn ghost" onClick={startEdit}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ color: 'var(--bad)' }}
                  onClick={() => void deleteCurrent()}
                >
                  Excluir
                </button>
              </>
            ) : null}
            {fromHist ? (
              <Link className="btn ghost" to="/desafio/historico" style={{ gridColumn: '1/-1' }}>
                Voltar ao histórico
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="dock">
          <div className="dock-in">
            <button
              type="button"
              className="btn teal"
              disabled={busy}
              onClick={() => void saveEdit()}
            >
              Salvar alterações
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditMode(false);
                setEditDraft(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}