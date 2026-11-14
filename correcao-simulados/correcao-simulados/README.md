# Correção de Simulados — Documentação técnica

Sistema web para corrigir provas impressas de múltipla escolha (simulados): cadastro do gabarito, correção manual ou por foto da folha de respostas, cálculo automático da nota, análise da turma e geração da folha de respostas padronizada para impressão.

**Autora do projeto:** Marian Boscolo de Sant'Ana
**Versão:** 1.2 (novembro de 2026): pesos por questão, questões dissertativas e leitura da prova completa em PDF
**Arquivo principal:** `src/index.html` (página única, HTML + CSS + JavaScript puro, sem build)

---

## 1. Visão geral

| Item | Descrição |
|---|---|
| Tipo | Single-page app em um único arquivo HTML |
| Linguagem | JavaScript puro (ES2020), sem framework |
| Build | Nenhum. Basta abrir o arquivo no navegador |
| Interface | Mobile-first, tema claro/escuro automático, idioma pt-BR |
| Ambiente original | Publicado como *Artifact* no claude.ai, usando os recursos de execução do Claude (banco de dados, leitura por IA e downloads) |
| Fora do claude.ai | Funciona em modo reduzido: dados no `localStorage`, sem leitura por PDF/foto e sem download (ver seção 8) |

### Fluxo de uso

1. **Criar simulado:** nome, número de questões (1 a 200), alternativas (A–D ou A–E) e nota máxima. Ou a partir da prova pronta em PDF, que preenche estrutura, dissertativas, pesos e gabarito.
2. **Estrutura e gabarito:** marcar quais questões são dissertativas e o peso (em pontos) de cada questão; gabarito das objetivas por toque, digitação em sequência (`ABCDE-A…`) ou leitura do PDF. Questões objetivas podem ser anuladas.
3. **Folha de respostas:** gera um PDF A4 padronizado para imprimir e entregar aos alunos.
4. **Corrigir:** objetivas por foto (uma ou várias de uma vez) ou à mão; dissertativas corrigidas pelo professor no papel, com a pontuação lançada na tela da prova ou numa tabela aluno × questão. Fotos da folha padronizada são lidas por leitura óptica no próprio aparelho, sem IA; outras folhas vão para a IA. A nota aparece em tempo real. Leituras duvidosas ficam destacadas para conferência.
5. **Resultados:** média, maior/menor nota, classificação por pontos, % de acerto por questão (nas dissertativas, média dos pontos), distribuição das alternativas marcadas e exportação em CSV.

---

## 2. Estrutura do arquivo

O `index.html` está organizado em blocos, nesta ordem:

| Bloco | Conteúdo |
|---|---|
| `<head>` | Fontes (Google Fonts: Bricolage Grotesque e Atkinson Hyperlegible) e todo o CSS |
| CSS | Variáveis de cor em `:root`, com versão escura por `prefers-color-scheme` e `data-theme` |
| `<body>` | `#app` (conteúdo das telas), `#save` (status de salvamento) e `#job` (barra de progresso das leituras) |
| Script: utilitários | `esc`, `uid`, `fmt`, `pad`, `cur` |
| Script: armazenamento | `localStore`, `initStore`, `persist`, `flush` |
| Script: cálculo | `score`, `gabFaltando` |
| Script: leitura automática | `lerPDF`, `promptFoto`, `prepImage`, `pdfPages`, controle do `#job` |
| Script: leitura óptica (núcleo) | Entre `/* OMR-CORE-START */` e `/* OMR-CORE-END */`: `FOLHA`, `layoutFolha`, `folhaCode`, `omrH`, `omrBlobs`, `omrDetect`, `omrRead`. Funções puras, sem DOM: dá para testar em Node |
| Script: leitura óptica (interface) | `omrImage`, `omrRender`, `omrPreviews`, `lerFotos` |
| Script: folha de respostas | `folhaPDF` |
| Script: telas | `renderHome`, `renderSim`, `paneGab`, `paneLista`, `paneAluno`, `paneRes` |
| Script: inicialização | Carrega os recursos, os dados salvos e chama `render()` |

O estado da interface fica no objeto `S`:

```js
S = {
  sims: [],        // todos os simulados carregados
  cur: null,       // id do simulado aberto
  tab: 'gabarito', // 'gabarito' | 'corrigir' | 'resultados'
  aluno: null,     // id da prova aberta no editor
  openQ: null,     // questão expandida em Resultados
  busy: false,     // true durante uma leitura de PDF/foto
  prev: {},        // imagens da folha lida, por id de prova (só na memória, não são salvas)
  lancar: false    // true na tabela de lançamento das dissertativas
}
```

