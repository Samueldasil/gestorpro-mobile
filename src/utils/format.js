/**
 * Formata valores para o padrão brasileiro (IBGE):
 * - Separador de milhares: ponto (.)
 * - Separador decimal: vírgula (,)
 * Exemplo: 1000.50 -> R$ 1.000,50
 */
export function formatMoney(value) {
  const number = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(number)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(number);
}
