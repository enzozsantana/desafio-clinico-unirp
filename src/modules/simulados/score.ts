import type { Simulado, ScoreResult } from './types';
import { objetivas } from './omr/core.js';
import { fmt, LETTERS } from './utils';

export function peso(sim: Simulado, i: number): number {
  const p = sim.peso?.[i];
  return p === undefined || p === null || p === '' ? 1 : Math.max(0, +p || 0);
}

export function isDisc(sim: Simulado, i: number): boolean {
  return !!(sim.disc && sim.disc.includes(i));
}

export function temPts(pts: Record<number, number | string> | undefined, i: number): boolean {
  return !!pts && pts[i] !== undefined && pts[i] !== null && pts[i] !== '';
}

export function score(
  sim: Simulado,
  resp: string,
  pts?: Record<number, number | string>,
): ScoreResult {
  let ac = 0;
  let val = 0;
  let pt = 0;
  let tot = 0;
  let pend = 0;
  for (let i = 0; i < sim.nq; i++) {
    const w = peso(sim, i);
    if (isDisc(sim, i)) {
      tot += w;
      if (temPts(pts, i)) pt += Math.min(w, Math.max(0, +pts![i]! || 0));
      else pend++;
      continue;
    }
    if (sim.anul.includes(i)) {
      ac++;
      val++;
      pt += w;
      tot += w;
      continue;
    }
    const g = sim.gab[i];
    if (!g || g === '.') continue;
    val++;
    tot += w;
    if (resp[i] === g) {
      ac++;
      pt += w;
    }
  }
  return { ac, val, pt, tot, pend, nota: tot ? (pt / tot) * sim.max : 0 };
}

export function gabFaltando(sim: Simulado): number {
  let n = 0;
  for (let i = 0; i < sim.nq; i++) {
    if (!isDisc(sim, i) && !sim.anul.includes(i) && (!sim.gab[i] || sim.gab[i] === '.')) n++;
  }
  return n;
}

export function fmtN(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function numBR(v: string): number | null {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function pad(str: string, n: number): string {
  str = (str || '').slice(0, n);
  return str + '.'.repeat(Math.max(0, n - str.length));
}

export function parseFaixas(txt: string, nq: number): number[] | null {
  const out = new Set<number>();
  for (const part of String(txt).split(/[,;\s]+/)) {
    if (!part) continue;
    const m = part.match(/^(\d+)(?:[-–a](\d+))?$/i);
    if (!m) return null;
    let a = +m[1];
    let b = m[2] ? +m[2] : a;
    if (a > b) [a, b] = [b, a];
    for (let i = a; i <= b; i++) if (i >= 1 && i <= nq) out.add(i - 1);
  }
  return [...out].sort((x, y) => x - y);
}

export function faixas(idx: number[]): string {
  const s = idx.slice().sort((a, b) => a - b);
  const out: string[] = [];
  for (let k = 0; k < s.length; k++) {
    let j = k;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j > k ? `${s[k] + 1} a ${s[j] + 1}` : `${s[k] + 1}`);
    k = j;
  }
  return out.join(', ');
}

export function resumoEstrutura(sim: Simulado): string {
  const nd = (sim.disc || []).length;
  const no = sim.nq - nd;
  let tot = 0;
  for (let i = 0; i < sim.nq; i++) tot += peso(sim, i);
  const partes = [`${no} ${no === 1 ? 'objetiva' : 'objetivas'}`];
  if (nd) partes.push(`${nd} ${nd === 1 ? 'dissertativa' : 'dissertativas'} (${faixas(sim.disc!)})`);
  return `${partes.join(' e ')}. Total: ${fmtN(tot)} ${tot === 1 ? 'ponto' : 'pontos'}${Math.abs(tot - sim.max) < 1e-9 ? ', que já é a nota máxima.' : `, convertidos para nota de 0 a ${fmt(sim.max)}.`}`;
}

export function seqTxt(sim: Simulado, str: string): string {
  return objetivas(sim)
    .map((i) => (str[i] === '.' || !str[i] ? '-' : str[i]))
    .join('')
    .replace(/-+$/, '');
}

export function parseSeq(txt: string, na: number): string {
  const okL = LETTERS.slice(0, na);
  let out = '';
  for (const c of txt.toUpperCase()) {
    if (okL.includes(c)) out += c;
    else if (c === '-' || c === '.' || c === '_' || c === 'X' || c === '*') out += '.';
  }
  return out;
}

export function aplicaSeq(sim: Simulado, str: string, txt: string): string {
  const arr = pad(str, sim.nq).split('');
  const seq = parseSeq(txt, sim.na);
  const ob = objetivas(sim);
  ob.forEach((i, k) => {
    arr[i] = seq[k] || '.';
  });
  return arr.join('');
}