A renderização é feita com `innerHTML` por tela. No editor de prova, só a folha de bolinhas e o placar são redesenhados a cada toque, para não perder o foco do campo de nome.

---

## 3. Modelo de dados

Cada simulado é um objeto JSON salvo como um documento:

```json
{
  "id": "s1abc2def",
  "nome": "Simulado de Fundamentos",
  "nq": 20,
  "na": 5,
  "max": 10,
  "gab": "ABCDE.ABCDEABCDEABCD",
  "anul": [5],
  "disc": [16, 17, 18, 19],
  "peso": [0.5, 0.5, null, 1.5],
  "esp": {"16": "Resposta esperada resumida, lida do PDF"},
  "criado": 1763068800000,
  "alunos": [
    {
      "id": "a1xyz9",
      "nome": "Maria Souza",
      "resp": "ABCDA.ABCDEABCDEABC.",
      "duv": [4, 19],
      "pts": {"16": 1.5, "17": 1}
    }
  ]
}
```

| Campo | Tipo | Significado |
|---|---|---|
| `id` | string | Prefixo `s` + timestamp base 36 + aleatório |
| `nome` | string | Nome do simulado |
| `nq` | número | Quantidade de questões (1 a 200) |
| `na` | número | Alternativas por questão: 4 (A–D) ou 5 (A–E) |
| `max` | número | Nota máxima (padrão 10) |
| `gab` | string | Gabarito, um caractere por questão. `.` = sem resposta cadastrada (sempre `.` nas dissertativas) |
| `disc` | número[] | Índices (base 0) das questões dissertativas. Opcional |
| `peso` | (número\|null)[] | Valor em pontos de cada questão. `null` ou ausente = 1. Opcional |
| `esp` | objeto | Resposta esperada de dissertativas, por índice, quando o PDF trouxer. Opcional |
| `anul` | número[] | Índices (base 0) das questões anuladas |
| `alunos[].resp` | string | Respostas do aluno, mesmo formato do gabarito. `.` = em branco |
| `alunos[].duv` | número[] | Índices (base 0) que a leitura por foto marcou como duvidosos. Opcional |
| `alunos[].pts` | objeto | Pontos lançados em cada dissertativa, por índice. Ausente = ainda não corrigida |
| `alunos[].ia` | booleano | `true` quando a prova foi lida pela IA (folha não padronizada). Opcional |

Respostas e gabarito são strings de tamanho `nq` para ocupar pouco espaço. A função `pad()` ajusta o tamanho quando o número de questões muda.

---

## 4. Regras de correção

Implementadas em `score(sim, resp, pts)`, que devolve `{ac, val, pt, tot, pend, nota}`:

- **Peso:** cada questão vale `peso(sim, i)` pontos (padrão 1).
- **Objetiva certa:** ganha o peso. Errada, em branco ou dupla marcação: zero.
- **Objetiva anulada:** ganha o peso para todos.
- **Objetiva sem gabarito cadastrado:** fica fora da conta.
- **Dissertativa:** ganha os pontos lançados pelo professor, limitados ao peso. Sem nota lançada, conta como zero e entra em `pend` (a tela avisa que a nota está parcial).
- **Nota:** `pontos obtidos ÷ total de pontos × nota máxima`, com uma casa decimal. Se a soma dos pesos for igual à nota máxima, a nota é a própria soma dos pontos.

Em Resultados, questões com menos de 40% de acerto aparecem em vermelho, de 40% a 69% em amarelo, e as três com menor acerto (abaixo de 60%) são destacadas no topo.

---

## 5. Armazenamento

`initStore()` escolhe o modo na inicialização:

| Modo | Quando | Onde ficam os dados |
|---|---|---|
| `db` | Página aberta no claude.ai | Banco do Artifact, coleção privada `data/users/<id-do-usuário>`, um documento por simulado |
| `local` | Qualquer outro lugar | `localStorage`, chave `simulados-v1`, array com todos os simulados |

Toda alteração chama `persist(sim)`, que agenda a gravação com atraso de 600 ms (debounce por simulado). `flush()` impede duas gravações simultâneas do mesmo simulado e mostra o status em `#save` ("Salvando…", "Salvo" ou mensagem de erro).

---

## 6. Leitura automática (IA)

As leituras usam o recurso `sample` do runtime do Claude (`window.claude.use('sample')`), que envia texto e imagens ao Claude e recebe JSON. O consumo sai do plano Claude de quem usa a página, e a primeira chamada pede autorização.

