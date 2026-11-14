export const FASES = [
  { f: 2, t: 'Leitura do caso', s: 'Apresente o caso ao aluno' },
  { f: 8, t: 'Execução da técnica', s: 'Observe e marque os critérios' },
  { f: 2, t: 'Revele a intercorrência', s: 'Apresente a intercorrência', alert: true },
  { f: 2, t: 'Resposta à intercorrência', s: 'Avalie o critério 9' },
  { f: 1, t: 'Finalização', s: 'Descarte e anotação' },
] as const;

export type Phase = {
  a: number;
  b: number;
  t: string;
  s: string;
  alert?: boolean;
};

export function buildPhases(durMin: number): { total: number; phases: Phase[] } {
  const total = durMin * 60;
  let acc = 0;
  const phases: Phase[] = [];
  FASES.forEach((p, i) => {
    const len = i === FASES.length - 1 ? total - acc : Math.round((total * p.f) / 15);
    const m = Math.floor(len / 60);
    const sec = len % 60;
    const seg = `${sec ? `${m}min${String(sec).padStart(2, '0')}` : `${m} min`} · ${p.s}`;
    phases.push({
      a: acc,
      b: acc + len,
      t: p.t,
      s: seg,
      alert: 'alert' in p ? !!p.alert : undefined,
    });
    acc += len;
  });
  return { total, phases };
}

export function phaseAt(elapsed: number, phases: Phase[]): { idx: number; phase: Phase } {
  const idx = phases.findIndex((p) => elapsed >= p.a && elapsed < p.b);
  if (idx >= 0) return { idx, phase: phases[idx]! };
  return {
    idx: -1,
    phase: { a: 0, b: 0, t: 'Tempo esgotado', s: 'Encerrando avaliação' },
  };
}