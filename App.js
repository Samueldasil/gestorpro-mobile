import React, { Component, useState, useEffect, useRef, useCallback } from 'react';
import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
// O SafeAreaProvider agora vai ficar só no root!
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import useBackHandler from './src/screens/useBackHandler';

import AuthScreen from './src/screens/AuthScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import MacroScreen from './src/screens/MacroScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import TabBar from './src/components/TabBar';
import LogoBadge from './src/components/LogoBadge';
import { getHistory, deleteBudget } from './src/api/api';
import { setUnauthorizedHandler } from './src/services/apiService';
import { loadGlobalConfig, saveGlobalConfig } from './src/controllers/profileController';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Erro não tratado capturado pelo boundary:', error, info);
    Alert.alert('Ops', 'O app encontrou um erro inesperado. Tente reiniciar a tela.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Algo deu errado</Text>
            <Text style={styles.errorText}>O aplicativo encontrou um erro inesperado. Reinicie a tela ou volte para o início.</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => this.setState({ hasError: false })}>
              <Text style={styles.errorButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  // O AuthScreen já chama login() direto pelo contexto — aqui só consumimos o estado.
  const { user, token, logout, loadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('orcamento');
  const [budgets, setBudgets] = useState([]);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [showForgot, setShowForgot] = useState(false);
  const [configGlobal, setConfigGlobal] = useState({ gas: '', luz: '', agua: '', horas: '' });

  useBackHandler(() => {
    if (activeTab !== 'orcamento') {
      setActiveTab('orcamento');
      return true; 
    }
    return false; 
  });

  // Persistência da config global fica só no profileService — App apenas espelha em memória.
  useEffect(() => {
    loadGlobalConfig().then(setConfigGlobal);
  }, []);

  const handleSaveConfigGlobal = async (newConfig) => {
    setConfigGlobal(newConfig);
    await saveGlobalConfig(newConfig);
  };

  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    // Limpa o timer anterior para um toast novo não ser cortado pelo tempo do antigo.
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, msg, type });
    toastTimer.current = setTimeout(() => {
      setToast({ show: false, msg: '', type: 'success' });
      toastTimer.current = null;
    }, 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Sessão expirada em qualquer rota autenticada cai aqui, uma vez só.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      setActiveTab('orcamento');
      setBudgets([]);
      showToast('Sessão expirada ou inválida. Faça login novamente.', 'error');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, showToast]);

  useEffect(() => {
    if (!token) {
      setBudgets([]);
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await getHistory();
        if (isMounted) {
          setBudgets(response?.budgets || []);
        }
      } catch (error) {
        // 401/403 já foi tratado pelo handler global — evita toast duplicado.
        const status = error?.status;
        if (isMounted && status !== 401 && status !== 403) {
          console.warn('Erro ao sincronizar dados:', error?.message || error);
          showToast('Falha de rede ou servidor indisponível. Tente novamente.', 'error');
        }
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loadingAuth) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkBackground]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#020617' : '#f8fafc'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Carregando sua sessão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    logout();
    setActiveTab('orcamento');
    setBudgets([]);
    showToast('Sessão encerrada.');
  };

  const goToHome = () => {
    setActiveTab('orcamento');
    setEditingBudget(null);
  };

  const handleBudgetSaved = (newBudget) => {
    const wasEditing = !!editingBudget;
    setBudgets((prev) => {
      const exists = prev.find((b) => b.id === newBudget.id);
      if (exists) {
        return prev.map((b) => (b.id === newBudget.id ? newBudget : b));
      }
      return [newBudget, ...prev];
    });
    setActiveTab('historico');
    setEditingBudget(null);
    showToast(wasEditing ? 'Orçamento atualizado!' : 'Orçamento salvo com sucesso!');
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setActiveTab('orcamento');
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      showToast('Orçamento excluído.', 'error');
    } catch (error) {
      showToast('Erro ao excluir orçamento.', 'error');
    }
  };

  // Recebe o histórico já buscado pelo ProfileScreen para não repetir a requisição.
  const handleClearData = (response) => {
    setBudgets(response?.budgets || []);
  };

  const renderScreen = () => {
    if (!user) {
      if (showForgot) {
        return <ForgotPasswordScreen onBack={() => setShowForgot(false)} isDarkMode={isDarkMode} onShowToast={showToast} />;
      }
      return (
        <AuthScreen
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          onShowToast={showToast}
          onShowForgot={() => setShowForgot(true)}
        />
      );
    }

    switch (activeTab) {
      case 'historico':
        return <HistoryScreen budgets={budgets} loading={loadingHistory} isDarkMode={isDarkMode} onEditBudget={handleEditBudget} onDeleteBudget={handleDeleteBudget} />;
      case 'macro':
        return <MacroScreen budgets={budgets} isDarkMode={isDarkMode} />;
      case 'perfil':
        return (
          <ProfileScreen
            userEmail={user.email}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            onShowToast={showToast}
            configGlobal={configGlobal}
            onSaveConfigGlobal={handleSaveConfigGlobal}
            budgets={budgets}
            onClearData={handleClearData}
            onBackToMain={() => setActiveTab('orcamento')}
          />
        );
      case 'orcamento':
      default:
        return (
          <BudgetScreen
            token={token}
            onBudgetSaved={handleBudgetSaved}
            isDarkMode={isDarkMode}
            onShowToast={showToast}
            configGlobal={configGlobal}
            initialBudget={editingBudget}
            onClearEditing={() => setEditingBudget(null)}
          />
        );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkBackground]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#020617' : '#f8fafc'} />
        {toast.show && (
          <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            <Text style={styles.toastText}>{toast.msg}</Text>
          </View>
        )}
        {renderScreen()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkBackground]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#020617' : '#f8fafc'} />
      {toast.show && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.brandRow}>
          <LogoBadge size={36} isDarkMode={isDarkMode} onPress={goToHome} />
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            Gestor<Text style={styles.titleBlue}>Pro</Text>
          </Text>
        </View>

        <TouchableOpacity style={[styles.profileCircle, isDarkMode && styles.profileCircleDark]} onPress={() => setActiveTab('perfil')} activeOpacity={0.8}>
          <Text style={styles.profileInitial}>{user?.email?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{renderScreen()}</View>

      {activeTab !== 'perfil' && (
        <View style={[styles.tabBarContainer, isDarkMode && styles.tabBarContainerDark, { paddingBottom: 16 }]}> 
          <TabBar activeTab={activeTab} onChangeTab={setActiveTab} isDarkMode={isDarkMode} />
        </View>
      )}
    </SafeAreaView>
  );
}

// A MÁGICA ESTÁ AQUI: O SafeAreaProvider blinda o aplicativo na raiz e nunca é destruído.
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppErrorBoundary>
          <AppContent />
        </AppErrorBoundary>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  errorText: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 },
  errorButton: { backgroundColor: '#2563eb', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16 },
  errorButtonText: { color: '#fff', fontWeight: '700' },
  darkBackground: { backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, backgroundColor: '#f8fafc', zIndex: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerDark: { backgroundColor: '#020617' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  titleDark: { color: '#ffffff' },
  titleBlue: { color: '#2563eb' },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  profileCircleDark: { backgroundColor: '#1d4ed8' },
  profileInitial: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  content: { flex: 1 },
  tabBarContainer: { backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tabBarContainerDark: { backgroundColor: '#020617', borderTopColor: '#1e293b' },
  toast: { position: 'absolute', top: 60, alignSelf: 'center', zIndex: 50, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  toastSuccess: { backgroundColor: '#0f172a' },
  toastError: { backgroundColor: '#ef4444' },
  toastText: { color: '#ffffff', fontWeight: '800', textAlign: 'center' },
});