import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../auth/AuthProvider';
import { fmt, periodoLabel } from '../../../lib/storage';
import { sb } from '../../../lib/supabase';
import { useDesafio } from '../DesafioContext';
import { HIST_PER_PAGE, canManageRec, histFiltrado, tabelaRows, type HistFilters } from '../types';

export function HistPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const {
    hist,
    fetchHist,
    clearUsed,
    toast,
    confirm,
    removeHistById,
    evalActive,
  } = useDesafio();
  const [filtro, setFiltro] = useState<HistFilters>({
    q: '',
    st: '',
    crit: '',
    periodo: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchHist();
      setLoading(false);
    })();
  }, [fetchHist]);

  const list = useMemo(() => histFiltrado(hist, filtro), [hist, filtro]);
  const pages = Math.max(1, Math.ceil(list.length / HIST_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * HIST_PER_PAGE;
  const pageItems = list.slice(start, start + HIST_PER_PAGE);
  const filtered = !!(filtro.q.trim() || filtro.st || filtro.crit || filtro.periodo);

  useEffect(() => {
    setPage(1);
  }, [filtro.q, filtro.st, filtro.crit, filtro.periodo]);

  const lead = hist.length
    ? `${hist.length} ${hist.length === 1 ? 'avaliação sua' : 'avaliações suas'} · mais recentes primeiro${filtered ? ` · ${list.length} no filtro` : ''}.`
    : 'Você ainda não tem avaliações salvas.';

  function openRec(idx: number) {
    const r = list[idx];
    if (!r?.id) return;
    nav(`/desafio/resultado/${r.id}`, { state: { fromHist: true } });
  }

  async function onDelete(idx: number) {
    const r = list[idx];
    if (!r?.id || !canManageRec(r, user?.id)) {
      toast('Só é possível excluir suas próprias avaliações');
      return;
    }
    if (
      !(await confirm(`Excluir a avaliação de ${r.nome}? Esta ação não pode ser desfeita.`, {
        title: 'Excluir avaliação',
        danger: true,
      }))
    ) {
      return;
    }
    try {
      const { error } = await sb.from('avaliacoes').delete().eq('id', r.id);
      if (error) throw error;
      removeHistById(r.id);
      toast('Avaliação excluída');
    } catch (e) {
      console.error(e);
      toast(e instanceof Error ? e.message : 'Não foi possível excluir');
    }
  }

  async function onClearCache() {
    if (
      !(await confirm(
        'Reiniciar apenas o sorteio local deste aparelho? As avaliações na nuvem não serão apagadas.',
        { title: 'Reiniciar sorteio', danger: true },
      ))
    ) {
      return;
    }
    clearUsed();
    toast('Sorteio reiniciado');
  }

  function buildXlsxBlob(): Blob {
    const rows = tabelaRows(hist, filtro);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colCount = rows[0]?.length || 0;
    ws['!cols'] = Array.from({ length: colCount }, (_, i) => {
      if (i === colCount - 1) return { wch: 40 };
      if (i >= 6 && i <= 15) return { wch: 18 };
      return { wch: 16 };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  async function onDownload() {
    if (!hist.length) {
      toast('Histórico vazio');
      return;
    }
    if (!list.length) {
      toast('Nenhum resultado para o filtro');
      return;
    }
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `Sistema_Avaliacoes_UNIRP_notas_${hoje}.xlsx`;
    try {
      const blob = buildXlsxBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('Planilha .xlsx baixada');
    } catch (e) {
      console.error(e);
      toast('Não foi possível gerar o arquivo .xlsx');
    }
  }

  return (
    <>
      <section>
        <div className="page-head">
          <Link
            className="back"
            to="/"
            onClick={(e) => {
              if (evalActive) {
                e.preventDefault();
                toast('Finalize ou cancele a avaliação primeiro');
              }
            }}
          >
            ‹ Voltar ao início
          </Link>
          <h1>Histórico</h1>
          <p className="lead">{lead}</p>
        </div>
        <div className="card filters">
          <label className="f" htmlFor="inFiltro">
            Buscar aluno ou RA
          </label>
          <input
            id="inFiltro"
            autoComplete="off"
            placeholder="Nome ou RA"
            value={filtro.q}
            onChange={(e) => setFiltro((f) => ({ ...f, q: e.target.value }))}
          />
          <div className="row">
            <div>
              <label className="f" htmlFor="inFiltroSt">
                Estação
              </label>
              <select
                id="inFiltroSt"
                value={filtro.st}
                onChange={(e) => setFiltro((f) => ({ ...f, st: e.target.value }))}
              >
                <option value="">Todas</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={String(n)}>
                    E{n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="f" htmlFor="inFiltroCrit">
                Erro crítico
              </label>
              <select
                id="inFiltroCrit"
                value={filtro.crit}
                onChange={(e) => setFiltro((f) => ({ ...f, crit: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="1">Sim</option>
                <option value="0">Não</option>
              </select>
            </div>
          </div>
          <div style={{ height: 12 }} />
          <label className="f" htmlFor="inFiltroPeriodo">
            Período
          </label>
          <select
            id="inFiltroPeriodo"
            value={filtro.periodo}
            onChange={(e) => setFiltro((f) => ({ ...f, periodo: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="diurno">Diurno</option>
            <option value="noturno">Noturno</option>
          </select>
        </div>
        <div className="card hist">
          {loading ? (
            <div className="empty">Carregando…</div>
          ) : !list.length ? (
            <div className="empty">
              {hist.length ? 'Nenhum resultado para o filtro.' : 'Você ainda não tem avaliações salvas.'}
            </div>
          ) : (
            pageItems.map((r, i) => {
              const idx = start + i;
              const manage = canManageRec(r, user?.id);
              return (
                <div key={r.id || `${r.data}-${idx}`} className="h">
                  <div className="h-main">
                    <div>
                      <div className="row1">
                        <strong>{r.nome}</strong>
                        {r.crit ? <span className="badge">Crítico</span> : null}
                      </div>
                      <span className="meta">
                        RA {r.ra || '—'} · Período {periodoLabel(r.periodo)}
                      </span>
                      <span className="meta">
                        Estação {r.st} ·{' '}
                        {new Date(r.data).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <span className="g">{fmt(r.nota)}</span>
                  </div>
                  <div className="h-actions">
                    <button type="button" className="iconbtn" onClick={() => openRec(idx)}>
                      Ver
                    </button>
                    {manage ? (
                      <>
                        <button
                          type="button"
                          className="iconbtn"
                          onClick={() =>
                            nav(`/desafio/resultado/${r.id}`, {
                              state: { fromHist: true, openEdit: true },
                            })
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="iconbtn danger"
                          onClick={() => void onDelete(idx)}
                        >
                          Excluir
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {!loading && list.length > HIST_PER_PAGE ? (
          <nav className="pager" aria-label="Paginação do histórico">
            <button
              type="button"
              className="iconbtn"
              disabled={safePage <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo(0, 0);
              }}
            >
              Anterior
            </button>
            <span className="page-info">
              Pág. {safePage} / {pages}
            </span>
            <button
              type="button"
              className="iconbtn"
              disabled={safePage >= pages}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo(0, 0);
              }}
            >
              Próxima
            </button>
          </nav>
        ) : null}
        <div className="hist-tools" aria-label="Ferramentas do histórico">
          <button type="button" className="toolbtn" onClick={() => void onClearCache()}>
            Limpar cache do sorteio
          </button>
          <button type="button" className="toolbtn primary" onClick={() => void onDownload()}>
            Baixar planilha
          </button>
        </div>
      </section>
    </>
  );
}