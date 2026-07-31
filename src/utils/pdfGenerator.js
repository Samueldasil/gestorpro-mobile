import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatMoney, formatDate } from './format';
import { custoInsumo } from './calculator';
import { reportError } from './errorHandler';

// Escapa o que vem do usuário antes de entrar no HTML do relatório.
const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Gera o PDF e abre o menu nativo. Sem a checagem de disponibilidade, aparelhos
// sem app de compartilhamento rejeitavam com um erro nativo indecifrável.
const compartilharPdf = async (htmlContent, dialogTitle) => {
  const podeCompartilhar = await Sharing.isAvailableAsync();
  if (!podeCompartilhar) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle });
};

/**
 * Gera um relatório HTML, salva localmente e abre no navegador padrão.
 * Isso permite que o usuário use a função nativa do navegador para "Salvar como PDF".
 */
export const generateAndPreviewReport = async (orcamento) => {
  if (!orcamento || typeof orcamento !== 'object') {
    throw new Error('Orçamento indisponível para gerar o relatório.');
  }

  const result = orcamento.result || {};
  const insumos = Array.isArray(orcamento.insumos) ? orcamento.insumos : [];
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <!-- Estilos CSS inline para garantir a formatação correta na geração do PDF -->
      <meta charset="utf-8">
      <title>Orçamento GestorPro</title>
      <style>
        body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
        .header p { margin: 5px 0; color: #64748b; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
        .info-box { flex: 1; background: #f8fafc; padding: 15px; border-radius: 12px; text-align: center; }
        .info-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: bold; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f1f5f9; color: #475569; text-align: left; padding: 12px; font-size: 12px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 14px; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #2563eb; text-transform: uppercase; }
        .total-card { background-color: #2563eb; color: white; border-radius: 16px; padding: 25px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .total-main { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GestorPro</h1>
        <p>Relatório Detalhado de Precificação</p>
        <p>Gerado em ${formatDate(orcamento.createdAt || orcamento.created_at || new Date())}</p>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Produto</div>
          <div class="info-value">${esc(orcamento.nome)}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Rendimento</div>
          <div class="info-value">${esc(orcamento.qtdProduto)} ${esc(orcamento.unidadeProduto)}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Custo Operacional</div>
          <div class="info-value">${orcamento.modoCusto === 'automatico' ? 'Automático' : 'Manual'}</div>
        </div>
      </div>

      <div class="section-title">Insumos e Ingredientes</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantidade Usada</th>
            <th>Custo Proporcional</th>
          </tr>
        </thead>
        <tbody>
          ${insumos.map(ing => `
            <tr>
              <td>${esc(ing.nome)}</td>
              <td>${esc(ing.qtdUsada)}${esc(ing.unidadeUsada)}</td>
              <td>${formatMoney(custoInsumo(ing))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-card">
        <div class="total-row">
          <span>Subtotal Insumos:</span>
          <span>${formatMoney(result.custoIngredientes || 0)}</span>
        </div>
        <div class="total-row">
          <span>Custos Operacionais (${orcamento.modoCusto === 'automatico' ? esc(orcamento.tempoPreparo ?? 0) + 'min' : 'Fixo'}):</span>
          <span>${formatMoney(result.valorOperacional || 0)}</span>
        </div>
        <div class="total-row">
          <span>Impostos Aplicados (${esc(orcamento.imposto ?? 0)}%):</span>
          <span>${formatMoney(result.valorImposto || 0)}</span>
        </div>
        <div class="total-main">
          <span>Custo Total:</span>
          <span>${formatMoney(result.custoTotal || 0)}</span>
        </div>
        <div class="total-main" style="color: #facc15; border: none; margin-top: 5px;">
          <span>Preço Sugerido:</span>
          <span>${formatMoney(result.precoSugeridoTotal || 0)}</span>
        </div>
      </div>

      <div class="footer">
        Este documento é uma estimativa de custos gerada pelo aplicativo GestorPro.<br/>
        Os valores podem variar conforme flutuações de mercado.
      </div>
    </body>
    </html>
  `;

  try {
    // O motor nativo pega o HTML e compila em um arquivo .pdf real
    await compartilharPdf(htmlContent, 'Abrir Relatório PDF');
  } catch (error) {
    reportError(error, 'generateAndPreviewReport');
    // Propaga para a tela conseguir avisar o usuário em vez de falhar em silêncio.
    throw error;
  }
};

/**
 * Gera um relatório resumido de todos os orçamentos ativos.
 */
export const generateSummaryPDF = async (budgets) => {
  const orcamentosAtivos = (Array.isArray(budgets) ? budgets : []).filter(b => !b?.deletedAt);

  if (orcamentosAtivos.length === 0) {
    throw new Error('Nenhum orçamento para gerar o relatório.');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #2563eb; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
        .total-row { font-weight: bold; background-color: #f8fafc; }
        .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GestorPro - Resumo de Orçamentos</h1>
        <p>Relatório Consolidado</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Data</th>
            <th>Custo Total</th>
            <th>Preço Venda</th>
            <th>Lucro</th>
          </tr>
        </thead>
        <tbody>
          ${orcamentosAtivos.map(b => `
            <tr>
              <td>${esc(b.nome)}</td>
              <td>${formatDate(b.createdAt || b.created_at)}</td>
              <td>${formatMoney(b.result?.custoTotal || 0)}</td>
              <td>${formatMoney(b.result?.precoSugeridoTotal || 0)}</td>
              <td style="color: ${(b.result?.lucro || 0) >= 0 ? '#16a34a' : '#ef4444'}">
                ${formatMoney(b.result?.lucro || 0)}
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">TOTAL</td>
            <td>${formatMoney(orcamentosAtivos.reduce((acc, b) => acc + (b.result?.custoTotal || 0), 0))}</td>
            <td>${formatMoney(orcamentosAtivos.reduce((acc, b) => acc + (b.result?.precoSugeridoTotal || 0), 0))}</td>
            <td>${formatMoney(orcamentosAtivos.reduce((acc, b) => acc + (b.result?.lucro || 0), 0))}</td>
          </tr>
        </tfoot>
      </table>
      <div class="footer">
        Gerado pelo GestorPro em ${formatDate(new Date())}
      </div>
    </body>
    </html>
  `;

  try {
    // Converte o HTML em PDF real como na função individual
    await compartilharPdf(htmlContent, 'Abrir Resumo PDF');
  } catch (error) {
    reportError(error, 'generateSummaryPDF');
    // Propaga para a tela conseguir avisar o usuário em vez de falhar em silêncio.
    throw error;
  }
};