import type { Simulado } from './types';

export const LETTERS = 'ABCDE';

export function esc(s: unknown): string {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

export function uid(p: string): string {
  return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function defaultSimulado(partial: Partial<Simulado> & Pick<Simulado, 'id'>): Simulado {
  return {
    anul: [],
    alunos: [],
    na: 5,
    max: 10,
    nome: 'Simulado sem nome',
    nq: 20,
    gab: '.'.repeat(partial.nq ?? 20),
    ...partial,
  } as Simulado;
}