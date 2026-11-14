import type { AnsVal } from './stations';
import { BASE, lbl, ST, type Station } from './stations';
import { fmt, periodoLabel } from '../../lib/storage';

export type AvaliacaoRec = {
  id: string | null;
  data: string;
  profId: string;
  prof: string;
  nome: string;
  ra: string;
  periodo: string;
  st: number;
  stNome: string;
  ans: Record<string, AnsVal | string>;
  nota: number;
  crit: boolean;
  obs: string;
  tempo: number;
  dur: number;
  porTempo: boolean;
  avaliados: number;
};

export type EvalSession = {
  profId: string;
  prof: string;
  nome: string;
  ra: string;
  periodo: 'diurno' | 'noturno';
  st: number;
  ans: Record<string, AnsVal>;
  crit: boolean;
  obs: string;
};

export type AvaliacaoRow = {
  id: string;
  created_at: string;
  professor_id: string;
  professores?: { nome_completo: string } | { nome_completo: string }[] | null;
  aluno_nome: string;
  aluno_ra?: string | null;
  periodo?: string | null;
  estacao: number;
  estacao_nome: string;
  respostas?: Record<string, string> | null;
  nota: number | string;
  erro_critico?: boolean | null;
  observacoes?: string | null;
  tempo_segundos?: number | null;
  duracao_min?: number | null;
  encerrada_por_tempo?: boolean | null;
  criterios_avaliados?: number | null;
};

export type MapAvaliacaoCtx = {
  userId?: string;
  profNome?: string;
};

function profFromJoin(row: AvaliacaoRow): string {
  const p = row.professores;
  if (!p) return '';
  if (Array.isArray(p)) return p[0]?.nome_completo || '';
  return p.nome_completo || '';
}

export function mapAvaliacao(row: AvaliacaoRow, ctx?: MapAvaliacaoCtx): AvaliacaoRec {
  const joined = profFromJoin(row);
  return {
    id: row.id,
    data: row.created_at,
    profId: row.professor_id,
    prof:
      joined ||
      (row.professor_id === ctx?.userId && ctx.profNome ? ctx.profNome : ''),
    nome: row.aluno_nome,
    ra: row.aluno_ra || '',
    periodo: row.periodo || '',
    st: row.estacao,
    stNome: row.estacao_nome,
    ans: (row.respostas || {}) as Record<string, AnsVal | string>,
    nota: Number(row.nota),
    crit: !!row.erro_critico,
    obs: row.observacoes || '',
    tempo: row.tempo_segundos || 0,
    dur: row.duracao_min || 15,
    porTempo: !!row.encerrada_por_tempo,
    avaliados: row.criterios_avaliados ?? Object.keys(row.respostas || {}).length,
  };
}

export function isCloudId(id: string | null | undefined): boolean {
  return typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id);
}

export function canManageRec(
  r: AvaliacaoRec | null | undefined,
  userId: string | null | undefined,
): boolean {
  return !!(r && userId && r.profId === userId && isCloudId(r.id));
}

export function recText(r: AvaliacaoRec): string {
  const lines = [
    'Desafio Clínico UNIRP',
    `Avaliador: ${r.prof || '—'}`,
    `Aluno: ${r.nome}${r.ra ? ` (RA ${r.ra})` : ''}`,
    `Período: ${periodoLabel(r.periodo)}`,
    `Estação ${r.st}: ${r.stNome}`,
    `Nota: ${fmt(r.nota)} / 10${r.crit ? ' — ERRO CRÍTICO' : ''}`,
    '',
  ];
  if (r.porTempo) lines.splice(6, 0, 'Encerrada por tempo');
  BASE.forEach((b, i) => {
    lines.push(`${i + 1}. ${b.t}: ${lbl(r.ans[b.k] as AnsVal | undefined)}`);
  });
  if (r.obs) {
    lines.push('', `Observações: ${r.obs}`);
  }
  return lines.join('\n');
}

export const HIST_PER_PAGE = 8;

export type HistFilters = {
  q: string;
  st: string;
  crit: string;
  periodo: string;
};

export function histFiltrado(hist: AvaliacaoRec[], f: HistFilters): AvaliacaoRec[] {
  const q = f.q.trim().toLowerCase();
  return hist
    .filter((r) => {
      if (q && !(r.nome || '').toLowerCase().includes(q) && !(r.ra || '').toLowerCase().includes(q)) {
        return false;
      }
      if (f.st && String(r.st) !== String(f.st)) return false;
      if (f.crit === '1' && !r.crit) return false;
      if (f.crit === '0' && r.crit) return false;
      if (f.periodo && r.periodo !== f.periodo) return false;
      return true;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function tabelaRows(hist: AvaliacaoRec[], f: HistFilters): string[][] {
  const head = [
    'Data',
    'Professor',
    'Aluno',
    'RA',
    'Período',
    'Estação',
    'Tempo (min)',
    ...BASE.map((b, i) => `${i + 1}. ${b.t}`),
    'Critérios avaliados',
    'Nota',
    'Encerrada por tempo',
    'Erro crítico',
    'Observações',
  ];
  const rows = histFiltrado(hist, f).map((r) => [
    new Date(r.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    r.prof || '',
    r.nome,
    r.ra || '',
    periodoLabel(r.periodo),
    `E${r.st} - ${r.stNome}`,
    String(r.dur || 15),
    ...BASE.map((b) => lbl(r.ans[b.k] as AnsVal | undefined)),
    `${r.avaliados ?? Object.keys(r.ans).length} de 10`,
    fmt(r.nota),
    r.porTempo ? 'Sim' : 'Não',
    r.crit ? 'Sim' : 'Não',
    r.obs || '',
  ]);
  return [head, ...rows];
}

export type EditDraft = {
  nome: string;
  ra: string;
  periodo: string;
  crit: boolean;
  obs: string;
  ans: Record<string, AnsVal | string>;
};

export function stationByNum(st: number): Station | undefined {
  return ST.find((s) => s.n === st);
}