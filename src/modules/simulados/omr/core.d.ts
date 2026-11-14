import type { Simulado } from '../types';

export const FOLHA: {
  W: number;
  H: number;
  M: number;
  r: number;
  perPage: number;
  marks: number[][];
  bar: { x: number; y: number; w: number; h: number };
  slots: number[];
  slotY: number;
  slotW: number;
  slotH: number;
  code: { x0: number; dx: number; y: number; w: number; h: number };
};

export function objetivas(sim: Simulado): number[];
export function folhaCode(sim: Simulado): number[];
export function layoutFolha(sim: Simulado): Array<{
  pg: number;
  start: number;
  count: number;
  cols: number;
  rows: number;
  rowH: number;
  colW: number;
  gap: number;
  qs: Array<{ q: number; k: number; cx: number; y: number; bx: number[] }>;
}>;
export function omrRead(
  img: OmrGrayImage,
  sim: Simulado,
  pgHint?: number | null,
): OmrReadResult;
export function omrPx(img: OmrGrayImage, h: number[], x: number, y: number): number;
export function omrOutline(
  img: OmrGrayImage,
  h: number[],
  bx: number,
  y: number,
  dx: number,
  dy: number,
): number;

export type OmrGrayImage = { g: Uint8Array; w: number; h: number };

export type OmrReadResult =
  | { ok: false; motivo: string; nq?: number; na?: number }
  | {
      ok: true;
      pg: number;
      pgLido?: boolean;
      h: number[];
      resp: Record<number, string>;
      duv: number[];
      marks: Array<{ q: number; j: number; x: number; y: number; doubt: boolean }>;
      page: ReturnType<typeof layoutFolha>[number];
      qualidade?: number;
    };