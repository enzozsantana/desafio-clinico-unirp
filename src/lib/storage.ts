export function load<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : def;
  } catch {
    return def;
  }
}

export function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function fmt(n: number) {
  return Number(n).toFixed(1).replace('.', ',');
}

export function firstName(nome: string) {
  return (nome || '').trim().split(/\s+/)[0] || 'professor';
}

export function periodoLabel(p?: string | null) {
  if (p === 'diurno') return 'Diurno';
  if (p === 'noturno') return 'Noturno';
  return '—';
}
