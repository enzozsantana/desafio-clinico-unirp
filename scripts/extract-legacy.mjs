import fs from 'fs';
import path from 'path';

const root = process.cwd();
fs.mkdirSync(path.join(root, 'src/styles'), { recursive: true });
fs.mkdirSync(path.join(root, 'src/modules/desafio'), { recursive: true });

const h = fs.readFileSync(path.join(root, '_legacy/index.html'), 'utf8');
const sh = fs.readFileSync(path.join(root, '_legacy/simulados.html'), 'utf8');

const css = h.match(/<style>([\s\S]*?)<\/style>/)[1];
const scss = sh.match(/<style>([\s\S]*?)<\/style>/)[1];
fs.writeFileSync(path.join(root, 'src/styles/desafio.css'), css);
fs.writeFileSync(path.join(root, 'src/styles/simulados.css'), scss);

const base = h.match(/const BASE = (\[[\s\S]*?\]);/)[1];
const st = h.match(/const ST = (\[[\s\S]*?\]);/)[1];

const stationsTs = `export type BaseItem = { k: string; t: string; d?: string };
export type Station = {
  n: number;
  nome: string;
  caso: string;
  inter: string;
  gab: string;
  nota: string;
  c: Record<string, string>;
};

export const BASE: BaseItem[] = ${base};

export const ST: Station[] = ${st};

export const VAL = { ok: 1, mid: 0.5, bad: 0 } as const;
export const LBL = { ok: 'Correto', mid: 'Parcial', bad: 'Incorreto' } as const;
export type AnsVal = keyof typeof VAL;
export const lbl = (v?: string) => (v && v in LBL ? LBL[v as AnsVal] : 'Não avaliado');
`;
fs.writeFileSync(path.join(root, 'src/modules/desafio/stations.ts'), stationsTs);

// Extract OMR core from simulados
const omr = sh.match(/\/\* OMR-CORE-START \*\/([\s\S]*?)\/\* OMR-CORE-END \*\//)[1];
fs.mkdirSync(path.join(root, 'src/modules/simulados/omr'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'src/modules/simulados/omr/core.js'),
  `/* Extracted OMR core — keep in sync with tests */\n${omr}\nexport { FOLHA, objetivas, folhaCode, layoutFolha, omrRead, omrH, omrBlobs, omrDetect };\n`
);

console.log('extracted ok', {
  desafioCss: css.length,
  simuladosCss: scss.length,
  omr: omr.length,
});