### 6.1 Prova pronta em PDF — `lerPDF(sim, file)`

Lê a **estrutura completa**: número de questões, quais são dissertativas, pesos indicados no documento, gabarito das objetivas (se houver) e resposta esperada das dissertativas (se houver). Se o PDF não tiver gabarito, a estrutura é aproveitada e o professor marca o gabarito na tela.

1. Carrega o **pdf.js 3.11.174** do cdnjs sob demanda. O worker é carregado como script comum, o que faz o pdf.js rodar na thread principal (evita restrições de Worker de outra origem).
2. Extrai o texto de todas as páginas (até 180 mil caracteres).
3. Se houver texto, pede ao Claude o gabarito em JSON.
4. Se não houver texto (PDF escaneado) ou o gabarito não for encontrado, renderiza as últimas páginas como imagens JPEG (até o limite de imagens por chamada) e tenta de novo pela imagem.
5. Aplica o resultado: ajusta `nq`, `na`, `disc`, `peso`, `gab`, `anul` e `esp`, e avisa quantas objetivas, dissertativas e pesos foram lidos.

Formato pedido ao Claude:

```json
{"encontrado": true, "total_questoes": 20, "alternativas": 5,
 "gabarito": {"1": "A", "2": "C"}, "anuladas": [7],
 "dissertativas": [17, 18, 19, 20],
 "pesos": {"1": 0.5, "17": 1.5},
 "respostas_esperadas": {"17": "..."}}
```

O prompt proíbe o modelo de resolver as questões (só vale o gabarito indicado no documento) e de inventar pesos (só os escritos na prova).

### 6.2 Folha do aluno por foto: leitura óptica primeiro, IA como reserva

`lerFotos(sim, files)` processa as fotos uma a uma:

1. Tenta a **leitura óptica** (seção 7.1). Não usa IA, não tem custo, roda no aparelho em cerca de 0,2 s por foto e funciona até fora do claude.ai.
2. Se a foto não for da folha padronizada (motivos `cantos` ou `folha`) e a IA estiver disponível, envia a foto à IA com o prompt de `promptFoto`. A prova fica marcada com `ia: true`.
3. Se a folha for **de outro simulado** (motivo `outro`, pelo código do rodapé), a foto é recusada, sem IA, e a mensagem final informa quantas questões e alternativas aquela folha tem.

Formato pedido à IA (só no passo 2):

```json
{"legivel": true, "nome": "Maria Souza",
 "respostas": {"1": "A", "2": ""}, "duvidas": [5, 12]}
```

O gabarito nunca é enviado à IA, para não enviesar a leitura.

### 6.3 Erros

Todos os erros do `sample` são tratados por `errMsg(e)`, que traduz o `e.code` (`not_granted`, `rate_limited`, `image_rejected`, `invalid_json`, `cancelled` etc.) para uma mensagem em português. O botão "Parar" usa `AbortController`.

---

## 7. Folha de respostas em PDF — `folhaPDF(sim)`

Gerada com **jsPDF 2.5.1** (cdnjs, sob demanda), A4, em mm. **Só as questões objetivas** ganham bolinhas, mantendo a numeração original; o rodapé avisa que as dissertativas são respondidas na prova. Toda a geometria vem de `FOLHA` e `layoutFolha(sim)`, **as mesmas usadas pela leitura óptica**. Qualquer mudança de layout deve ser feita só ali.

| Elemento | Posição (mm) | Para que serve |
|---|---|---|
| 4 quadrados pretos 5×5 | centros em (10,5; 10,5), (199,5; 10,5), (199,5; 286,5), (10,5; 286,5) | Referência de perspectiva |
| Barra de orientação 10×3 | x 16–26, y 9–12 (só no canto superior esquerdo) | Diz qual lado é o de cima (foto girada 90° ou 180°) |
| Marcas de página 1,5×3 | x = 190, 186, 182, 178; y 9–12 | Página *n* tem *n* marcas |
| Código de 24 bits 2×3 | x = 18 + 3k, y 285–288 | Identifica o simulado (ver abaixo) |
| Bolinhas | raio 2,7; até 100 por página, até 4 colunas de 25 | Respostas |

**Código do rodapé** (`folhaCode`): bit de início (sempre 1), 8 bits do número de questões objetivas, 1 bit das alternativas (0 = A–D, 1 = A–E) e 14 bits de um resumo do `id` do simulado (mais a lista de dissertativas, quando houver). Renomear o simulado ou mudar pesos não muda o código; mudar o número de questões, as alternativas ou quais são dissertativas muda, e a folha impressa antes deixa de ser aceita (de propósito, porque a posição das bolinhas muda).

