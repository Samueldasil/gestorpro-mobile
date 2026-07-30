import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TermsScreen({ onBack, isDarkMode }) {
  return (
    <ScrollView style={[styles.screen, isDarkMode && styles.screenDark]} contentContainerStyle={styles.content}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity style={[styles.backButton, isDarkMode && styles.backButtonDark]} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={isDarkMode ? '#e2e8f0' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Termos e Política</Text>
      </View>

      <View style={[styles.heroCard, isDarkMode && styles.heroCardDark]}>
        <MaterialCommunityIcons name="shield-check" size={32} color="#2563eb" />
        <Text style={[styles.heroTitle, isDarkMode && styles.heroTitleDark]}>Gestor<Text style={{ color: '#2563eb' }}>Pro</Text></Text>
        <Text style={[styles.heroSubtitle, isDarkMode && styles.heroSubtitleDark]}>A sua privacidade é a nossa prioridade.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Política de Privacidade</Text>
        <Text style={[styles.bodyText, isDarkMode && styles.bodyTextDark]}>O Gestor Pro prioriza a sua privacidade. Todos os seus dados de orçamentos, insumos e custos operacionais são armazenados de forma segura.</Text>
        <Text style={[styles.bodyText, isDarkMode && styles.bodyTextDark]}>Não partilhamos os seus dados financeiros com terceiros. Detém a propriedade total das suas informações e pode solicitar a exclusão a qualquer momento.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Conformidade com a LGPD</Text>
        <Text style={[styles.bodyText, isDarkMode && styles.bodyTextDark]}>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), garantimos que os seus dados são recolhidos exclusivamente para o funcionamento da aplicação e melhoria da sua experiência.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Termos de Uso</Text>
        <Text style={[styles.bodyText, isDarkMode && styles.bodyTextDark]}>Os valores de precificação sugeridos são estimativas baseadas nos dados fornecidos. A aplicação não se responsabiliza por flutuações de mercado ou preenchimento incorreto das informações de custo.</Text>
      </View>

      <View style={[styles.footerCard, isDarkMode && styles.footerCardDark]}>
        <MaterialCommunityIcons name="check-decagram" size={20} color="#10b981" />
        <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>Versão 1.0 — Última atualização: 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  screenDark: { backgroundColor: '#020617' },
  content: { padding: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerDark: { backgroundColor: 'transparent' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backButtonDark: { backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5, marginLeft: 16 },
  headerTitleDark: { color: '#f1f5f9' },
  heroCard: { backgroundColor: '#fff', borderRadius: 32, padding: 28, alignItems: 'center', marginBottom: 24 },
  heroCardDark: { backgroundColor: '#0f172a' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -1, marginTop: 12 },
  heroTitleDark: { color: '#f1f5f9' },
  heroSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '600', textAlign: 'center', marginTop: 6 },
  heroSubtitleDark: { color: '#94a3b8' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#2563eb', marginBottom: 12 },
  sectionTitleDark: { color: '#60a5fa' },
  // A mágica do texto bonito e alinhado acontece aqui:
  bodyText: { fontSize: 14, color: '#475569', lineHeight: 24, fontWeight: '500', marginBottom: 12, textAlign: 'justify' },
  bodyTextDark: { color: '#94a3b8' },
  footerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 16 },
  footerCardDark: { backgroundColor: '#052e16', borderColor: '#166534' },
  footerText: { fontSize: 12, color: '#166534', fontWeight: '700', marginLeft: 8 },
  footerTextDark: { color: '#4ade80' },
});