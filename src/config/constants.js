/**
 * Constantes centralizadas do aplicativo
 * Evita números mágicos e duplicações
 */

// Validação
export const MIN_PASSWORD_LENGTH = 6;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API
// Salvar orçamento é a requisição mais pesada: precisa de MAIS tempo que o
// padrão, não menos (antes eram 30s, que cortavam o salvamento em servidor frio).
export const API_TIMEOUT_LONG = 90000;     // 90 segundos para orçamentos
export const API_TIMEOUT_DEFAULT = 60000;  // 60 segundos: margem para o servidor acordar (Render free)

// Cálculos
export const MINUTES_PER_HOUR = 60;
export const MONTHS_PER_YEAR = 12;

// UI
export const TOAST_DURATION = 3000;

// Modo de custo
export const MODO_CUSTO = {
  AUTOMATICO: 'automatico',
  MANUAL: 'manual'
};

// Tipo de preço
export const TIPOS_PRECO = [
  { label: 'Receita total', value: 'total' },
  { label: 'por Kg', value: 'kg' },
  { label: 'por Litro', value: 'l' },
  { label: 'por Unidade', value: 'un' }
];

// Unidades
export const UNIDADES_PRODUTO = ['un', 'kg', 'g', 'l', 'ml'];
export const UNIDADES_LOTE = ['kg', 'g', 'l', 'ml', 'un'];
export const UNIDADES_USADA = ['g', 'kg', 'ml', 'l', 'un'];

// Nome por extenso das unidades, usado nas listas de ingredientes.
// Ficava duplicado no BudgetScreen e no HistoryScreen.
export const MAPA_UNIDADES = {
  un: 'Unidades',
  g: 'Gramas',
  kg: 'Quilos',
  ml: 'Mililitros',
  l: 'Litros'
};
