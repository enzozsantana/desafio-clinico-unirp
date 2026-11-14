import type { Simulado } from '../types';
import { uid } from '../utils';
import { FOLHA, layoutFolha, objetivas, omrPx, omrRead } from './core.js';
import type { OmrGrayImage, OmrReadResult } from './core.d';

export type OmrPreviewPair = { pagina: string; nome: string | null };

export async function omrImage(file: File): Promise<OmrGrayImage> {
  let src: ImageBitmap | HTMLImageElement;
  try {
    src = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    src = await new Promise<HTMLImageElement>((res, rej) => {
      const u = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => {
        URL.revokeObjectURL(u);
        rej(e);
      };
      im.src = u;
    });
  }
  const w0 = src instanceof ImageBitmap ? src.width : src.naturalWidth;
  const h0 = src instanceof ImageBitmap ? src.height : src.naturalHeight;
  const s = Math.min(1, 1600 / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * s);
  c.height = Math.round(h0 * s);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const g = new Uint8Array(c.width * c.height);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = (d[p]! * 77 + d[p + 1]! * 150 + d[p + 2]! * 29) >> 8;
  }
  return { g, w: c.width, h: c.height };
}

function omrRender(img: OmrGrayImage, h: number[], x0: number, y0: number, wmm: number, hmm: number, ppm: number) {
  const c = document.createElement('canvas');
  c.width = Math.round(wmm * ppm);
  c.height = Math.round(hmm * ppm);
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas');
  const id = ctx.createImageData(c.width, c.height);
  const o = id.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const v = omrPx(img, h, x0 + x / ppm, y0 + y / ppm);
      const p = (y * c.width + x) * 4;
      o[p] = o[p + 1] = o[p + 2] = v;
      o[p + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return { c, ctx };
}

export function omrPreviews(img: OmrGrayImage, res: Extract<OmrReadResult, { ok: true }>): OmrPreviewPair {
  const ppm = 3;
  const { c, ctx } = omrRender(img, res.h, 0, 0, FOLHA.W, FOLHA.H, ppm);
  ctx.lineWidth = 2.5;
  for (const m of res.marks) {
    ctx.strokeStyle = m.doubt ? '#E08E00' : '#1F6FEB';
    ctx.beginPath();
    ctx.arc(m.x * ppm, m.y * ppm, (FOLHA.r + 0.9) * ppm, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(224,142,0,.18)';
  for (const q of res.page.qs) {
    if (!res.duv.includes(q.q)) continue;
    ctx.fillRect(
      (q.cx - 1) * ppm,
      (q.y - res.page.rowH / 2) * ppm,
      (res.page.colW + 1) * ppm,
      res.page.rowH * ppm,
    );
  }
  const pagina = c.toDataURL('image/jpeg', 0.72);
  const nome =
    res.pg === 0
      ? omrRender(img, res.h, FOLHA.M, FOLHA.M + 17, FOLHA.W - 2 * FOLHA.M, 13, 6).c.toDataURL(
          'image/jpeg',
          0.8,
        )
      : null;
  return { pagina, nome };
}

const OMR_MOTIVO: Record<string, string> = {
  cantos: 'não achei os 4 quadrados pretos',
  folha: 'não é a folha de respostas deste simulado',
  outro: 'é a folha de outro simulado',
};

export type LerFotosHandlers = {
  busy: boolean;
  startJob: (msg: string) => AbortController;
  jobMsg: (m: string) => void;
  endJob: (msg: string, err: boolean) => void;
  onDone: (opts: { simId: string; tab: 'corrigir'; aluno: string | null; scrolled: boolean }) => void;
  getPrev: (alunoId: string) => { nome: string | null; paginas: (string | null | undefined)[] };
  setPrev: (
    alunoId: string,
    patch: { nome?: string | null; paginas?: (string | null | undefined)[] },
  ) => void;
  persist: (sim: Simulado) => void;
};

export async function lerFotos(
  sim: Simulado,
  files: File[],
  h: LerFotosHandlers,
): Promise<void> {
  if (h.busy || !files.length) return;
  if (!objetivas(sim).length) {
    h.endJob('Este simulado só tem dissertativas. Lance as notas em “Lançar notas das dissertativas”.', true);
    return;
  }
  const ctl = h.startJob(
    files.length > 1 ? `Lendo foto 1 de ${files.length}…` : 'Lendo a folha de respostas…',
  );
  const pages = layoutFolha(sim);
  let ok = 0;
  let ultimo: string | null = null;
  let pend: { a: (typeof sim.alunos)[0]; got: Set<number> } | null = null;
  const falhas: string[] = [];

  for (let k = 0; k < files.length; k++) {
    if (ctl.signal.aborted) break;
    if (files.length > 1) h.jobMsg(`Lendo foto ${k + 1} de ${files.length}…`);
    await new Promise((r) => setTimeout(r, 0));
    let res: OmrReadResult | { ok: false; motivo: string; nq?: number; na?: number } | null = null;
    try {
      const img = await omrImage(files[k]!);
      const hint = pend && pend.got.size < pages.length ? pend.got.size : 0;
      res = omrRead(img, sim, pages.length > 1 ? hint : 0);
      if (res.ok) {
        const withPrev = res as Extract<OmrReadResult, { ok: true }> & {
          prev?: OmrPreviewPair;
        };
        withPrev.prev = omrPreviews(img, res);
        res = withPrev;
      }
    } catch {
      res = { ok: false, motivo: 'imagem' };
    }
    if (res.ok) {
      let a: (typeof sim.alunos)[0];
      const resOk = res as Extract<OmrReadResult, { ok: true }> & { prev: OmrPreviewPair };
      if (pend && resOk.pg > 0 && !pend.got.has(resOk.pg)) {
        a = pend.a;
      } else {
        a = {
          id: uid('a'),
          nome: `Prova ${sim.alunos.length + 1} (nome a conferir)`,
          resp: '.'.repeat(sim.nq),
          duv: [],
        };
        sim.alunos.push(a);
        pend = { a, got: new Set() };
        ok++;
        h.setPrev(a.id, { nome: null, paginas: [] });
      }
      const arr = a.resp.split('');
      for (const q of resOk.page.qs) arr[q.q] = resOk.resp[q.q] || '.';
      a.resp = arr.join('');
      a.duv = [...new Set([...(a.duv || []), ...resOk.duv])].sort((x, y) => x - y);
      pend!.got.add(resOk.pg);
      const pv = h.getPrev(a.id);
      const paginas = pv.paginas.slice();
      paginas[resOk.pg] = resOk.prev.pagina;
      h.setPrev(a.id, {
        paginas,
        nome: resOk.prev.nome ? resOk.prev.nome : pv.nome,
      });
      ultimo = a.id;
      continue;
    }
    if (res.motivo === 'outro') {
      falhas.push(
        `foto ${k + 1}: ${OMR_MOTIVO.outro}${res.nq ? ` (${res.nq} questões, A a ${res.na === 5 ? 'E' : 'D'})` : ''}`,
      );
      continue;
    }
    falhas.push(
      `foto ${k + 1}: ${OMR_MOTIVO[res.motivo] || 'use a folha gerada pelo sistema (4 quadrados pretos visíveis)'}`,
    );
  }
  if (ok) h.persist(sim);
  let msg = ok
    ? `${ok} ${ok === 1 ? 'prova lida' : 'provas lidas'}. Confira as questões destacadas e os nomes.`
    : 'Nenhuma prova foi lida.';
  if (falhas.length) {
    msg += ` Não li: ${falhas.slice(0, 3).join('; ')}${falhas.length > 3 ? ` e mais ${falhas.length - 3}` : ''}.`;
  }
  h.endJob(msg, !ok);
  h.onDone({
    simId: sim.id,
    tab: 'corrigir',
    aluno: files.length <= pages.length && ultimo && ok === 1 ? ultimo : null,
    scrolled: true,
  });
}

export function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = accept;
    if (multiple) i.multiple = true;
    i.style.display = 'none';
    document.body.appendChild(i);
    i.onchange = () => {
      res(Array.from(i.files || []));
      i.remove();
    };
    i.click();
  });
}