// No expo-file-system 19 (SDK 54) a API nova virou o entrypoint padrão e não expõe
// mais cacheDirectory/writeAsStringAsync/EncodingType — eles vivem em /legacy.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { formatDate } from './format';

// Envolve o campo em aspas e escapa aspas internas, senão um nome com vírgula
// ("Bolo de cenoura, sem glúten") quebra o alinhamento das colunas.
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const csvNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '0.00';
};

/**
 * Adapta a lógica de download de CSV para o ambiente Mobile
 */
export const exportBudgetsToCSV = async (budgets) => {
  // 1. Filtra orçamentos ativos (seguindo sua lógica de deletedAt)
  const orcamentosAtivos = (Array.isArray(budgets) ? budgets : []).filter(h => !h?.deletedAt);

  if (orcamentosAtivos.length === 0) {
    throw new Error('Nenhum orçamento para exportar.');
  }

  // Compartilhamento indisponível (emulador sem apps, permissão negada) rejeitava
  // com um erro nativo incompreensível — melhor avisar antes de gerar o arquivo.
  const podeCompartilhar = await Sharing.isAvailableAsync();
  if (!podeCompartilhar) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  // 2. Cabeçalho do CSV (BOM na frente para o Excel abrir os acentos corretamente)
  let csvContent = '﻿ID,Nome do Produto,Data Criacao,Custo Total,Preco de Venda,Lucro Liquido\n';

  // 3. Monta as linhas (ajustado para a estrutura do seu objeto 'result')
  orcamentosAtivos.forEach(row => {
    const rowData = [
      csvCell(row?.id),
      csvCell(row?.nome),
      csvCell(formatDate(row?.createdAt || row?.created_at, '')),
      csvNumber(row?.result?.custoTotal),
      csvNumber(row?.result?.precoSugeridoTotal),
      csvNumber(row?.result?.lucro)
    ];
    csvContent += rowData.join(',') + '\n';
  });

  // 4. Salva no cache directory (compatível com todas as versões do Expo)
  const fileUri = `${FileSystem.cacheDirectory}meus_orcamentos_gestorpro.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

  // 5. Dispara a janela nativa de compartilhamento
  await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar Planilha Excel/CSV' });
};
