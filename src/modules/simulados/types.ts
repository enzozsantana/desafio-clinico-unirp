export type Aluno = {
  id: string;
  nome: string;
  resp: string;
  duv?: number[];
  pts?: Record<number, number | string>;
};

export type Simulado = {
  id: string;
  nome: string;
  nq: number;
  na: number;
  max: number;
  gab: string;
  anul: number[];
  alunos: Aluno[];
  criado?: number;
  disc?: number[];
  peso?: (number | null | string)[];
  esp?: Record<number, string>;
};

export type AlunoPreview = {
  nome: string | null;
  paginas: (string | null | undefined)[];
};

export type SimTab = 'gabarito' | 'corrigir' | 'resultados';

export type ScoreResult = {
  ac: number;
  val: number;
  pt: number;
  tot: number;
  pend: number;
  nota: number;
};