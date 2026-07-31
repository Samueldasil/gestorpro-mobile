/**
 * Helpers para cálculos agregados
 * Evita cálculos repetitivos dentro de templates
 */

import { MONTHS_PER_YEAR } from '../config/constants';

/**
 * Calcula totais agregados de um array de orçamentos
 * @param {array} budgets - Array de orçamentos
 * @returns {object} - Objeto com totais
 */
export const calculateTotals = (budgets = []) => {
  // Antes eram quatro varreduras do array (3 reduce + 1 filter) para
  // produzir cinco números. Agora é uma só.
  let totalCusto = 0;
  let totalPreco = 0;
  let totalLucro = 0;
  let activeBudgets = 0;

  budgets.forEach((b) => {
    const result = b?.result;
    totalCusto += result?.custoTotal || 0;
    totalPreco += result?.precoSugeridoTotal || 0;
    totalLucro += result?.lucro || 0;
    if (!b?.deletedAt) activeBudgets += 1;
  });

  return {
    totalCusto,
    totalPreco,
    totalLucro,
    totalCount: budgets.length,
    activeBudgets,
  };
};

/**
 * Calcula totais apenas de orçamentos não deletados
 * @param {array} budgets 
 * @returns {object}
 */
export const calculateActiveTotals = (budgets = []) => {
  const active = budgets.filter(b => !b.deletedAt);
  return calculateTotals(active);
};

/**
 * Calcula dados de lucro por mês (últimos 12 meses)
 * @param {array} budgets 
 * @returns {array}
 */
export const calculateMonthlyProfit = (budgets = []) => {
  const now = new Date();
  const months = [];

  for (let i = MONTHS_PER_YEAR - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
      profit: 0,
    });
  }

  // Blindagem: budgets pode vir null/undefined e as datas do servidor podem ser inválidas.
  const safeBudgets = Array.isArray(budgets) ? budgets : [];

  safeBudgets.forEach(b => {
    if (b?.deletedAt) return;

    const date = new Date(b?.createdAt || b?.created_at);
    if (!Number.isFinite(date.getTime())) return;

    const monthIndex = months.findIndex(
      m => m.year === date.getFullYear() && m.month === date.getMonth()
    );
    if (monthIndex === -1) return;

    const lucro = Number(b?.result?.lucro ?? b?.lucro);
    months[monthIndex].profit += Number.isFinite(lucro) ? lucro : 0;
  });

  return months;
};

/**
 * Calcula estatísticas para um conjunto de budgets
 * @param {array} budgets 
 * @returns {object}
 */
export const calculateStatistics = (budgets = []) => {
  const monthlyData = calculateMonthlyProfit(budgets);
  const totals = calculateActiveTotals(budgets);
  
  // Uma passada só no lugar de três varreduras (map + spread + reduce).
  let maxMonthlyProfit = 1;
  let somaLucros = 0;
  monthlyData.forEach((m) => {
    somaLucros += m.profit;
    if (m.profit > maxMonthlyProfit) maxMonthlyProfit = m.profit;
  });

  return {
    ...totals,
    totalProfitMonths: monthlyData,
    maxMonthlyProfit,
    averageMonthlyProfit: monthlyData.length > 0 ? somaLucros / monthlyData.length : 0,
  };
};