### 7.1 Leitura óptica (OMR) — `omrRead(img, sim, pgHint)`

Entrada: imagem em tons de cinza `{g: Uint8Array, w, h}`, reduzida para no máximo 1600 px no lado maior (`omrImage`, que também aplica a orientação EXIF).

1. **Blocos escuros** (`omrBlobs`): limiar adaptativo (média local por imagem integral, janela de 1/24 da imagem) e componentes conexos. Ficam os blocos de tamanho e formato compatíveis com os quadrados.
2. **Cantos** (`omrDetect`): para cada canto da imagem, os 5 blocos mais extremos; testa as combinações (área do quadrilátero ≥ 12% da imagem, tamanhos parecidos) e calcula a **homografia** folha→foto (`omrH`, sistema 8×8). Cada combinação recebe nota pelo contraste dos quatro quadrados com o papel em volta.
3. **Orientação**: para as 3 melhores combinações, testa as 4 rotações e escolhe pela barra de orientação e pelo encaixe dos contornos impressos das bolinhas (`omrGrid`).
4. **Validação**: lê as marcas de página e o código do rodapé. Código diferente do simulado → `{ok:false, motivo:'outro'}`. Folha antiga sem código → confere se cada coluna de letra tem contorno e se não há bolinha sobrando antes ou depois (senão `motivo:'folha'`).
5. **Ajuste fino por linha**: desloca cada linha de questão em até ±1,2 mm, buscando o melhor encaixe dos contornos (compensa papel curvado).
6. **Leitura**: para cada bolinha, escurecimento do miolo (raio 1,5 mm) em relação ao papel em volta (percentil 90 de um anel). Subtrai a mediana de todas as bolinhas (as em branco) e decide:

| Diferença da mais escura (t1) e da segunda (t2) | Resultado |
|---|---|
| t1 < 0,15 | Em branco |
| t1 ≥ 0,30 e t2 ≥ 0,30 | Dupla marcação: em branco + conferir |
| t1 ≥ 0,30 e t2 < 0,15 | Resposta lida |
| t1 ≥ 0,30 e 0,15 ≤ t2 < 0,30 | Resposta lida + conferir (possível rasura) |
| 0,15 ≤ t1 < 0,30 | Melhor palpite + conferir (marca fraca) |

Saída: `{ok, pg, resp: {indice: 'A'|''}, duv: [indices], marks, page, h, qualidade}`.

**Simulados com mais de 100 questões:** uma foto por página. A página é reconhecida pelas marcas; páginas seguintes são juntadas à prova do mesmo aluno.

**Conferência:** `omrPreviews` gera uma imagem “escaneada” da folha (endireitada, 3 px/mm) com a leitura desenhada por cima (azul = lida, laranja = conferir) e um recorte do campo Nome. As duas aparecem no editor da prova. Ficam só na memória da sessão (`S.prev`), não são salvas no banco.

**Nome do aluno:** a leitura óptica não lê letra de mão. A prova entra como “Prova N (nome a conferir)” e o editor mostra o recorte do nome para digitar.

### 7.2 Testes da leitura óptica

O núcleo foi testado em Node com folhas sintéticas (Python/PIL): perspectiva, luz desigual, ruído, desfoque, rotações de 90°/180°/270°, folha ocupando 40% da foto, marcas a lápis claro, duplas marcações, folhas antigas sem código e folhas de outro simulado. Resultado: 100% de acerto nas respostas, duplas marcações sempre enviadas para conferência e folhas de outro simulado sempre recusadas. Também houve teste ponta a ponta no Chrome sem interface. **Ainda falta validar com fotos reais** de folhas impressas; recomenda-se uma rodada com 20 a 30 folhas antes do uso oficial.

## 8. Dependências e recursos do runtime

### Bibliotecas externas (todas por CDN)

| Biblioteca | Versão | Uso | Carregamento |
|---|---|---|---|
| (nenhuma) | — | Leitura óptica: JavaScript puro, sem OpenCV | — |
| Google Fonts | — | Tipografia | Sempre |
| pdf.js | 3.11.174 | Ler o PDF da prova | Sob demanda |
| jsPDF | 2.5.1 | Gerar a folha de respostas | Sob demanda |

### Recursos do runtime do Claude usados

