// No expo-file-system 19 (SDK 54) a API nova virou o entrypoint padrão e não expõe
// mais cacheDirectory/writeAsStringAsync/EncodingType — eles vivem em /legacy.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Envolve o campo em aspas e escapa aspas internas, senão um nome com vírgula
// ("Bolo de cenoura, sem glúten") quebra o alinhamento das colunas.
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/**
 * Adapta a lógica de download de CSV para o ambiente Mobile
 */
export const exportBudgetsToCSV = async (budgets) => {
  try {
    // 1. Filtra orçamentos ativos (seguindo sua lógica de deletedAt)
    const orcamentosAtivos = (Array.isArray(budgets) ? budgets : []).filter(h => !h?.deletedAt);

    if (orcamentosAtivos.length === 0) {
      throw new Error("Nenhum orçamento para exportar.");
    }

    // 2. Cabeçalho do CSV
    let csvContent = "ID,Nome do Produto,Data Criacao,Custo Total,Preço de Venda,Lucro Limpo\n";

    // 3. Monta as linhas (ajustado para a estrutura do seu objeto 'result')
    orcamentosAtivos.forEach(row => {
      const dataFormatada = row.createdAt 
        ? new Date(row.createdAt).toLocaleDateString('pt-BR') 
        : new Date().toLocaleDateString('pt-BR');

      const rowData = [
        csvCell(row.id),
        csvCell(row.nome),
        dataFormatada,
        (row.result?.custoTotal || 0).toFixed(2),
        (row.result?.precoSugeridoTotal || 0).toFixed(2),
        (row.result?.lucro || 0).toFixed(2)
      ];
      csvContent += rowData.join(",") + "\n";
    });

    // 4. Salva no cache directory (compatível com todas as versões do Expo)
    const fileUri = `${FileSystem.cacheDirectory}meus_orcamentos_gestorpro.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    // 5. Dispara a janela nativa de compartilhamento
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar Planilha Excel/CSV' });

  } catch (error) {
    throw error;
  }
};