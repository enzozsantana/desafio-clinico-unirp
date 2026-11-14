import { downloadBlob } from '../download';
import { fmtN, isDisc, peso, score, temPts } from '../score';
import { useSimulados } from '../SimuladosContext';
import type { Simulado } from '../types';
import { esc, fmt, LETTERS } from '../utils';

export function ResPane({ sim }: { sim: Simulado }) {
  const { openQ, setOpenQ } = useSimulados();
  const al = sim.alunos.filter(
    (a) => a.nome.trim() || a.resp.replace(/\./g, '') || (a.pts && Object.keys(a.pts).length),
  );

  if (!al.length) {
    return <div className="card empty muted">Os resultados aparecem aqui assim que você corrigir a primeira prova.</div>;
  }

  const rows = al
    .map((a) => ({ a, s: score(sim, a.resp, a.pts) }))
    .sort((x, y) => y.s.nota - x.s.nota || x.a.nome.localeCompare(y.a.nome, 'pt-BR'));
  const notas = rows.map((r) => r.s.nota);
  const media = notas.reduce((x, y) => x + y, 0) / notas.length;

  const qs: Array<
    | { i: number; disc: true; w: number; n: number; media: number; pct: number | null }
    | { i: number; g: string; an: boolean; cnt: Record<string, number>; pct: number | null; disc?: false }
  > = [];

  for (let i = 0; i < sim.nq; i++) {
    if (isDisc(sim, i)) {
      const w = peso(sim, i);
      const com = al.filter((a) => temPts(a.pts, i));
      const soma = com.reduce((x, a) => x + Math.min(w, +a.pts![i]! || 0), 0);
      qs.push({
        i,
        disc: true,
        w,
        n: com.length,
        media: com.length ? soma / com.length : 0,
        pct: com.length && w ? (soma / com.length / w) * 100 : null,
      });
      continue;
    }
    const g = sim.gab[i]!;
    const an = sim.anul.includes(i);
    const cnt: Record<string, number> = {};
    let ok = 0;
    al.forEach((a) => {
      const r = a.resp[i] || '.';
      cnt[r] = (cnt[r] || 0) + 1;
      if (r === g) ok++;
    });
    qs.push({ i, g, an, cnt, pct: an || !g || g === '.' ? null : (ok / al.length) * 100 });
  }

  const dificeis = qs
    .filter((q) => q.pct !== null)
    .sort((x, y) => (x.pct ?? 0) - (y.pct ?? 0))
    .slice(0, 3)
    .filter((q) => (q.pct ?? 0) < 60);

  const csv = async () => {
    const q = (v: unknown) => '"' + String(v).replace(/"/g, '""') + '"';
    const head = [
      'Posição',
      'Aluno',
      'Acertos objetivas',
      'Objetivas válidas',
      'Pontos',
      'Total de pontos',
      'Nota',
    ].concat(Array.from({ length: sim.nq }, (_, i) => 'Q' + (i + 1) + (isDisc(sim, i) ? ' (dissertativa)' : '')));
    const lines = [
      head.map(q).join(';'),
      [
        '',
        'GABARITO',
        '',
        '',
        '',
        '',
        '',
        ...Array.from({ length: sim.nq }, (_, i) =>
          isDisc(sim, i) ? '' : sim.anul.includes(i) ? 'anulada' : sim.gab[i] === '.' ? '' : sim.gab[i],
        ),
      ].map(q).join(';'),
      ['', 'PESO', '', '', '', '', '', ...Array.from({ length: sim.nq }, (_, i) => fmtN(peso(sim, i)))].map(q).join(
        ';',
      ),
    ];
    rows.forEach((r, k) =>
      lines.push(
        [
          k + 1,
          r.a.nome || 'Sem nome',
          r.s.ac,
          r.s.val,
          fmtN(r.s.pt),
          fmtN(r.s.tot),
          fmt(r.s.nota),
          ...Array.from({ length: sim.nq }, (_, i) =>
            isDisc(sim, i)
              ? temPts(r.a.pts, i)
                ? fmtN(+r.a.pts![i]!)
                : ''
              : r.a.resp[i] === '.' || !r.a.resp[i]
                ? ''
                : r.a.resp[i],
          ),
        ].map(q).join(';'),
      ),
    );
    const nome =
      (sim.nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w-]+/g, '-')
        .replace(/^-|-$/g, '') || 'simulado') + '.csv';
    try {
      await downloadBlob({ filename: nome, data: '\ufeff' + lines.join('\r\n') });
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="stats">
        <div className="stat">
          <b>{al.length}</b>
          <span>provas</span>
        </div>
        <div className="stat">
          <b>{fmt(media)}</b>
          <span>média</span>
        </div>
        <div className="stat">
          <b>{fmt(Math.max(...notas))}</b>
          <span>maior nota</span>
        </div>
        <div className="stat">
          <b>{fmt(Math.min(...notas))}</b>
          <span>menor nota</span>
        </div>
      </div>
      {rows.some((r) => r.s.pend) ? (
        <p className="warn" style={{ marginTop: 12 }}>
          {rows.filter((r) => r.s.pend).length}{' '}
          {rows.filter((r) => r.s.pend).length === 1 ? 'prova ainda está' : 'provas ainda estão'} sem a nota de alguma
          dissertativa. Essas notas estão parciais.
        </p>
      ) : null}
      {dificeis.length ? (
        <p className="warn" style={{ marginTop: 12 }}>
          Questões que mais derrubaram a turma:{' '}
          {dificeis
            .map((q) => `${q.i + 1} (${Math.round(q.pct!)}% ${'disc' in q && q.disc ? 'dos pontos' : 'de acerto'})`)
            .join(', ')}
          .
        </p>
      ) : null}
      <h2 style={{ fontSize: '1.1rem', margin: '22px 0 6px' }}>Classificação</h2>
      <div className="card" style={{ padding: '4px 12px', overflowX: 'auto' }}>
        <table className="rank">
          <tbody>
            {rows.map((r, k) => (
              <tr key={r.a.id}>
                <td>{k + 1}º</td>
                <td>{esc(r.a.nome || 'Sem nome')}</td>
                <td className="r muted small">
                  {fmtN(r.s.pt)}/{fmtN(r.s.tot)} pts
                </td>
                <td className="r">
                  <span className="pill">{fmt(r.s.nota)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 style={{ fontSize: '1.1rem', margin: '22px 0 2px' }}>Acerto por questão</h2>
      <p className="hint" style={{ margin: '0 0 8px' }}>
        Toque numa questão objetiva para ver quantos marcaram cada alternativa. Nas dissertativas, a barra mostra a média
        dos pontos.
      </p>
      <div className="card" style={{ padding: '4px 12px' }}>
        {qs.map((q) => {
          if ('disc' in q && q.disc && q.pct === null) {
            return (
              <div key={q.i} className="qa" style={{ cursor: 'default' }}>
                <span className="qn">{q.i + 1}</span>
                <span className="small muted">dissertativa sem notas lançadas</span>
                <span />
              </div>
            );
          }
          if (q.pct === null) {
            return (
              <div key={q.i} className="qa" style={{ cursor: 'default' }}>
                <span className="qn">{q.i + 1}</span>
                <span className="small muted">{'an' in q && q.an ? 'anulada' : 'sem gabarito'}</span>
                <span />
              </div>
            );
          }
          if ('disc' in q && q.disc) {
            const lvl = q.pct < 40 ? 'low' : q.pct < 70 ? 'mid' : '';
            return (
              <div key={q.i} className={`qa ${lvl}`} style={{ cursor: 'default' }}>
                <span className="qn">{q.i + 1}</span>
                <span className="bar">
                  <i style={{ width: `${q.pct}%` }} />
                </span>
                <span className="small" style={{ textAlign: 'right' }}>
                  {fmtN(q.media)}/{fmtN(q.w)}
                </span>
              </div>
            );
          }
          const lvl = q.pct < 40 ? 'low' : q.pct < 70 ? 'mid' : '';
          const open = openQ === q.i;
          const dist = open ? (
            <div className="dist">
              {LETTERS.slice(0, sim.na)
                .split('')
                .map((L) => (
                  <span key={L} className={L === (q as { g: string }).g ? 'k' : ''}>
                    {L}: {(q as { cnt: Record<string, number> }).cnt[L] || 0}
                  </span>
                ))}
              <span>em branco: {(q as { cnt: Record<string, number> }).cnt['.'] || 0}</span>
            </div>
          ) : null;
          return (
            <button
              key={q.i}
              type="button"
              className={`qa ${lvl}`}
              data-qa={q.i}
              aria-expanded={open}
              onClick={() => setOpenQ(openQ === q.i ? null : q.i)}
            >
              <span className="qn">{q.i + 1}</span>
              <span className="bar">
                <i style={{ width: `${q.pct}%` }} />
              </span>
              <span className="small" style={{ textAlign: 'right' }}>
                {Math.round(q.pct)}%
              </span>
              {dist}
            </button>
          );
        })}
      </div>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={() => void csv()}>
          Baixar planilha (CSV)
        </button>
      </div>
    </>
  );
}