/**
 * Testes da lógica de precificação — sem framework e sem dependências.
 *
 * Rode com: npm test
 *
 * O app é uma calculadora de preço de venda: um erro de conta aqui não trava
 * nada, só devolve um número errado com toda a aparência de estar certo. Foi
 * exatamente o que aconteceu com o rateio por unidade (500 g de um lote de
 * 1 kg viravam 500 lotes). Estes testes existem para esse tipo de falha não
 * passar de novo em silêncio.
 */
import { custoInsumo, calcularOrcamento, resolverResultado, custoOperacionalPorMinuto } from '../src/utils/calculator.js';
import { toNumber, sanitizeNumberInput, validateInsumo } from '../src/utils/validators.js';
import { calculateTotals, calculateMonthlyProfit, calculateStatistics, somenteAtivos } from '../src/utils/calculationHelpers.js';
import { formatMoney, formatDate } from '../src/utils/format.js';

let ok=0, fail=0;
const eq=(n,r,e)=>{const b=typeof e==='number'?Math.abs(r-e)<1e-9:r===e;
  console.log(`${b?'  ok ':'FALHA'}  ${n}${b?'':`\n         obtido=${JSON.stringify(r)} esperado=${JSON.stringify(e)}`}`); if (b) ok++; else fail++;};
const sec=(t)=>console.log(`\n--- ${t} ---`);

sec('custoInsumo: conversao de unidades (bug principal)');
eq('500 g de lote de 1 kg a R$20', custoInsumo({preco:20,qtdLote:1,unidadeLote:'kg',qtdUsada:500,unidadeUsada:'g'}), 10);
eq('250 ml de lote de 1 l a R$8', custoInsumo({preco:8,qtdLote:1,unidadeLote:'l',qtdUsada:250,unidadeUsada:'ml'}), 2);
eq('2 kg de lote de 5000 g a R$50', custoInsumo({preco:50,qtdLote:5000,unidadeLote:'g',qtdUsada:2,unidadeUsada:'kg'}), 20);
eq('unidades iguais', custoInsumo({preco:24,qtdLote:12,unidadeLote:'un',qtdUsada:3,unidadeUsada:'un'}), 6);
eq('grandezas incompativeis -> rateio simples', custoInsumo({preco:10,qtdLote:2,unidadeLote:'kg',qtdUsada:1,unidadeUsada:'un'}), 5);
eq('lote zero nao vira Infinity', custoInsumo({preco:10,qtdLote:0,unidadeLote:'kg',qtdUsada:1,unidadeUsada:'g'}), 0);
eq('valores em texto BR', custoInsumo({preco:'20,00',qtdLote:'1',unidadeLote:'kg',qtdUsada:'500',unidadeUsada:'g'}), 10);

sec('custoOperacionalPorMinuto (fonte unica da previa e do calculo)');
eq('300/mes em 150h', custoOperacionalPorMinuto({gas:'90',luz:'150',agua:'60',horas:'150'}), 300/9000);
eq('sem horas nao divide por zero', custoOperacionalPorMinuto({gas:'90',horas:'0'}), 0);
eq('config nula', custoOperacionalPorMinuto(null), 0);

sec('resolverResultado: recalcula a partir das entradas gravadas');
const salvo = {
  id:1, nome:'Bolo',
  insumos:[{preco:20,qtdLote:1,unidadeLote:'kg',qtdUsada:500,unidadeUsada:'g'}],
  modoCusto:'automatico', tempoPreparo:60,
  configGlobal:{gas:'90',luz:'150',agua:'60',horas:'150'},
  imposto:0, precoVendaValor:100, precoVendaTipo:'total',
  result:{ custoIngredientes:'10000', custoTotal:'10002', lucro:'-9902' },  // valor errado do servidor
};
const r = resolverResultado(salvo);
eq('ignora o result errado do servidor', r.custoIngredientes, 10);
eq('custo operacional recalculado', r.valorOperacional, 2);
eq('custoTotal', r.custoTotal, 12);
eq('lucro', r.lucro, 88);
eq('cache devolve a MESMA instancia', resolverResultado(salvo) === r, true);

