/**
 * Testes de ARQUITETURA — sem framework e sem dependências.
 *
 * Rode com: npm test
 *
 * Regra escrita numa documentação é regra que alguém esquece de ler. Estas
 * verificações transformam as invariantes estruturais do projeto em falha de
 * build: se a próxima alteração romper a direção das dependências, o `npm test`
 * avisa antes do código chegar ao aparelho.
 *
 * A invariante mais importante é a primeira. É ela que permite testar todo o
 * cálculo de precificação sem React Native, sem framework e sem instalar nada —
 * no dia em que um `utils/` importar uma tela, isso acaba.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

// O runner copia os módulos para uma pasta temporária (com os imports
// reescritos) antes de executar. Estas verificações precisam do código ORIGINAL,
// então usam o caminho que o runner informa; ao rodar o arquivo direto pelo
// node, o caminho relativo continua valendo.
const RAIZ = process.env.GESTORPRO_RAIZ || path.resolve(import.meta.dirname, '..');
const SRC = path.join(RAIZ, 'src');

let ok = 0;
let fail = 0;

const verificar = (nome, problemas) => {
  const passou = problemas.length === 0;
  console.log(`${passou ? '  ok ' : 'FALHA'}  ${nome}`);
  if (!passou) problemas.forEach((p) => console.log(`         ${p}`));
  if (passou) ok++;
  else fail++;
};

// --- coleta ---------------------------------------------------------------

const listarArquivos = (dir) => {
  const encontrados = [];
  for (const entrada of readdirSync(dir)) {
    const alvo = path.join(dir, entrada);
    if (statSync(alvo).isDirectory()) encontrados.push(...listarArquivos(alvo));
    else if (entrada.endsWith('.js')) encontrados.push(alvo);
  }
  return encontrados;
};

const arquivos = [
  ...listarArquivos(SRC),
  path.join(RAIZ, 'App.js'),
  path.join(RAIZ, 'index.js'),
];

/** Importações relativas de um arquivo, já resolvidas para caminho do projeto. */
const importesDe = (arquivo) => {
  const codigo = readFileSync(arquivo, 'utf8');
  return [...codigo.matchAll(/from\s+'(\.[^']+)'/g)].map((m) =>
    path.relative(RAIZ, path.resolve(path.dirname(arquivo), m[1]))
  );
};

const camadaDe = (relativo) => {
  const partes = relativo.split(path.sep);
  if (partes[0] !== 'src') return 'raiz';
  return partes.length > 2 ? partes[1] : 'src';
};

const mapa = arquivos.map((abs) => ({
  arquivo: path.relative(RAIZ, abs),
  camada: camadaDe(path.relative(RAIZ, abs)),
  importa: importesDe(abs),
}));

// --- invariantes ----------------------------------------------------------

console.log('\n--- arquitetura: direção das dependências ---');

// 1. O núcleo não conhece a interface.
const NUCLEO = ['utils', 'services', 'controllers', 'config', 'api'];
const UI = ['screens', 'components'];
verificar(
  'núcleo (utils/services/controllers/config/api) não importa telas nem componentes',
  mapa
    .filter((m) => NUCLEO.includes(m.camada))
    .flatMap((m) =>
      m.importa
        .filter((alvo) => UI.includes(camadaDe(alvo)))
        .map((alvo) => `${m.arquivo} importa ${alvo}`)
    )
);

// 2. Componentes são folhas de apresentação: não falam com a rede.
verificar(
  'components não fala direto com a API',
  mapa
    .filter((m) => m.camada === 'components')
    .flatMap((m) =>
      m.importa
        .filter((alvo) => alvo.includes(`src${path.sep}api`))
        .map((alvo) => `${m.arquivo} importa ${alvo}`)
    )
);

// 3. Sem ciclos de import.
const grafo = new Map(
  mapa.map((m) => [
    m.arquivo,
    m.importa.map((a) => (a.endsWith('.js') ? a : `${a}.js`)),
  ])
);
const ciclos = [];
const percorrer = (no, caminho) => {
  if (caminho.includes(no)) {
    ciclos.push([...caminho.slice(caminho.indexOf(no)), no].join(' -> '));
    return;
  }
  for (const vizinho of grafo.get(no) ?? []) percorrer(vizinho, [...caminho, no]);
};
for (const no of grafo.keys()) percorrer(no, []);
verificar('nenhum ciclo de import', [...new Set(ciclos)]);

console.log('\n--- arquitetura: fonte única ---');

