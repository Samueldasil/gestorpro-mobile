import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function GlobalConfigScreen({ configGlobal, onSave, onBack, isDarkMode, onShowToast }) {
  // Estado local para os inputs, inicializado com os valores globais do App.js
  const [config, setConfig] = useState({
    gas: configGlobal?.gas || '',
    luz: configGlobal?.luz || '',
    agua: configGlobal?.agua || '',
    horas: configGlobal?.horas || '',
  });

  // Impede a entrada de números negativos ou notação científica nos campos
  const handleBlockNegative = (value) => value.replace(/[-eE]/g, '');

  // Salva as alterações e retorna para a tela anterior
  const handleSave = () => {
    onSave(config);
    onShowToast?.('Custos salvos com sucesso!', 'success');
    onBack();
  };

  const fields = [
    { key: 'gas', label: 'Gás Mensal (R$)', icon: 'fire', color: '#f97316', placeholder: '0,00' },
    { key: 'luz', label: 'Luz Mensal (R$)', icon: 'lightning-bolt', color: '#eab308', placeholder: '0,00' },
    { key: 'agua', label: 'Água Mensal (R$)', icon: 'water', color: '#3b82f6', placeholder: '0,00' },
    { key: 'horas', label: 'Horas Trabalhadas/Mês', icon: 'clock-outline', color: '#8b5cf6', placeholder: '0' },
  ];

  // Cálculo rápido para exibição na prévia
  const totalContas =
    (parseFloat(config.gas) || 0) + (parseFloat(config.luz) || 0) + (parseFloat(config.agua) || 0);
  // Divide o total pelo tempo produtivo em minutos
  const custoPorMinuto = config.horas > 0 ? totalContas / (parseFloat(config.horas) * 60) : 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.screen, isDarkMode && styles.screenDark]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, isDarkMode && styles.backButtonDark]} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={isDarkMode ? '#e2e8f0' : '#0f172a'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Custos Globais</Text>
        </View>

        <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" />
          <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
            Defina os valores mensais da infraestrutura. Eles são usados no cálculo automático.
          </Text>
        </View>

        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          {fields.map((field, index) => (
            <View key={field.key} style={[styles.fieldWrap, index < fields.length - 1 && styles.fieldBorder]}>
              <View style={[styles.fieldIconWrap, { backgroundColor: field.color + '20' }]}>
                <MaterialCommunityIcons name={field.icon} size={20} color={field.color} />
              </View>
              <View style={styles.fieldRight}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>{field.label}</Text>
                <TextInput
                  style={[styles.fieldInput, isDarkMode && styles.fieldInputDark]}
                  placeholder={field.placeholder}
                  value={String(config[field.key])}
                  onChangeText={(text) => setConfig(prev => ({ ...prev, [field.key]: handleBlockNegative(text) }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        {totalContas > 0 && config.horas > 0 && (
          <View style={[styles.previewCard, isDarkMode && styles.previewCardDark]}>
            <Text style={[styles.previewTitle, isDarkMode && styles.previewTitleDark]}>Prévia do Rateio</Text>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, isDarkMode && styles.previewLabelDark]}>Total de contas/mês</Text>
              <Text style={[styles.previewValue, isDarkMode && styles.previewValueDark]}>R$ {totalContas.toFixed(2)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, isDarkMode && styles.previewLabelDark]}>Custo por minuto produtivo</Text>
              <Text style={styles.previewValueHighlight}>R$ {custoPorMinuto.toFixed(4)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.saveButton, isDarkMode && styles.saveButtonDark]} onPress={handleSave}>
          <Feather name="check" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Salvar Configurações</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  screenDark: { backgroundColor: '#020617' },
  content: { padding: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  backButtonDark: { backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerTitleDark: { color: '#f1f5f9' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 20, padding: 16, marginBottom: 20 },
  infoCardDark: { backgroundColor: '#1e3a5f' },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', fontWeight: '600', lineHeight: 20 },
  infoTextDark: { color: '#93c5fd' },
  card: { backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden', marginBottom: 16 },
  cardDark: { backgroundColor: '#0f172a' },
  fieldWrap: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  fieldIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldRight: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  fieldLabelDark: { color: '#94a3b8' },
  fieldInput: { height: 46, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: '700', fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  fieldInputDark: { backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' },
  previewCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20 },
  previewCardDark: { backgroundColor: '#0f172a' },
  previewTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 14 },
  previewTitleDark: { color: '#475569' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  previewLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  previewLabelDark: { color: '#94a3b8' },
  previewValue: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  previewValueDark: { color: '#e2e8f0' },
  previewValueHighlight: { fontSize: 15, fontWeight: '900', color: '#3b82f6' },
  saveButton: { backgroundColor: '#2563eb', borderRadius: 28, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveButtonDark: { backgroundColor: '#1d4ed8' },
  saveButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});