sec('resolverResultado: sem dados para recalcular');
const semInsumos = { result:{ custoTotal:'55.5', precoSugeridoTotal:'80', lucro:'24.5' } };
eq('cai no result do servidor (convertido)', resolverResultado(semInsumos).custoTotal, 55.5);
eq('lucro do servidor', resolverResultado(semInsumos).lucro, 24.5);
eq('orcamento nulo nao quebra', resolverResultado(null).custoTotal, 0);

sec('resolverResultado: guardas contra zerar dado correto do servidor');
const semPrecoDeVenda = {
  insumos:[{preco:20,qtdLote:1,unidadeLote:'kg',qtdUsada:500,unidadeUsada:'g'}],
  modoCusto:'manual', custoManual:5,
  result:{ custoTotal:'99', precoSugeridoTotal:'150', lucro:'51' },
};
eq('sem precoVendaValor usa o servidor inteiro', resolverResultado(semPrecoDeVenda).precoSugeridoTotal, 150);
eq('...e nao zera o lucro', resolverResultado(semPrecoDeVenda).lucro, 51);

const manualSemCusto = {
  insumos:[{preco:20,qtdLote:1,unidadeLote:'kg',qtdUsada:500,unidadeUsada:'g'}],
  modoCusto:'manual', precoVendaValor:100, precoVendaTipo:'total', imposto:0,
  result:{ valorOperacional:'7.50' },   // custoManual nao voltou do servidor
};
eq('modo manual sem custoManual reaproveita o rateio', resolverResultado(manualSemCusto).valorOperacional, 7.5);
eq('...e soma certo com o insumo corrigido', resolverResultado(manualSemCusto).custoTotal, 17.5);

const autoSemTempo = {
  insumos:[{preco:20,qtdLote:1,unidadeLote:'kg',qtdUsada:500,unidadeUsada:'g'}],
  modoCusto:'automatico', configGlobal:{gas:'90',luz:'150',agua:'60',horas:'150'},
  precoVendaValor:100, precoVendaTipo:'total', imposto:0,
  result:{ valorOperacional:'3.00' },   // tempoPreparo nao voltou
};
eq('automatico sem tempoPreparo reaproveita o rateio', resolverResultado(autoSemTempo).valorOperacional, 3);

sec('resolverResultado: sem configGlobal preserva o rateio do servidor');
const semConfig = {
  insumos:[{preco:20,qtdLote:1,unidadeLote:'kg',qtdUsada:500,unidadeUsada:'g'}],
  modoCusto:'automatico', tempoPreparo:60, imposto:0, precoVendaValor:100, precoVendaTipo:'total',
  result:{ valorOperacional:'2.00' },
};
eq('reaproveita valorOperacional', resolverResultado(semConfig).valorOperacional, 2);
eq('custoTotal usa o insumo corrigido + rateio do servidor', resolverResultado(semConfig).custoTotal, 12);

sec('preco por unidade de medida');
eq('500 g a R$40/kg', calcularOrcamento({insumos:[],modoCusto:'manual',custoManual:'0',precoVendaValor:'40',precoVendaTipo:'kg',qtdProduto:'500',unidadeProduto:'g'}).precoSugeridoTotal, 20);
eq('2 kg a R$40/kg', calcularOrcamento({insumos:[],modoCusto:'manual',custoManual:'0',precoVendaValor:'40',precoVendaTipo:'kg',qtdProduto:'2',unidadeProduto:'kg'}).precoSugeridoTotal, 80);
eq('grandeza incompativel -> receita total', calcularOrcamento({insumos:[],modoCusto:'manual',custoManual:'0',precoVendaValor:'10',precoVendaTipo:'kg',qtdProduto:'3',unidadeProduto:'un'}).precoSugeridoTotal, 10);

