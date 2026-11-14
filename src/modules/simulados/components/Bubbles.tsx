import type { Simulado } from '../types';
import { LETTERS } from '../utils';

export function Bubbles({
  sim,
  i,
  val,
  keyLetter,
  onPick,
}: {
  sim: Simulado;
  i: number;
  val: string;
  keyLetter: string | null;
  onPick?: (i: number, L: string) => void;
}) {
  const buttons = [];
  for (let k = 0; k < sim.na; k++) {
    const L = LETTERS[k]!;
    buttons.push(
      <button
        key={L}
        type="button"
        className={`bub${val === L ? ' on' : ''}${keyLetter === L ? ' key' : ''}`}
        data-q={i}
        data-a={L}
        aria-label={`Questão ${i + 1}, alternativa ${L}`}
        aria-pressed={val === L}
        onClick={onPick ? () => onPick(i, L) : undefined}
      >
        {L}
      </button>,
    );
  }
  return <div className="bubbles">{buttons}</div>;
}