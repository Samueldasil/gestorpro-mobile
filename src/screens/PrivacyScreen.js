import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function PrivacyScreen({ onBack, isDarkMode, onShowTerms, onClearData }) {
  const theme = {
    bg: isDarkMode ? '#020617' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    subtext: isDarkMode ? '#94a3b8' : '#64748b',
    blue: '#2563eb'
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Termos e Política</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Política de Privacidade */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="shield-check" size={20} color={theme.blue} />
            <Text style={[styles.sectionTitle, { color: theme.blue }]}>Política de Privacidade</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            O <Text style={{ fontWeight: 'bold' }}>Gestor Pro</Text> prioriza a sua privacidade. Todos os seus dados 
            de orçamentos, insumos e custos operacionais são armazenados de forma segura nos nossos servidores.
          </Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            Não partilhamos os seus dados financeiros com terceiros sob nenhuma circunstância. 
            Detém a propriedade total das suas informações e pode exportar ou solicitar a 
            exclusão definitiva da sua conta a qualquer momento.
          </Text>
        </View>

        {/* LGPD */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Feather name="lock" size={20} color={theme.blue} />
            <Text style={[styles.sectionTitle, { color: theme.blue }]}>Conformidade com a LGPD</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD), garantimos:
          </Text>
          
          {/* A MÁGICA DO ALINHAMENTO ACONTECE AQUI (Textos Aninhados) */}
          <Text style={[styles.bulletText, { color: theme.text }]}>
            <Text style={{ color: theme.blue, fontWeight: 'bold' }}>• Transparência: </Text>
            Seus dados são usados apenas para o funcionamento do app.
          </Text>
          
          <Text style={[styles.bulletText, { color: theme.text }]}>
            <Text style={{ color: theme.blue, fontWeight: 'bold' }}>• Controle: </Text>
            Exporte seus dados em CSV a qualquer instante.
          </Text>
          
          <Text style={[styles.bulletText, { color: theme.text }]}>
            <Text style={{ color: theme.blue, fontWeight: 'bold' }}>• Esquecimento: </Text>
            A exclusão da conta apaga permanentemente seus rastros.
          </Text>
        </View>

        {/* Ações */}
        {onShowTerms && (
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card }]}
            onPress={onShowTerms}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Feather name="file-text" size={20} color={theme.blue} />
              <Text style={[styles.actionText, { color: theme.text }]}>Termos de Uso completos</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.subtext} />
          </TouchableOpacity>
        )}

        {onClearData && (
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.card }]}
            onPress={onClearData}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Feather name="refresh-cw" size={20} color={theme.blue} />
              <Text style={[styles.actionText, { color: theme.text }]}>Recarregar dados da nuvem</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 40 
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  actionText: { fontSize: 15, fontWeight: '700', marginLeft: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', marginLeft: 8 }, // Margem adicionada para afastar o texto do ícone
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 10, textAlign: 'justify' }, // Justificado para ficar elegante
  bulletText: { fontSize: 14, lineHeight: 22, marginBottom: 8, textAlign: 'left' } // Alinhamento à esquerda com bom espaçamento de linha
});