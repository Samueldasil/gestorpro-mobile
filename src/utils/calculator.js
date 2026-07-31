/**
 * Realiza os cálculos de precificação do GestorPro com blindagem nativa
 */

import { toNumber } from './validators';

// Aceita tanto número quanto texto digitado ("12,5"), sem devolver NaN.
const safeNum = (val, fallback = 0) => toNumber(val, fallback);

/**
 * Custo proporcional de um insumo dentro da receita.
 * Protegido contra lote zerado/ausente (evitava NaN e Infinity na tela e no PDF).
 */
export const custoInsumo = (item) => {
  const preco = safeNum(item?.preco, 0);
  const lote = safeNum(item?.qtdLote, 0);
  const usada = safeNum(item?.qtdUsada, 0);
  return lote > 0 ? (preco / lote) * usada : 0;
};

// Fatores para converter o rendimento até a unidade em que o preço foi informado.
const UNIDADES = {
  kg: { grandeza: 'massa', fator: 1 },
  g: { grandeza: 'massa', fator: 0.001 },
  l: { grandeza: 'volume', fator: 1 },
  ml: { grandeza: 'volume', fator: 0.001 },
  un: { grandeza: 'unidade', fator: 1 },
};

/**
 * Converte o rendimento para a unidade do preço de venda.
 * Ex.: 500 g com preço "por Kg" vira 0,5.
 * Retorna null quando as unidades são de grandezas diferentes (ex.: rendimento em
 * "un" com preço "por Kg"), caso em que o preço é tratado como receita total.
 */
const converterRendimento = (qtd, unidadeProduto, unidadePreco) => {
  const origem = UNIDADES[unidadeProduto];
  const destino = UNIDADES[unidadePreco];
  if (!origem || !destino || origem.grandeza !== destino.grandeza) return null;
  return (qtd * origem.fator) / destino.fator;
};

export const calcularOrcamento = (data = {}) => {
  const {
    insumos = [],
    modoCusto = 'automatico',
    tempoPreparo = 0,
    custoManual = 0,
    configGlobal,
    imposto = 0,
    precoVendaValor = 0,
    precoVendaTipo = 'total',
    qtdProduto = 0,
    unidadeProduto = 'un',
  } = data;

  // 1. Custo de Produção (Ingredientes)
  const listaInsumos = Array.isArray(insumos) ? insumos : [];
  const custoIngredientes = listaInsumos.reduce((acc, item) => acc + custoInsumo(item), 0);

  // 2. Custos Fixos (Operacional)
  // configGlobal pode chegar null vindo do AsyncStorage — ler .gas nele quebrava o cálculo.
  const contas = configGlobal && typeof configGlobal === 'object' ? configGlobal : {};

  let valorOperacional = 0;
  if (modoCusto === 'automatico') {
    const totalContas = safeNum(contas.gas, 0) +
                        safeNum(contas.luz, 0) +
                        safeNum(contas.agua, 0);
    const horasMensais = safeNum(contas.horas, 0);
    
    const custoPorMinuto = horasMensais > 0 ? totalContas / (horasMensais * 60) : 0;
    valorOperacional = custoPorMinuto * safeNum(tempoPreparo, 0);
  } else {
    valorOperacional = safeNum(custoManual, 0);
  }

  // O custo real para produzir (apenas materiais e tempo)
  const custoBase = custoIngredientes + valorOperacional;

  // 3. Receita total
  // "Receita total" usa o valor como está; "por Kg/Litro/Unidade" multiplica pelo
  // rendimento convertido para a mesma unidade do preço.
  const precoInformado = safeNum(precoVendaValor, 0);
  let precoSugeridoTotal = precoInformado;

  if (precoVendaTipo && precoVendaTipo !== 'total') {
    const rendimento = safeNum(qtdProduto, 0);
    const rendimentoConvertido =
      rendimento > 0 ? converterRendimento(rendimento, unidadeProduto, precoVendaTipo) : null;

    // Sem rendimento válido (ou unidades incompatíveis) o valor volta a ser a receita total.
    precoSugeridoTotal =
      rendimentoConvertido === null ? precoInformado : precoInformado * rendimentoConvertido;
  }

  // 4. Imposto e Lucro

  // CORREÇÃO DA REGRA DE NEGÓCIOS: Imposto se calcula sobre a Venda, não sobre a Produção!
  // Se o usuário ainda não colocou preço de venda, consideramos o imposto provisório como 0 para não assustar.
  const valorImposto = precoSugeridoTotal > 0 
    ? precoSugeridoTotal * (safeNum(imposto, 0) / 100) 
    : 0;

  // O custo total agora embute a despesa com imposto (se houver venda definida)
  const custoTotal = custoBase + valorImposto;

  // Lucro líquido: Faturamento - Gastos Produção - Despesa de Impostos
  const lucro = precoSugeridoTotal > 0 ? (precoSugeridoTotal - custoTotal) : 0;

  return {
    custoIngredientes, 
    valorOperacional, 
    valorImposto,
    custoTotal, 
    precoSugeridoTotal, 
    lucro
  };
};