// 4. Cores só saem da paleta.
verificar(
  'nenhuma cor hexadecimal fora de src/config/theme.js',
  arquivos
    .filter((a) => !a.endsWith(path.join('config', 'theme.js')))
    .flatMap((abs) => {
      const relativo = path.relative(RAIZ, abs);
      return readFileSync(abs, 'utf8')
        .split('\n')
        .flatMap((linha, i) =>
          /#[0-9a-fA-F]{3,8}\b/.test(linha) ? [`${relativo}:${i + 1}  ${linha.trim().slice(0, 70)}`] : []
        );
    })
);

// 5. O resultado de um orçamento salvo passa por `resolverResultado`.
//    Ler `.result` direto do servidor foi o que fazia a tela mostrar um número
//    e o PDF mostrar outro para o mesmo orçamento.
verificar(
  'ninguém lê `.result` do servidor direto (use resolverResultado)',
  arquivos
    .filter((a) => !a.endsWith(path.join('utils', 'calculator.js')))
    .flatMap((abs) => {
      const relativo = path.relative(RAIZ, abs);
      return readFileSync(abs, 'utf8')
        .split('\n')
        .flatMap((linha, i) =>
          /\b(budget|item|orcamento|b|row)\??\.result\b/.test(linha) && !linha.trim().startsWith('*')
            ? [`${relativo}:${i + 1}  ${linha.trim().slice(0, 70)}`]
            : []
        );
    })
);

// 6. Campos numéricos da tela usam o normalizador brasileiro.
verificar(
  'nenhum campo de texto usa o sanitizador de cálculo (deve usar sanitizeNumberInput)',
  arquivos
    .filter((a) => a.includes(`src${path.sep}screens`) || a.includes(`src${path.sep}components`))
    .flatMap((abs) => {
      const relativo = path.relative(RAIZ, abs);
      return readFileSync(abs, 'utf8')
        .split('\n')
        .flatMap((linha, i) =>
          /\bsanitizeNumber\s*\(/.test(linha) ? [`${relativo}:${i + 1}`] : []
        );
    })
);

console.log('\n--- interface: armadilhas conhecidas do Android ---');

const arquivosDeUI = arquivos.filter(
  (a) => a.includes(`src${path.sep}screens`) || a.includes(`src${path.sep}components`) || a.endsWith('App.js')
);

/** Roda um teste linha a linha sobre os arquivos de interface. */
const varrerUI = (nome, aceita, arquivosAlvo = arquivosDeUI) =>
  verificar(
    nome,
    arquivosAlvo.flatMap((abs) => {
      const relativo = path.relative(RAIZ, abs);
      const conteudo = readFileSync(abs, 'utf8');
      return aceita(conteudo, relativo);
    })
  );

// Um Modal sem `onRequestClose` PRENDE o usuário no Android: o botão físico
// Voltar não faz nada e a única saída é fechar o app. Já aconteceu aqui.
varrerUI('todo <Modal> declara onRequestClose', (conteudo, relativo) =>
  [...conteudo.matchAll(/<Modal\b([\s\S]*?)>/g)]
    .filter((m) => !/onRequestClose/.test(m[1]))
    .map(() => `${relativo}: <Modal> sem onRequestClose`)
);

// Sem `keyExtractor` a FlatList usa o índice como chave: ao remover um item, o
// React reaproveita a linha e mostra o conteúdo errado.
varrerUI('toda <FlatList> declara keyExtractor', (conteudo, relativo) =>
  [...conteudo.matchAll(/<FlatList\b([\s\S]*?)\/>/g)]
    .filter((m) => !/keyExtractor/.test(m[1]))
    .map(() => `${relativo}: <FlatList> sem keyExtractor`)
);

// Há registro de crash do Yoga com `gap` neste projeto (ver MacroScreen).
// O espaçamento aqui é feito por margem.
varrerUI('nenhum `gap` no StyleSheet', (conteudo, relativo) =>
  conteudo
    .split('\n')
    .flatMap((linha, i) =>
      /^\s*(gap|rowGap|columnGap):/.test(linha) ? [`${relativo}:${i + 1}  ${linha.trim()}`] : []
    )
);

// Tela ou componente sem `memo` é redesenhado a cada toast e a cada tecla
// digitada em qualquer formulário, porque o App re-renderiza inteiro.
varrerUI(
  'toda tela e componente exporta memo',
  (conteudo, relativo) =>
    /export default (memo|class)|export default function App/.test(conteudo)
      ? []
      : [`${relativo}: export default sem memo`],
  arquivosDeUI.filter((a) => !a.endsWith('App.js'))
);

console.log(`\n========  arquitetura: ${ok} passaram, ${fail} falharam  ========`);
process.exitCode = fail ? 1 : 0;
