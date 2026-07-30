import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import GlobalConfigScreen from './GlobalConfigScreen';
import PrivacyScreen from './PrivacyScreen';
import TermsScreen from './TermsScreen';
import { useAuth } from '../contexts/AuthContext';
import { saveGlobalConfig, clearAndReloadData } from '../controllers/profileController';
import useBackHandler from './useBackHandler'; // <-- Importado para funcionar no Perfil

export default function ProfileScreen({
  userEmail,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  onShowToast,
  configGlobal,
  onSaveConfigGlobal,
  budgets,
  onClearData,
  onBackToMain, 
}) {
  const auth = useAuth();
  
  const emailToShow = auth?.user?.email || userEmail;
  const doLogout = onLogout || auth?.logout;
  const [subScreen, setSubScreen] = useState(null); 

  // SEGURANÇA CONTRA UNDEFINED (Apontado pelo Blackbox)
  const handleBackToMain = onBackToMain ?? (() => {});

  // O BOTÃO FÍSICO INTELIGENTE NAS SUB-TELAS DO PERFIL
  useBackHandler(() => {
    if (subScreen === 'terms') {
      setSubScreen('privacy');
      return true; // Bloqueia o fechamento do app
    }
    if (subScreen === 'global' || subScreen === 'privacy') {
      setSubScreen(null);
      return true; // Bloqueia o fechamento do app
    }
    return false; // Deixa voltar pro App.js se estiver na raiz do perfil
  });

  const handleSaveConfig = async (newConfig) => {
    try {
      await saveGlobalConfig(newConfig);
      onSaveConfigGlobal?.(newConfig);
      onShowToast?.('Configurações salvas.', 'success');
      setSubScreen(null);
    } catch (err) {
      console.error(err);
      onShowToast?.('Falha ao salvar configurações.', 'error');
    }
  };

  const handleClearData = async () => {
    try {
      // Uma requisição só: o resultado sobe para o App em vez de ele buscar de novo.
      const response = await clearAndReloadData();
      onClearData?.(response);
      onShowToast?.('Dados recarregados da nuvem.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast?.('Falha de rede ao recarregar dados.', 'error');
    }
  };

  if (subScreen === 'global') {
    return (
      <GlobalConfigScreen
        configGlobal={configGlobal}
        onSave={handleSaveConfig}
        onBack={() => setSubScreen(null)}
        isDarkMode={isDarkMode}
        onShowToast={onShowToast}
      />
    );
  }

  if (subScreen === 'privacy') {
    return (
      <PrivacyScreen
        onBack={() => setSubScreen(null)}
        onShowTerms={() => setSubScreen('terms')}
        onClearData={handleClearData}
        budgets={budgets}
        isDarkMode={isDarkMode}
        onShowToast={onShowToast}
      />
    );
  }

  if (subScreen === 'terms') {
    return (
      <TermsScreen
        onBack={() => setSubScreen('privacy')}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <ScrollView style={[styles.screen, isDarkMode && styles.screenDark]} contentContainerStyle={styles.contentContainer}>
      <View style={[
        styles.header,
        isDarkMode && { backgroundColor: '#020617', borderBottomColor: '#1e293b' }
      ]}>
        {/* Uso do fallback seguro handleBackToMain */}
        <TouchableOpacity
          onPress={handleBackToMain}
          style={[
            styles.backButton,
            isDarkMode && { backgroundColor: '#1e293b' }
          ]}
        >
          <Feather name="arrow-left" size={24} color={isDarkMode ? '#ffffff' : '#0f172a'} />
        </TouchableOpacity>

        <Text style={[
          styles.headerTitle,
          isDarkMode && { color: '#ffffff' }
        ]}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.profileHeader, isDarkMode && styles.profileHeaderDark]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isDarkMode && styles.avatarDark]}>
            <Text style={styles.avatarText}>{emailToShow?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
        </View>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Meu Negócio</Text>
        <Text style={[styles.info, isDarkMode && styles.infoDark]}>{emailToShow || 'Usuário Pro'}</Text>
      </View>

      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>AJUSTES DA CONTA</Text>

      <View style={[styles.settingsBlock, isDarkMode && styles.settingsBlockDark]}>
        <View style={[styles.menuItem, styles.menuItemBorder, isDarkMode && styles.menuItemBorderDark]}>
          <View style={styles.menuLabelRow}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={24} color="#6366f1" style={{ marginRight: 12 }} />
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Modo Escuro</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={onToggleDarkMode} />
        </View>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemBorder, isDarkMode && styles.menuItemBorderDark]}
          onPress={() => setSubScreen('global')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLabelRow}>
            <MaterialCommunityIcons name="wallet" size={24} color="#f59e0b" style={{ marginRight: 12 }} />
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Custos Globais (Infra)</Text>
          </View>
          <Feather name="chevron-right" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setSubScreen('privacy')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLabelRow}>
            <MaterialCommunityIcons name="cog" size={24} color="#94a3b8" style={{ marginRight: 12 }} />
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Privacidade e Dados</Text>
          </View>
          <Feather name="chevron-right" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isDarkMode && styles.logoutButtonDark]}
        onPress={doLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>Sair da conta</Text>
        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  screenDark: { backgroundColor: '#020617' },
  contentContainer: { paddingBottom: 120 }, 
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerTitleDark: {
    color: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  profileHeaderDark: { backgroundColor: '#0f172a' },
  avatarContainer: { marginBottom: 16, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', transform: [{ rotate: '3deg' }] },
  avatarDark: { backgroundColor: '#1d4ed8' },
  avatarText: { color: '#ffffff', fontSize: 32, fontWeight: '900', transform: [{ rotate: '-3deg' }] },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  titleDark: { color: '#f8fafc' },
  info: { color: '#64748b', marginTop: 4, fontSize: 14, fontWeight: '600' },
  infoDark: { color: '#94a3b8' },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginBottom: 12, marginLeft: 16, letterSpacing: 1 },
  sectionTitleDark: { color: '#475569' },
  settingsBlock: { backgroundColor: '#ffffff', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24, marginHorizontal: 16 },
  settingsBlockDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuItemBorderDark: { borderBottomColor: '#1e293b' },
  menuLabelRow: { flexDirection: 'row', alignItems: 'center' }, 
  menuText: { fontSize: 16, fontWeight: '700', color: '#334155' },
  menuTextDark: { color: '#cbd5e1' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 32, paddingVertical: 20, paddingHorizontal: 20, marginHorizontal: 16, marginBottom: 32, borderWidth: 1, borderColor: '#fee2e2' },
  logoutButtonDark: { backgroundColor: '#0f172a', borderColor: '#7f1d1d' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 16 },
});