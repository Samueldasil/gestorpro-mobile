import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { formatMoney } from '../utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MacroReportScreen from './MacroReportScreen';
import { getMacroSummary, exportCSV as controllerExportCSV, generatePDF as controllerGeneratePDF } from '../controllers/macroController';
import { reportError } from '../utils/errorHandler';

export default function MacroScreen({ budgets, isDarkMode }) {
  const [showReport, setShowReport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const lista = Array.isArray(budgets) ? budgets : [];

  const handleExportCSV = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await controllerExportCSV(lista);
    } catch (error) {
      reportError(error, 'macroExportCSV');
      Alert.alert('Erro', error?.message || 'Falha ao exportar o CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleGeneratePDF = async () => {
    // Sem esta trava, toques repetidos abriam vários compartilhamentos em fila.
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await controllerGeneratePDF(lista);
    } catch (error) {
      reportError(error, 'macroGeneratePDF');
      Alert.alert('Erro', error?.message || 'Falha ao gerar o PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (showReport) {
    return <MacroReportScreen budgets={lista} onBack={() => setShowReport(false)} isDarkMode={isDarkMode} />;
  }

  // Use controller para obter resumo
  const { totalRevenue, totalCost, totalProfit, totalBudgets } = getMacroSummary(lista);

  return (
    <View style={[styles.screen, isDarkMode && styles.screenDark]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark, { marginBottom: 0 }]}>Macro</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handleGeneratePDF}
            disabled={generatingPdf || lista.length === 0}
            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, opacity: lista.length === 0 ? 0.4 : 1 }}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportCSV}
            disabled={exporting || lista.length === 0}
            style={{ flexDirection: 'row', alignItems: 'center', opacity: lista.length === 0 ? 0.4 : 1 }}
          >
            <MaterialCommunityIcons name="microsoft-excel" size={20} color="#16a34a" style={{ marginRight: 4 }} />
            <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 12 }}>Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.heroCard, isDarkMode && styles.heroCardDark]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={[styles.heroLabel, isDarkMode && styles.heroLabelDark]}>Visão geral</Text>
            <Text style={[styles.heroValue, isDarkMode && styles.heroValueDark]}>{formatMoney(totalRevenue)}</Text>
          </View>
          <View style={[styles.heroBadge, totalProfit >= 0 ? styles.badgePositive : styles.badgeNegative]}>
            <MaterialCommunityIcons name={totalProfit >= 0 ? 'trending-up' : 'trending-down'} size={18} color="#fff" />
            <Text style={styles.heroBadgeText}>{totalProfit >= 0 ? 'Lucro' : 'Prejuízo'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Orçamentos</Text>
          <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>{totalBudgets}</Text>
        </View>
        <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Receita</Text>
          <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Custo</Text>
          <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>{formatMoney(totalCost)}</Text>
        </View>
        <View style={[styles.statCard, isDarkMode && styles.cardDark]}>
          <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>Lucro</Text>
          <Text style={[styles.statValue, totalProfit >= 0 ? styles.profitValue : styles.lossValue]}>
            {formatMoney(totalProfit)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.actionButton, isDarkMode && styles.actionButtonDark]} onPress={() => setShowReport(true)}>
        <Text style={styles.actionText}>Ver relatório completo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  screenDark: { backgroundColor: '#020617' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  sectionTitleDark: { color: '#e2e8f0' },
  heroCard: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, elevation: 5 },
  heroCardDark: { backgroundColor: '#111827' },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#64748b', fontSize: 13, marginBottom: 8, fontWeight: '700' },
  heroLabelDark: { color: '#94a3b8' },
  heroValue: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  heroValueDark: { color: '#e2e8f0' },
  heroBadge: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  badgePositive: { backgroundColor: '#16a34a' },
  badgeNegative: { backgroundColor: '#dc2626' },
  heroBadgeText: { color: '#fff', fontWeight: '800' },
  // CORREÇÃO: Removido o 'gap' da grid para evitar o crash do Yoga Layout Engine
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 },
  // CORREÇÃO: Adicionado marginBottom diretamente no cartão para compensar a falta do gap
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 24, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, elevation: 4, marginBottom: 12 },
  cardDark: { backgroundColor: '#111827' },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  statLabelDark: { color: '#94a3b8' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  statValueDark: { color: '#e2e8f0' },
  profitValue: { color: '#10b981' },
  lossValue: { color: '#ef4444' },
  actionButton: { backgroundColor: '#2563eb', borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  actionButtonDark: { backgroundColor: '#1d4ed8' },
  actionText: { color: '#fff', fontWeight: '800' },
});