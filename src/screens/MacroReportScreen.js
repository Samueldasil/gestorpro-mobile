import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatMoney } from '../utils/format';
import { calculateMonthlyProfit } from '../utils/calculationHelpers';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = Math.max(screenWidth - 64, 280);

export default function MacroReportScreen({ budgets, onBack, isDarkMode }) {
  // Agrupa lucro por mês (últimos 12 meses) — mesma regra usada pelo resumo Macro.
  const safeMonthlyData = useMemo(() => calculateMonthlyProfit(budgets), [budgets]);
  const maxProfit = Math.max(...safeMonthlyData.map(m => Number.isFinite(m.profit) ? m.profit : 0), 1);
  const totalProfit = safeMonthlyData.reduce((acc, m) => acc + (Number.isFinite(m.profit) ? m.profit : 0), 0);
  const avgProfit = safeMonthlyData.length > 0 ? totalProfit / safeMonthlyData.length : 0;

  return (
    <ScrollView style={[styles.screen, isDarkMode && styles.screenDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity style={[styles.backButton, isDarkMode && styles.backButtonDark]} onPress={onBack}>
          <Feather name="arrow-left" size={24} color={isDarkMode ? '#e2e8f0' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Relatório Completo</Text>
      </View>

      <View style={[styles.summaryCard, isDarkMode && styles.summaryCardDark]}>
        <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>Lucro Total (12 meses)</Text>
        <Text style={[styles.summaryValue, totalProfit >= 0 ? styles.profit : styles.loss]}>
          {formatMoney(Math.abs(totalProfit))} {totalProfit >= 0 ? '(Lucro)' : '(Prejuízo)'}
        </Text>
        <Text style={[styles.summarySub, isDarkMode && styles.summarySubDark]}>Média mensal: {formatMoney(avgProfit)}</Text>
      </View>

      <View style={[styles.chartCard, isDarkMode && styles.chartCardDark]}>
        <Text style={[styles.chartTitle, isDarkMode && styles.chartTitleDark]}>Evolução do Lucro</Text>
        <View style={styles.chartBars}>
          {safeMonthlyData.length > 0 ? safeMonthlyData.map((item, idx) => {
            const profitValue = Number.isFinite(item.profit) ? item.profit : 0;
            const height = (profitValue / maxProfit) * 120;
            const barColor = profitValue >= 0 ? '#10b981' : '#ef4444';
            return (
              <View key={`${item.label ?? 'month'}-${idx}`} style={styles.barContainer}>
                <View style={[styles.bar, { height: Math.max(height, 4), backgroundColor: barColor }]} />
                <Text style={[styles.barLabel, isDarkMode && styles.barLabelDark]}>{item.label || '-'}</Text>
                <Text style={[styles.barValue, isDarkMode && styles.barValueDark]}>{formatMoney(profitValue)}</Text>
              </View>
            );
          }) : (
            <View style={styles.emptyChartMessage}>
              <Text style={[styles.emptyChartText, isDarkMode && styles.emptyChartTextDark]}>Sem dados suficientes para mostrar o gráfico.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.insightCard, isDarkMode && styles.insightCardDark]}>
        <Text style={[styles.insightTitle, isDarkMode && styles.insightTitleDark]}>📈 Insights</Text>
        <Text style={[styles.insightText, isDarkMode && styles.insightTextDark]}>
          {totalProfit > 0 ? 'Parabéns! Seu negócio está lucrativo.' : totalProfit < 0 ? 'Atenção: você está operando no vermelho. Reveja seus custos.' : 'Você está no ponto de equilíbrio.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  screenDark: { backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerDark: { backgroundColor: '#020617', borderBottomColor: '#1e293b' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 16 },
  backButtonDark: { backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerTitleDark: { color: '#e2e8f0' },
  summaryCard: { margin: 16, backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center' },
  summaryCardDark: { backgroundColor: '#0f172a' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 },
  summaryLabelDark: { color: '#94a3b8' },
  summaryValue: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  profit: { color: '#10b981' },
  loss: { color: '#ef4444' },
  summarySub: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  summarySubDark: { color: '#94a3b8' },
  chartCard: { margin: 16, backgroundColor: '#fff', borderRadius: 28, padding: 20 },
  chartCardDark: { backgroundColor: '#0f172a' },
  chartTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
  chartTitleDark: { color: '#e2e8f0' },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, marginBottom: 10 },
  barContainer: { alignItems: 'center', width: (CHART_WIDTH - 40) / 12 },
  bar: { width: 8, borderRadius: 4, marginBottom: 6 },
  barLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', marginTop: 4 },
  barLabelDark: { color: '#94a3b8' },
  barValue: { fontSize: 8, color: '#94a3b8', marginTop: 2 },
  barValueDark: { color: '#475569' },
  emptyChartMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  emptyChartText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  emptyChartTextDark: { color: '#94a3b8' },
  insightCard: { margin: 16, backgroundColor: '#eff6ff', borderRadius: 24, padding: 20, marginBottom: 32 },
  insightCardDark: { backgroundColor: '#1e3a5f' },
  insightTitle: { fontSize: 14, fontWeight: '900', color: '#1e40af', marginBottom: 8 },
  insightTitleDark: { color: '#93c5fd' },
  insightText: { fontSize: 14, color: '#1e3a8a', fontWeight: '600', lineHeight: 20 },
  insightTextDark: { color: '#dbeafe' },
});