import { VAL } from './stations';

/** Soma dos critérios da estação (0–10). */
export function calc(ans: Record<string, string | undefined>): number {
  return Object.values(ans).reduce((s, v) => s + (VAL[v as keyof typeof VAL] ?? 0), 0);
}

/** Média entre prática e caderno (ambos 0–10). */
export function calcFinal(pratica: number, caderno: number): number {
  return (pratica + caderno) / 2;
}

export function parseNotaCaderno(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isNotaCadernoValida(n: number | null): n is number {
  return n !== null && n >= 0 && n <= 10;
}