sec('imposto sobre a venda');
const comImposto = calcularOrcamento({insumos:[],modoCusto:'manual',custoManual:'10',imposto:'7,65',precoVendaValor:'100',precoVendaTipo:'total'});
eq('valorImposto', comImposto.valorImposto, 7.65);
eq('custoTotal embute imposto', comImposto.custoTotal, 17.65);
eq('lucro', comImposto.lucro, 82.35);
eq('sem preco de venda, imposto fica 0', calcularOrcamento({insumos:[],modoCusto:'manual',custoManual:'10',imposto:'20'}).valorImposto, 0);

sec('agregados com dados do servidor em texto');
const lista=[
  {insumos:[],result:{custoTotal:'123.45',precoSugeridoTotal:'200.00',lucro:'76.55'}},
  {insumos:[],result:{custoTotal:'67.89',precoSugeridoTotal:'100.00',lucro:'32.11'}},
  {insumos:[],result:{custoTotal:'999',lucro:'999'},deletedAt:'2020-01-01'},
];
const st=calculateStatistics(lista);
eq('somenteAtivos', somenteAtivos(lista).length, 2);
eq('totalCusto soma (nao concatena)', st.totalCusto, 191.34);
eq('totalLucro', st.totalLucro, 108.66);
eq('excluidos fora da contagem', st.totalCount, 2);
eq('prejuizo negativo em texto', calculateTotals([{insumos:[],result:{lucro:'-50.5'}}]).totalLucro, -50.5);

sec('serie mensal');
const meses=calculateMonthlyProfit([
  {createdAt:new Date().toISOString(),insumos:[],result:{lucro:'10.5'}},
  {createdAt:new Date().toISOString(),insumos:[],result:{lucro:'4.5'}},
  {createdAt:new Date().toISOString(),insumos:[],result:{lucro:'999'},deletedAt:'x'},
  {createdAt:'data-invalida',insumos:[],result:{lucro:'1'}},
  {createdAt:'1990-05-01',insumos:[],result:{lucro:'1'}},
]);
eq('12 meses', meses.length, 12);
eq('mes atual so com ativos e datas validas', meses[11].profit, 15);
eq('rotulo do mes preenchido', typeof meses[0].label === 'string' && meses[0].label.length>0, true);

sec('entrada e formatacao BR');
eq('digitando "10,"', sanitizeNumberInput('10,'), '10,');
eq('digitando "10,5"', sanitizeNumberInput('10,5'), '10,5');
eq('colando "1.234,56"', sanitizeNumberInput('1.234,56'), '1234,56');
eq('descarta letras', sanitizeNumberInput('abc12x,3'), '12,3');
eq('descarta sinal negativo na UI', sanitizeNumberInput('-5'), '5');
eq('toNumber("1.234,56")', toNumber('1.234,56'), 1234.56);
eq('toNumber("-30,9") mantem sinal', toNumber('-30,9'), -30.9);
eq('toNumber("") -> fallback', toNumber('', 7), 7);
eq('toNumber(NaN) -> fallback', toNumber(NaN, 3), 3);
eq('formatMoney texto', formatMoney('1234.5'), 'R$ 1.234,50');
eq('formatMoney negativo', formatMoney(-12.3), '-R$ 12,30');
eq('formatMoney lixo', formatMoney('abc'), 'R$ 0,00');
eq('formatDate invalida', formatDate('nao-e-data'), '—');

sec('validacao de insumo');
eq('preco 0 e aceito (ingrediente doado)', validateInsumo({nome:'Sal',preco:0,qtdLote:1,qtdUsada:1}), null);
eq('lote 0 e rejeitado', validateInsumo({nome:'Sal',preco:1,qtdLote:0,qtdUsada:1}), 'A quantidade do lote deve ser maior que zero');
eq('nome vazio', validateInsumo({nome:'  ',preco:1,qtdLote:1,qtdUsada:1}), 'Nome do ingrediente é obrigatório');
eq('preco ausente', validateInsumo({nome:'Sal',preco:'',qtdLote:1,qtdUsada:1}), 'Preço do ingrediente é obrigatório');

console.log(`\n========  ${ok} passaram, ${fail} falharam  ========`);
// `process.exitCode` em vez de `process.exit()`: sair na hora abortaria a
// limpeza da pasta temporária feita pelo runner.
process.exitCode = fail ? 1 : 0;
