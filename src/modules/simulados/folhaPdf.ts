import { jsPDF } from 'jspdf';
import type { Simulado } from './types';
import { downloadBlob } from './download';
import { faixas } from './score';
import { LETTERS } from './utils';
import { FOLHA, folhaCode, layoutFolha, objetivas } from './omr/core.js';

const LOGO_URL = `${import.meta.env.BASE_URL}unirp-logo.png`;
/** Largura/altura da logo no cabeçalho (mm), proporção ~147×40 */
const LOGO_W = 36;
const LOGO_H = 9.8;

function logoSafeWidth(W: number, M: number) {
  return W - 2 * M - LOGO_W - 8;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function folhaPDF(
  sim: Simulado,
  opts?: { professor?: string },
): Promise<{ error?: string }> {
  if (!objetivas(sim).length) {
    return { error: 'Este simulado não tem questões objetivas, então não há folha de bolinhas.' };
  }
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { W, H, M, r } = FOLHA;
  const L = LETTERS.slice(0, sim.na);
  const lay = layoutFolha(sim);
  const pages = lay.length;
  const bits = folhaCode(sim);
  const nome = doc.splitTextToSize(sim.nome, 150)[0] as string;
  const professor = (opts?.professor || '').trim();
  const profLine = professor
    ? (doc.splitTextToSize(`Professor: ${professor}`, logoSafeWidth(W, M))[0] as string)
    : '';
  const logo = await loadLogoDataUrl();
  for (const P of lay) {
    const pg = P.pg;
    if (pg) doc.addPage();
    doc.setFillColor(0, 0, 0);
    FOLHA.marks.forEach(([x, y]) => doc.rect(x - 2.5, y - 2.5, 5, 5, 'F'));
    const b = FOLHA.bar;
    doc.rect(b.x, b.y, b.w, b.h, 'F');
    for (let k = 0; k <= Math.min(pg, FOLHA.slots.length - 1); k++) {
      doc.rect(FOLHA.slots[k]! - FOLHA.slotW / 2, FOLHA.slotY, FOLHA.slotW, FOLHA.slotH, 'F');
    }
    bits.forEach((v, k) => {
      if (v) doc.rect(FOLHA.code.x0 + k * FOLHA.code.dx, FOLHA.code.y, FOLHA.code.w, FOLHA.code.h, 'F');
    });
    if (logo) {
      // À direita do título, abaixo das marcas de página — não altera coordenadas OMR
      doc.addImage(logo, 'PNG', W - M - LOGO_W, M + 3.5, LOGO_W, LOGO_H);
    }
    doc.setTextColor(0);
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Folha de respostas', M + 4, M + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(nome, M + 4, M + 14);
    if (profLine) {
      doc.setFontSize(8.5);
      doc.setTextColor(60);
      doc.text(profLine, M + 4, M + 19);
      doc.setTextColor(0);
    }
    if (pages > 1) {
      doc.setFontSize(9);
      doc.text(`Página ${pg + 1} de ${pages}`, W - M - 4, logo ? M + 16.5 : M + 8, {
        align: 'right',
      });
    }
    let y = M + 25;
    doc.setFontSize(10);
    doc.text('Nome:', M + 4, y);
    doc.line(M + 17, y + 0.8, W - M - 4, y + 0.8);
    y += 9;
    doc.text('Turma:', M + 4, y);
    doc.line(M + 18, y + 0.8, M + 70, y + 0.8);
    doc.text('RA:', M + 76, y);
    doc.line(M + 84, y + 0.8, M + 130, y + 0.8);
    doc.text('Data:', M + 136, y);
    doc.line(M + 147, y + 0.8, W - M - 4, y + 0.8);
    y += 8;
    doc.setFontSize(8.5);
    doc.setTextColor(80);
    doc.text(
      'Preencha totalmente a bolinha da alternativa escolhida, com caneta azul ou preta. Marque só uma por questão e não rasure.',
      M + 4,
      y,
    );
    doc.setTextColor(0);
    for (const q of P.qs) {
      if (q.k % 2 === 0) {
        doc.setFillColor(238, 238, 238);
        doc.rect(q.cx - 1, q.y - P.rowH / 2, P.colW + 1, P.rowH, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0);
      doc.text(String(q.q + 1), q.cx + 7, q.y + 1.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      q.bx.forEach((bx, j) => {
        doc.setFillColor(255, 255, 255);
        doc.circle(bx, q.y, r, 'FD');
        doc.setTextColor(150);
        doc.text(L[j]!, bx, q.y + 0.85, { align: 'center' });
      });
    }
    const discNote =
      (sim.disc || []).length ? `. Dissertativas (${faixas(sim.disc!)}): responda na prova.` : '';
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text(
      `${nome}: ${objetivas(sim).length} objetivas, alternativas A a ${L[L.length - 1]}${discNote}`,
      W / 2,
      H - M - 2.5,
      { align: 'center' },
    );
  }
  const slug =
    (sim.nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w-]+/g, '-')
      .replace(/^-|-$/g, '') || 'simulado') + '-folha-de-respostas.pdf';
  try {
    await downloadBlob({ filename: slug, data: doc.output('blob') });
  } catch {
    return { error: 'Não foi possível baixar o PDF agora.' };
  }
  return {};
}
