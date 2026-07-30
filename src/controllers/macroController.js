import { calculateStatistics } from '../utils/calculationHelpers';
import { exportBudgetsToCSV } from '../utils/csvExporter';
import { generateSummaryPDF } from '../utils/pdfGenerator';

export function getMacroSummary(budgets = []) {
  const stats = calculateStatistics(budgets);
  return {
    totalRevenue: stats.totalPreco || 0,
    totalCost: stats.totalCusto || 0,
    totalProfit: stats.totalLucro || 0,
    totalBudgets: stats.totalCount || 0,
    monthlyData: stats.totalProfitMonths || []
  };
}

export async function exportCSV(budgets = []) {
  return exportBudgetsToCSV(budgets);
}

export async function generatePDF(budgets = []) {
  return generateSummaryPDF(budgets);
}

export default {
  getMacroSummary,
  exportCSV,
  generatePDF
};
