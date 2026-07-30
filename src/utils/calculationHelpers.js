/**
 * Helpers para cálculos agregados
 * Evita cálculos repetitivos dentro de templates
 */

/**
 * Calcula totais agregados de um array de orçamentos
 * @param {array} budgets - Array de orçamentos
 * @returns {object} - Objeto com totais
 */
export const calculateTotals = (budgets = []) => {
  return {
    totalCusto: budgets.reduce((acc, b) => acc + (b.result?.custoTotal || 0), 0),
    totalPreco: budgets.reduce((acc, b) => acc + (b.result?.precoSugeridoTotal || 0), 0),
    totalLucro: budgets.reduce((acc, b) => acc + (b.result?.lucro || 0), 0),
    totalCount: budgets.length,
    activeBudgets: budgets.filter(b => !b.deletedAt).length,
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

  for (let i = 11; i >= 0; i--) {
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
  
  return {
    ...totals,
    totalProfitMonths: monthlyData,
    maxMonthlyProfit: Math.max(...monthlyData.map(m => m.profit), 1),
    averageMonthlyProfit: monthlyData.length > 0 
      ? monthlyData.reduce((acc, m) => acc + m.profit, 0) / monthlyData.length
      : 0,
  };
};

/**
 * Agrupa budgets por período (mês/ano)
 * @param {array} budgets 
 * @returns {object}
 */
export const groupByPeriod = (budgets = []) => {
  return budgets.reduce((acc, budget) => {
    const date = new Date(budget.createdAt || budget.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(budget);
    return acc;
  }, {});
};
