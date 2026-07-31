import { saveBudgetService } from '../services/budgetService';
import { toNumber } from '../utils/validators';

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

  // Preflight: ensure numeric fields are numbers.
  // Cópia em vez de mutação: alterar o objeto do chamador mudava o estado da
  // tela por baixo dos panos.
  const payloadNormalizado = {
    ...payload,
    qtdProduto: toNumber(payload.qtdProduto),
    precoVendaValor: toNumber(payload.precoVendaValor),
    imposto: toNumber(payload.imposto),
    tempoPreparo: toNumber(payload.tempoPreparo),
    custoManual: toNumber(payload.custoManual),
    insumos: payload.insumos.map((insumo) => ({
      ...insumo,
      preco: toNumber(insumo?.preco),
      qtdLote: toNumber(insumo?.qtdLote),
      qtdUsada: toNumber(insumo?.qtdUsada),
    })),
  };

  // Delegate to service
  const response = await saveBudgetService(payloadNormalizado, token);
  return response;
}

export default {
  saveBudgetController,
};
