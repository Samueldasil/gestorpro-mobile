import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatMoney, formatDate } from '../utils/format';
import { exportBudgetsToCSV } from '../utils/csvExporter';
import { generateAndPreviewReport, generateSummaryPDF } from '../utils/pdfGenerator';
import { reportError } from '../utils/errorHandler';
import { toNumber } from '../utils/validators';

// Dicionário visual para deixar a lista de ingredientes elegante
const MAPA_UNIDADES = {
  un: 'Unidades',
  g: 'Gramas',
  kg: 'Quilos',
  ml: 'Mililitros',
  l: 'Litros'
};

export default function HistoryScreen({
  budgets,
  loading,
  isDarkMode,
  onEditBudget,
  onDeleteBudget
}) {
  // Guarda só o id: manter o objeto inteiro deixava o detalhe exibindo dados
  // antigos após uma edição e mantinha na tela um orçamento já excluído.
  const [selectedId, setSelectedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const lista = Array.isArray(budgets) ? budgets : [];

  const selected = useMemo(
    () => (selectedId == null ? null : lista.find((b) => b?.id === selectedId) || null),
    [lista, selectedId]
  );

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportBudgetsToCSV(lista);
    } catch (error) {
      reportError(error, 'exportCSV');
      Alert.alert('Erro', error?.message || 'Falha ao exportar o CSV.');
    } finally {
      setExporting(false);
    }
  };

  // Exportações individuais também precisam avisar quando falham.
  const runExport = async (task, fallbackMessage) => {
    try {
      await task();
    } catch (error) {
      reportError(error, 'export');
      Alert.alert('Erro', error?.message || fallbackMessage);
    }
  };

  const confirmDelete = (id, nome) => {
    Alert.alert(
      'Excluir orçamento',
      `Tem certeza que deseja excluir "${nome || 'este orçamento'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, excluir',
          style: 'destructive',
          onPress: () => {
            // Fecha o detalhe: sem isso a tela continuava mostrando o
            // orçamento recém-excluído.
            setSelectedId(null);
            onDeleteBudget?.(id);
          }
        }
      ]
    );
  };

  const renderDetail = () => {
    if (!selected) return null;
    const item = selected;
    const result = item.result || {};
    const insumos = item.insumos || [];

    // Limpa o imposto para ter no máximo 2 casas decimais sem zeros inúteis
    const impostoLimpo = toNumber(item.imposto ?? result.imposto, 0)
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace('.', ',');

    return (
      <ScrollView style={[styles.detailContainer, isDarkMode && styles.detailContainerDark]}>
        <View style={[styles.detailHeader, isDarkMode && styles.detailHeaderDark]}>
          <TouchableOpacity
            style={[styles.backButton, isDarkMode && styles.backButtonDark]}
            onPress={() => setSelectedId(null)}
          >
            <Feather name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.detailTitle, isDarkMode && styles.detailTitleDark]} numberOfLines={1}>
            {item.nome || 'Sem nome'}
          </Text>
          <View style={styles.detailActions}>
            <TouchableOpacity
              style={[styles.pdfButton, isDarkMode && styles.pdfButtonDark]}
              onPress={() => runExport(() => generateAndPreviewReport(item), 'Falha ao gerar o PDF.')}
            >
              <Feather name="file-text" size={20} color="#16a34a" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.csvButton, isDarkMode && styles.csvButtonDark]}
              onPress={() => runExport(() => exportBudgetsToCSV([item]), 'Falha ao exportar o CSV.')}
            >
              <Feather name="download" size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, isDarkMode && styles.editButtonDark]}
              onPress={() => {
                setSelectedId(null);
                onEditBudget?.(item);
              }}
            >
              <Feather name="edit-2" size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, isDarkMode && styles.deleteButtonDark]}
              onPress={() => confirmDelete(item.id, item.nome)}
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.infoRow, isDarkMode && styles.infoRowDark]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Data</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              {formatDate(item.createdAt || item.created_at)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Rendimento</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              {item.qtdProduto || '-'} {item.unidadeProduto || ''}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Imposto</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              {impostoLimpo}%
            </Text>
          </View>
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Ingredientes</Text>
          {insumos.map((ing, idx) => (
            <View key={idx} style={[styles.ingredientItem, isDarkMode && styles.ingredientItemDark]}>
              <View>
                <Text style={[styles.ingredientName, isDarkMode && styles.ingredientNameDark]}>
                  {ing.nome}
                </Text>
                {/* Tradução visual da unidade do ingrediente */}
                <Text style={[styles.ingredientQuantity, isDarkMode && styles.ingredientQuantityDark]}>
                  {MAPA_UNIDADES[ing.unidadeUsada] || 'Quantidade'} usadas: {ing.qtdUsada}
                </Text>
              </View>
            </View>
          ))}
          {insumos.length === 0 && (
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              Nenhum ingrediente.
            </Text>
          )}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Custos operacionais
          </Text>
          <View style={styles.operationalRow}>
            <Text style={[styles.operationalLabel, isDarkMode && styles.operationalLabelDark]}>
              {item.modoCusto === 'automatico' ? 'Automático' : 'Manual'}
            </Text>
            {/* O "R$" duplicado foi removido aqui embaixo */}
            <Text style={[styles.operationalValue, isDarkMode && styles.operationalValueDark]}>
              {item.modoCusto === 'automatico'
                ? `${item.tempoPreparo || 0} min`
                : formatMoney(item.custoManual || 0)}
            </Text>
          </View>
          <View style={styles.operationalRow}>
            <Text style={[styles.operationalLabel, isDarkMode && styles.operationalLabelDark]}>
              Custo rateado
            </Text>
            <Text style={[styles.operationalValue, isDarkMode && styles.operationalValueDark]}>
              {formatMoney(result.valorOperacional || 0)}
            </Text>
          </View>
        </View>

        <View style={[styles.resultCard, isDarkMode && styles.resultCardDark]}>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, isDarkMode && styles.resultLabelDark]}>
              Custo total
            </Text>
            <Text style={[styles.resultValue, isDarkMode && styles.resultValueDark]}>
              {formatMoney(result.custoTotal || 0)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, isDarkMode && styles.resultLabelDark]}>
              Preço sugerido
            </Text>
            <Text style={[styles.resultHighlight, isDarkMode && styles.resultHighlightDark]}>
              {formatMoney(result.precoSugeridoTotal || 0)}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, isDarkMode && styles.resultLabelDark]}>
              Lucro
            </Text>
            <Text
              style={[
                styles.resultValue,
                (result.lucro || 0) >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {formatMoney(Math.abs(result.lucro || 0))}{' '}
              {(result.lucro || 0) >= 0 ? '(Lucro)' : '(Prejuízo)'}
            </Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <View style={[styles.screen, isDarkMode && styles.screenDark]}>
      {selected ? (
        renderDetail()
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.screenTitle, isDarkMode && styles.screenTitleDark]}>
              Histórico
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => runExport(() => generateSummaryPDF(lista), 'Falha ao gerar o PDF.')}
                disabled={lista.length === 0}
                style={{ marginRight: 15 }}
              >
                <Feather name="file-text" size={20} color={isDarkMode ? '#bbf7d0' : '#16a34a'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExport} disabled={exporting || lista.length === 0}>
                {exporting ? <ActivityIndicator size="small" color="#2563eb" /> : 
                <Feather name="download" size={20} color={isDarkMode ? '#93c5fd' : '#2563eb'} />}
              </TouchableOpacity>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <FlatList
              data={lista}
              keyExtractor={(item, index) => item?.id != null ? String(item.id) : `budget-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.card, isDarkMode && styles.cardDark]}
                  // Itens sem id não têm detalhe estável para abrir.
                  disabled={item?.id == null}
                  onPress={() => setSelectedId(item?.id)}
                >
                  <View>
                    <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
                      {item.nome || 'Sem nome'}
                    </Text>
                    <Text
                      style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}
                    >
                      {formatDate(item.createdAt || item.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]}>
                    {formatMoney(item.result?.custoTotal || 0)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
                  Nenhum orçamento salvo.
                </Text>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  screenDark: { backgroundColor: '#020617' },
  // Antes chamava-se `sectionTitle` e era sobrescrito pela outra definição
  // do mesmo nome mais abaixo — o título "Histórico" saía minúsculo e em caixa alta.
  screenTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14, color: '#0f172a' },
  screenTitleDark: { color: '#e2e8f0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  cardDark: { backgroundColor: '#111827' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  cardTitleDark: { color: '#e2e8f0' },
  cardSubtitle: { color: '#64748b', marginTop: 4, fontSize: 13 },
  cardSubtitleDark: { color: '#94a3b8' },
  cardValue: { fontSize: 15, fontWeight: '800', color: '#2563eb' },
  cardValueDark: { color: '#93c5fd' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 20 },
  emptyTextDark: { color: '#94a3b8' },
  detailContainer: { flex: 1 },
  detailContainerDark: { backgroundColor: '#020617' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailHeaderDark: { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  backButtonDark: { backgroundColor: '#1e293b' },
  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
    color: '#0f172a',
  },
  detailTitleDark: { color: '#e2e8f0' },
  detailActions: { flexDirection: 'row' },
  pdfButton: { padding: 8, borderRadius: 20, backgroundColor: '#f0fdf4' },
  pdfButtonDark: { backgroundColor: '#064e3b' },
  csvButton: { padding: 8, borderRadius: 20, backgroundColor: '#eff6ff' },
  csvButtonDark: { backgroundColor: '#1e3a5f' },
  editButton: { padding: 8, borderRadius: 20, backgroundColor: '#eff6ff' },
  editButtonDark: { backgroundColor: '#1e3a5f' },
  deleteButton: { padding: 8, borderRadius: 20, backgroundColor: '#fee2e2' },
  deleteButtonDark: { backgroundColor: '#7f1d1d' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  infoRowDark: { backgroundColor: '#0f172a' },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoLabelDark: { color: '#475569' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  infoValueDark: { color: '#e2e8f0' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionDark: { backgroundColor: '#0f172a' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionTitleDark: { color: '#e2e8f0' },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  ingredientItemDark: { borderBottomColor: '#1e293b' },
  ingredientName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ingredientNameDark: { color: '#e2e8f0' },
  ingredientQuantity: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ingredientQuantityDark: { color: '#94a3b8' },
  operationalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  operationalLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  operationalLabelDark: { color: '#94a3b8' },
  operationalValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  operationalValueDark: { color: '#e2e8f0' },
  resultCard: {
    backgroundColor: '#2563eb',
    borderRadius: 28,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  resultCardDark: { backgroundColor: '#1d4ed8' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel: { fontSize: 13, fontWeight: '600', color: '#bfdbfe' },
  resultLabelDark: { color: '#93c5fd' },
  resultValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  resultValueDark: { color: '#e2e8f0' },
  resultHighlight: { fontSize: 20, fontWeight: '900', color: '#facc15' },
  resultHighlightDark: { color: '#fde047' },
  profit: { color: '#bbf7d0' },
  loss: { color: '#fecaca' },
});