| Recurso | Uso | Sem ele |
|---|---|---|
| `db` | Salvar os simulados na conta do usuário | Usa `localStorage` |
| `user` | Identificar o usuário para a coleção privada | Usa `localStorage` |
| `sample` (com imagens) | Ler o gabarito do PDF e fotos de folhas não padronizadas | Leitura óptica continua funcionando; PDF e folhas não padronizadas ficam indisponíveis |
| `downloads` | Baixar CSV e PDF | Botões de download ficam ocultos |

Todos são obtidos com `window.claude.use(nome)`, que devolve `null` quando o recurso não existe. A página foi escrita para funcionar sem qualquer um deles.

---

## 9. Como rodar fora do claude.ai

Abrir `src/index.html` em um navegador já funciona no modo reduzido (cadastro, correção manual, **leitura óptica por foto** e resultados), com dados apenas naquele navegador.

Para ter todas as funções em um servidor próprio, sugestão de substituições:

| Função atual | Substituto sugerido |
|---|---|
| `db` + `user` | Backend com autenticação (ex.: Supabase, Firebase ou API própria) mantendo o mesmo JSON por simulado. Basta implementar `list()`, `save(sim)` e `remove(id)` no objeto retornado por `initStore()` |
| `sample` | Endpoint no servidor que chama a API do Claude (Messages API, com imagem em base64). **A chave da API nunca deve ficar no navegador.** Os prompts estão nas funções `lerPDF` e `promptFoto` |
| `downloads.save` | Download comum com `Blob` + `URL.createObjectURL` + link `<a download>` |

---

## 10. Limitações conhecidas

- A leitura óptica só vale para a folha gerada pelo sistema. Folhas impressas antes da versão 1.1 ainda são lidas, mas sem a checagem pelo código do rodapé.
- Precisa dos 4 quadrados pretos visíveis na foto. Papel muito amassado ou dobrado sobre as bolinhas pode gerar questões para conferir.
- Marcação com X ou só circulando a letra tende a cair em “conferir”; a folha orienta a preencher a bolinha.
- O nome escrito à mão não é lido automaticamente (a prova entra como “nome a conferir”, com o recorte do nome na tela).
- As imagens de conferência não são salvas; somem ao recarregar a página.
- A leitura do gabarito pelo PDF e de folhas não padronizadas continua dependendo da IA e pode errar.
- No modo `local`, os dados não sincronizam entre aparelhos.

## 11. Sugestões de evolução

1. **QR code ou lista de alunos pré-impressa** na folha, para o nome entrar automaticamente.
2. **Captura pela câmera com guia** (moldura na tela e disparo automático quando os 4 quadrados aparecem).
3. **Salvar a imagem de conferência** em armazenamento de arquivos, para auditoria posterior.
4. **Áreas/disciplinas**, com desempenho por área.
5. **Guardar o PDF da prova** junto do simulado (armazenamento de arquivos), para consulta durante a correção.
6. **Relatório individual** do aluno em PDF.
7. **Exportação em .xlsx** além do CSV.
8. **Testes automatizados** no repositório para `score`, `parseSeq`, `pad` e o núcleo OMR (os geradores de folha sintética podem ser aproveitados).

## 12. Formato do CSV exportado

- Separador `;`, codificação UTF-8 com BOM (abre direto no Excel em português).
- Linha 1: cabeçalho (`Posição; Aluno; Acertos objetivas; Objetivas válidas; Pontos; Total de pontos; Nota; Q1…Qn`), com `(dissertativa)` no nome das colunas abertas.
- Linha 2: o gabarito (anuladas como `anulada`, dissertativas em branco).
- Linha 3: o peso de cada questão.
- Demais linhas: um aluno por linha, em ordem de classificação; nas dissertativas, os pontos lançados.

---

## 13. Conteúdo do pacote

```
correcao-simulados/
├── README.md          esta documentação
├── src/
│   └── index.html     código-fonte completo do sistema
└── testes/
    ├── gerar_folha.py folha sintética fotografada (Python + Pillow + NumPy)
    ├── testar_omr.js  roda a leitura óptica em Node e compara com o esperado
    ├── codigo.js      imprime o código de rodapé de um simulado
    └── omr-core.js    cópia do núcleo da leitura óptica
```

Exemplo, dentro de `testes/`: `node codigo.js '{"id":"sX","nq":40,"na":5}'` gera o código;
passe-o em `"code"` para `python3 gerar_folha.py 1 '{"nq":40,"na":5,"code":[...]}'`
e rode `node testar_omr.js '{"nq":40,"na":5,"id":"sX"}'`.
