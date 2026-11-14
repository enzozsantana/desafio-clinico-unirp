import { VAL } from './stations';

export function calc(ans: Record<string, string | undefined>): number {
  return Object.values(ans).reduce((s, v) => s + (VAL[v as keyof typeof VAL] ?? 0), 0);
}