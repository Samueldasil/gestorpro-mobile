/**
 * PLANILHA TRIBUTÁRIA NACIONAL (Regime Especial + Federal)
 *
 * Dado estático, extraído do BudgetScreen: mantinha 30 linhas de tabela
 * misturadas com a lógica da tela e era recriado a cada import do módulo.
 */

export const FEDERAL_TAX = 3.65; // PIS + COFINS

const ALIQUOTAS = [
  { uf: 'AC', nome: 'Acre', taxa: 3.5 },
  { uf: 'AL', nome: 'Alagoas', taxa: 4.0 },
  { uf: 'AP', nome: 'Amapá', taxa: 3.0 },
  { uf: 'AM', nome: 'Amazonas', taxa: 3.2 },
  { uf: 'BA', nome: 'Bahia', taxa: 4.0 },
  { uf: 'CE', nome: 'Ceará', taxa: 3.2 },
  { uf: 'DF', nome: 'Distrito Federal', taxa: 2.0 },
  { uf: 'ES', nome: 'Espírito Santo', taxa: 3.2 },
  { uf: 'GO', nome: 'Goiás', taxa: 7.0 },
  { uf: 'MA', nome: 'Maranhão', taxa: 3.0 },
  { uf: 'MT', nome: 'Mato Grosso', taxa: 3.2 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', taxa: 3.2 },
  { uf: 'MG', nome: 'Minas Gerais', taxa: 3.0 },
  { uf: 'PA', nome: 'Pará', taxa: 4.0 },
  { uf: 'PB', nome: 'Paraíba', taxa: 4.0 },
  { uf: 'PR', nome: 'Paraná', taxa: 3.2 },
  { uf: 'PE', nome: 'Pernambuco', taxa: 4.0 },
  { uf: 'PI', nome: 'Piauí', taxa: 4.0 },
  { uf: 'RJ', nome: 'Rio de Janeiro', taxa: 3.0 },
  { uf: 'RN', nome: 'Rio Grande do Norte', taxa: 4.0 },
  { uf: 'RS', nome: 'Rio Grande do Sul', taxa: 4.8 },
  { uf: 'RO', nome: 'Rondônia', taxa: 3.2 },
  { uf: 'RR', nome: 'Roraima', taxa: 4.0 },
  { uf: 'SC', nome: 'Santa Catarina', taxa: 3.2 },
  { uf: 'SP', nome: 'São Paulo', taxa: 4.0 },
  { uf: 'SE', nome: 'Sergipe', taxa: 4.0 },
  { uf: 'TO', nome: 'Tocantins', taxa: 4.0 }
];

// O total (estadual + federal) era recalculado com toFixed dentro do render de
// cada linha, a cada abertura do modal. Agora é pré-computado uma vez só.
export const ESTADOS_TAXAS = ALIQUOTAS.map((estado) => ({
  ...estado,
  totalFormatado: (estado.taxa + FEDERAL_TAX).toFixed(2)
}));
