# Sistema de Avaliações UNIRP

Plataforma web para professores (Enfermagem / UNIRP), em **Vite + React + TypeScript**.

## Módulos

1. **Desafio Clínico** (`/desafio`) — OSCE com 7 estações, sorteio e checklist
2. **Correção de Simulados** (`/simulados`) — gabarito, OMR da folha padronizada e resultados

## Stack

- Vite + React + TypeScript
- React Router
- Supabase (Auth, Postgres, Storage)

## Desenvolvimento

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

A saída fica em `dist/`. Em hosts estáticos (Netlify etc.), use rewrite SPA para `index.html` (`public/_redirects` já inclui a regra Netlify).

Publicação no GitHub Pages:

```bash
npm run deploy:gh
```

URL: https://enzozsantana.github.io/sistema-avaliacoes-unirp/

## Estrutura

- `src/auth` — sessão e perfil do professor
- `src/layout` — header, drawer, tema
- `src/modules/desafio` — OSCE
- `src/modules/simulados` — correção de provas (+ núcleo OMR)
- `_legacy/` — HTMLs monólitos anteriores (referência)
- `correcao-simulados/` — pacote original e testes OMR

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon (pública) |

Não comite o arquivo `.env`.
