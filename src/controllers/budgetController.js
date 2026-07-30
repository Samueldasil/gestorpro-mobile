import { saveBudgetService } from '../services/budgetService';

/**
 * Controller para lógica de salvar orçamento
 * Faz validações e chama o service responsável
 */
export async function saveBudgetController(payload, token) {
  if (!token) {
    const err = new Error('Você precisa estar logado para salvar.');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }

  if (!payload || !payload.nomeProduto || !String(payload.nomeProduto).trim()) {
    const err = new Error('Informe o nome do produto.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!Array.isArray(payload.insumos) || payload.insumos.length === 0) {
    const err = new Error('Adicione pelo menos um ingrediente.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Preflight: ensure numeric fields are numbers
  payload.qtdProduto = Number(payload.qtdProduto) || 0;
  payload.precoVendaValor = Number(payload.precoVendaValor) || 0;
  payload.imposto = Number(payload.imposto) || 0;
  payload.tempoPreparo = Number(payload.tempoPreparo) || 0;
  payload.custoManual = Number(payload.custoManual) || 0;

  // Delegate to service
  const response = await saveBudgetService(payload, token);
  return response;
}

export default {
  saveBudgetController,
};
