export type BaseItem = { k: string; t: string; d?: string };
export type Station = {
  n: number;
  nome: string;
  caso: string;
  inter: string;
  gab: string;
  nota: string;
  c: Record<string, string>;
};

export const BASE: BaseItem[] = [
  {k:"ident", t:"Identificação e comunicação", d:"Apresenta-se, confere nome completo e data de nascimento (pulseira) e orienta o paciente sobre o procedimento."},
  {k:"presc", t:"Conferência da prescrição/solicitação"},
  {k:"maos",  t:"Higiene das mãos e EPI", d:"Higieniza as mãos nos momentos corretos (antes e após o contato e o procedimento) e usa o EPI adequado."},
  {k:"mat",   t:"Separação e organização do material"},
  {k:"prep",  t:"Preparo e posicionamento do paciente"},
  {k:"asep",  t:"Técnica asséptica e antissepsia"},
  {k:"tec",   t:"Execução da técnica"},
  {k:"seg",   t:"Segurança do paciente"},
  {k:"inter", t:"Intercorrência: raciocínio e conduta"},
  {k:"anot",  t:"Descarte e anotação de enfermagem"}
];

export const ST: Station[] = [
 {n:1, nome:"Administração intramuscular: benzilpenicilina benzatina",
  caso:"Paciente V.M.S., 17 anos, primigesta, 18 semanas de gestação. Diagnóstico informado: sífilis. Prescrição: benzilpenicilina benzatina 1.200.000 UI IM. Tarefa: conferir a prescrição, preparar o medicamento e demonstrar a administração intramuscular segura no simulador.",
  inter:"A paciente pergunta: “Minha amiga recebeu duas injeções. Essa quantidade está correta para mim?” Pergunta: o que você faz antes de administrar?",
  gab:"Suspender a administração até esclarecer a divergência; verificar classificação clínica, esquema terapêutico, dose total e prescrição; contatar o prescritor quando necessário. Não presumir que 1.200.000 UI seja o esquema completo.",
  nota:"Validar previamente o esquema terapêutico e a prescrição do caso. A dose de 1.200.000 UI pode corresponder a uma unidade de aplicação, e o tratamento depende da classificação clínica.",
  c:{
   presc:"Confere os certos da medicação (paciente, medicamento, dose, via, horário), pergunta sobre alergia a penicilina e não administra com dúvida ou divergência.",
   mat:"Frasco + diluente, seringa adequada ao volume, agulha de aspiração e de aplicação compatível com a suspensão, algodão, álcool 70%, luvas, bandeja e caixa de perfurocortante.",
   prep:"Garante privacidade e posiciona a gestante com conforto e segurança para o sítio escolhido.",
   asep:"Prepara o medicamento sem contaminar e realiza antissepsia do sítio, aguardando secar.",
   tec:"Reconstitui e homogeneíza sem grumos; delimita corretamente o sítio (ventroglútea ou dorsoglútea); aplica a 90° de forma lenta e retira com compressão leve.",
   seg:"Investiga alergia, não prossegue com divergência e mantém a paciente em observação após a aplicação, atento a sinais de reação.",
   anot:"Descarta perfurocortante sem reencapar; registra data/hora, medicamento, dose, via, local, lote, orientações e intercorrência, com assinatura e COREN."
  }},
 {n:2, nome:"Punção venosa periférica com Abocath",
  caso:"Paciente M.B., 74 anos, com sepse de foco urinário, febre, calafrios, confusão mental e necessidade de acesso venoso para tratamento. Prescrição: SF 0,9% 100 mL + ceftriaxona 2 g (2 frascos-ampola de 1 g) EV.",
  inter:"Após o início da infusão, o paciente refere dor no local. O professor informa que há edema no membro. Pergunta: qual sua conduta imediata?",
  gab:"Interromper a infusão; avaliar o acesso e o membro; reconhecer possível infiltração/extravasamento; seguir protocolo para retirada ou manejo do dispositivo; providenciar novo acesso se indicado; comunicar e registrar.",
  nota:"Conferir reconstituição, diluição e tempo de infusão da ceftriaxona na bula e no protocolo institucional. Investigar alergia a betalactâmicos (penicilinas e cefalosporinas). A ceftriaxona não deve ser misturada nem infundida no mesmo acesso com soluções que contenham cálcio, como Ringer lactato.",
  c:{
   presc:"Confere os certos da medicação (paciente, medicamento, dose de 2 g, via EV, horário) e pergunta sobre alergia a antibióticos, especialmente penicilinas e cefalosporinas.",
   mat:"Cateter de calibre adequado ao idoso, garrote, antisséptico, algodão/gaze, luvas, 2 frascos-ampola de ceftriaxona 1 g, água destilada para reconstituição, seringa e agulha de aspiração, SF 0,9% 100 mL, equipo, extensor preenchido, SF para flush, cobertura/fixação e rótulo da solução.",
   prep:"Orienta o paciente apesar da confusão mental, posiciona o membro e escolhe veia distal, evitando articulações e membro comprometido.",
   asep:"Desinfeta as tampas dos frascos-ampola e do SF, reconstitui e dilui sem contaminar, faz antissepsia do sítio sem repalpar e mantém conexões e equipo sem contaminação.",
   tec:"Reconstitui e dilui a ceftriaxona no SF 0,9% 100 mL e rotula a solução; garroteia, punciona com bisel para cima, observa refluxo, avança o cateter, solta o garrote, testa permeabilidade com flush e instala a infusão no tempo indicado pela bula/protocolo.",
   seg:"Investiga alergia antes de iniciar; não reencapa e ativa o dispositivo de segurança; não associa soluções com cálcio; observa o acesso (dor, edema, rubor) e sinais de reação durante a infusão, protegendo o paciente confuso de tração do cateter.",
   anot:"Descarta corretamente; identifica o acesso (data, calibre, responsável) e registra local, número de tentativas, calibre, medicamento, dose, diluição, horário, tempo de infusão e intercorrência."
  }},
 {n:3, nome:"Administração endovenosa com Scalp",
  caso:"Paciente W.A.R., 52 anos, anemia, hemoglobina de 6,23 g/dL. Comparece à UBS para administração de Noripurum EV. Prescrição: uma ampola de Noripurum EV em SF 0,9% 100 ml. Tarefa: conferir a apresentação, o preparo e demonstrar a administração conforme prescrição, bula e protocolo.",
  inter:"Durante a infusão, o paciente relata coceira intensa, apresenta vermelhidão na pele e refere mal-estar. Pergunta: qual sua conduta?",
  gab:"Interromper imediatamente a administração; avaliar via aérea, respiração, circulação e sinais vitais; acionar equipe de emergência conforme gravidade; prestar suporte e monitorar; comunicar e registrar a suspeita de reação adversa.",
  nota:"Conferir a formulação específica de ferro intravenoso e sua bula. Apresentações diferentes podem ter preparo e velocidade distintos.",
  c:{
   presc:"Confere apresentação, dose, diluição e velocidade com prescrição e bula; pergunta sobre alergias e reações prévias a ferro.",
   mat:"Ampola, SF 0,9% 100 ml, seringa e agulha de aspiração, equipo, scalp de calibre adequado, garrote, algodão, álcool 70%, luvas, fixação e rótulo da solução.",
   prep:"Acomoda o paciente sentado ou reclinado com conforto e orienta a relatar qualquer sintoma durante a infusão.",
   asep:"Prepara a diluição assepticamente, rotula a solução e realiza antissepsia antes da punção.",
   tec:"Punciona com scalp, confirma refluxo, fixa, instala a infusão e controla o gotejamento na velocidade autorizada.",
   seg:"Verifica sinais vitais antes e durante, observa extravasamento e sinais de reação, e mantém o paciente em observação após o término.",
   anot:"Descarta corretamente; registra medicamento, diluição, velocidade, local de punção, sinais vitais, reações e conduta."
  }},
 {n:4, nome:"Sondagem nasoenteral",
  caso:"Paciente A.M.L., 65 anos, pós-AVE isquêmico, disfagia importante, hemiplegia à esquerda, acamado e com perda ponderal. Solicitação: passagem de sonda nasoenteral para alimentação. Tarefa: demonstrar avaliação, preparo, mensuração, introdução e fixação da sonda no simulador.",
  inter:"Após a passagem, o familiar pergunta: “Já podemos começar a dieta? Ele está há muitas horas sem comer.” Pergunta: o que você responde e faz?",
  gab:"Não liberar dieta, água ou medicamentos pela sonda antes da confirmação adequada do posicionamento; seguir o método institucional validado, incluindo radiografia quando indicada para confirmação inicial; aguardar liberação.",
  nota:"Enfatizar prevenção de broncoaspiração. O método de confirmação deve seguir protocolo institucional e diretrizes vigentes.",
  c:{
   presc:"Confere a solicitação e a indicação; avalia narinas, nível de consciência e fatores de risco antes de iniciar.",
   mat:"Sonda nasoenteral com fio-guia, lubrificante hidrossolúvel, seringa, gaze, luvas, fita para marcação e fixação, estetoscópio, toalha e biombo.",
   prep:"Eleva a cabeceira (Fowler alto), posiciona a cabeça com leve flexão e garante privacidade.",
   asep:"Mantém a sonda limpa durante o manuseio e o lubrificante sem contaminação (técnica limpa).",
   tec:"Mensura conforme protocolo, marca a sonda, lubrifica, introduz com delicadeza estimulando deglutição se possível e fixa sem tracionar a narina.",
   seg:"Interrompe se houver tosse, cianose ou desconforto respiratório; não usa ausculta após insuflação de ar como confirmação; solicita confirmação do posicionamento.",
   anot:"Recolhe o material; registra número da sonda, narina, marcação externa, tolerância, método de confirmação solicitado e orientações à família."
  }},
 {n:5, nome:"Sondagem vesical de alívio feminina",
  caso:"Paciente E.F.J., 42 anos, pós-operatório de reconstrução do ligamento cruzado anterior, submetida à raquianestesia. Sem diurese até o momento e com bexigoma. Solicitação: sondagem vesical de alívio. Tarefa: demonstrar o procedimento em simulador feminino.",
  inter:"Durante a tentativa, você não visualiza o meato urinário e percebe desconforto importante da paciente. Pergunta: como proceder?",
  gab:"Interromper a tentativa; não realizar introduções repetidas ou forçadas; reavaliar posição, iluminação e visualização anatômica; solicitar auxílio quando necessário; preservar privacidade e conforto e registrar a dificuldade.",
  nota:"Avaliar técnica asséptica, identificação anatômica e prevenção de trauma. O roteiro deve ser adaptado ao protocolo institucional.",
  c:{
   presc:"Confere a solicitação, avalia o bexigoma (palpação/percussão) e o tempo sem diurese.",
   mat:"Kit de cateterismo estéril, sonda de alívio de calibre adequado, luvas estéreis, lubrificante estéril, antisséptico, gazes, cuba rim, recipiente graduado, material de higiene íntima e biombo.",
   prep:"Garante privacidade, faz higiene íntima e posiciona a paciente respeitando o membro operado.",
   asep:"Monta o campo estéril, calça luvas estéreis sem contaminar e faz antissepsia no sentido correto, trocando a gaze a cada movimento.",
   tec:"Afasta os pequenos lábios, lubrifica e introduz a sonda sem força até o retorno de urina, drena, retira suavemente e mede o volume.",
   seg:"Não força nem reintroduz sonda contaminada; observa desconforto e drenagem de grande volume conforme protocolo.",
   anot:"Descarta corretamente; registra volume drenado, aspecto da urina, intercorrências e queixas."
  }},
 {n:6, nome:"Sondagem vesical de demora masculina",
  caso:"Paciente M.B., 74 anos, internado em UTI com sepse urinária, necessitando de controle rigoroso do débito urinário. Solicitação: sondagem vesical de demora masculina. Tarefa: demonstrar preparo, inserção da sonda Foley e instalação do sistema coletor.",
  inter:"Após a passagem da sonda, não ocorre drenagem urinária. O paciente demonstra desconforto e dor. Pergunta: o que você faria?",
  gab:"Não insuflar o balonete sem confirmação intravesical; não forçar a progressão; verificar dobras ou obstrução externa; reavaliar posicionamento e retorno; interromper a tentativa e solicitar avaliação/auxílio se houver suspeita de posicionamento inadequado.",
  nota:"Reforçar que o balonete não deve ser insuflado antes da confirmação de posicionamento intravesical. Seguir protocolo institucional.",
  c:{
   presc:"Confere solicitação e indicação; pergunta sobre alergias (inclusive látex) e avalia condições clínicas.",
   mat:"Kit de cateterismo estéril, sonda Foley de calibre adequado, bolsa coletora de sistema fechado, seringa com água destilada, lubrificante estéril, antisséptico, luvas estéreis, gazes e fixação.",
   prep:"Garante privacidade, posiciona em decúbito dorsal e realiza higiene íntima prévia.",
   asep:"Campo e luvas estéreis; antissepsia do meato para a periferia com o prepúcio retraído; conecta o sistema fechado sem contaminar.",
   tec:"Lubrifica a uretra, posiciona o pênis corretamente, introduz sem força até o retorno de urina, insufla o balonete com o volume indicado e traciona suavemente.",
   seg:"Insufla somente após confirmação; reposiciona o prepúcio; fixa a sonda e mantém a bolsa abaixo da bexiga e sem contato com o chão.",
   anot:"Descarta corretamente; registra calibre, volume do balonete, débito e aspecto da urina, intercorrências e data da inserção."
  }},
 {n:7, nome:"Aspiração de traqueostomia",
  caso:"Paciente G.H.J., 38 anos, sequelas de TCE, acamado, traqueostomizado em ar ambiente, com secreção abundante e crepitações pulmonares. Solicitação: avaliar necessidade e demonstrar aspiração de traqueostomia no simulador.",
  inter:"Durante o procedimento, a saturação cai de 96% para 86%, acompanhada de desconforto respiratório. Pergunta: qual sua conduta imediata?",
  gab:"Interromper a aspiração e retirar a sonda; restabelecer oxigenação conforme necessidade e protocolo; avaliar permeabilidade da via aérea e padrão respiratório; monitorar; acionar ajuda; reavaliar antes de nova tentativa e registrar.",
  nota:"Aspiração somente quando clinicamente indicada; limitar duração e monitorar resposta. Não realizar instilação rotineira de solução salina.",
  c:{
   presc:"Avalia a necessidade de aspirar (ausculta, secreção visível, saturação, padrão respiratório) antes de iniciar.",
   mat:"Sonda de aspiração estéril de calibre adequado à cânula, aspirador testado, luva estéril, EPI (óculos, máscara, avental), água/SF para lavar a extensão, oxímetro e fonte de oxigênio.",
   prep:"Eleva a cabeceira, orienta o paciente mesmo que pouco responsivo e monitora a saturação.",
   asep:"Mantém a mão dominante estéril para a sonda e não contamina a sonda durante o procedimento.",
   tec:"Introduz sem aspirar, aspira durante a retirada com movimentos rotatórios respeitando o tempo seguro e o intervalo entre as passagens; lava a extensão ao final.",
   seg:"Monitora saturação e frequência cardíaca, limita o número de passagens e não instila solução salina de rotina.",
   anot:"Descarta corretamente; registra aspecto e quantidade da secreção, saturação antes e depois, tolerância e intercorrências."
  }}
];

export const VAL = { ok: 1, mid: 0.5, bad: 0 } as const;
export const LBL = { ok: 'Correto', mid: 'Parcial', bad: 'Incorreto' } as const;
export type AnsVal = keyof typeof VAL;
export const lbl = (v?: string) => (v && v in LBL ? LBL[v as AnsVal] : 'Não avaliado');
