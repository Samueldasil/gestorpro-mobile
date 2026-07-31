import React, { useState, useRef, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { loginUser, registerUser } from '../api/api';
import { Feather } from '@expo/vector-icons';
import LogoBadge from '../components/LogoBadge';
import { validateEmail, validatePassword, validatePasswordMatch } from '../utils/validators';
import { useAuth } from '../contexts/AuthContext';

function AuthScreen({ isDarkMode, onToggleDarkMode, onShowToast, onShowForgot }) {
  const [mode, setMode] = useState('login');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false); // Trava síncrona contra duplo clique
  const [showPassword, setShowPassword] = useState(false); // Controla visibilidade do texto da senha
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validações centralizadas

  const handleSubmit = async () => {
    // O estado só muda no próximo render: dois toques no mesmo frame passavam
    // pela trava e disparavam duas requisições de login/cadastro.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (!email.trim() || !password.trim()) {
        onShowToast?.('Informe e-mail e senha.', 'error');
        return;
      }

      const emailError = validateEmail(email.trim());
      if (emailError) {
        onShowToast?.(emailError, 'error');
        return;
      }

      const passError = validatePassword(password);
      if (passError) {
        onShowToast?.(passError, 'error');
        return;
      }

      if (mode === 'register') {
        const matchError = validatePasswordMatch(password, confirmPassword);
        if (matchError) {
          onShowToast?.(matchError, 'error');
          return;
        }
      }

      if (mode === 'login') {
        // CÓDIGO LIMPO E PADRONIZADO! Usando a central da API
        // Sem logs aqui: e-mail e token apareceriam no logcat de builds release.
        const data = await loginUser(email.trim(), password);

        // Resposta fora do formato esperado estourava um TypeError aqui dentro
        // e o usuário via apenas "Credenciais inválidas", sem pista do motivo real.
        if (!data?.token || !data?.user) {
          throw new Error('O servidor não retornou os dados de acesso. Tente novamente.');
        }

        await login(data.user, data.token);
        onShowToast?.('Bem-vindo de volta!', 'success');
      } else {
        // Fluxo de criação de conta
        await registerUser(email.trim(), password);
        onShowToast?.('Conta criada. Faça login para continuar.', 'success');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.warn('Falha na autenticação:', error?.message);
      onShowToast?.(error.message || 'Erro na autenticação.', 'error');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.card, isDarkMode && styles.cardDark]}>
        <View style={styles.logoRow}>
          <LogoBadge size={50} isDarkMode={isDarkMode} />
          <Text style={[styles.brandTitle, isDarkMode && styles.brandTitleDark]}>GestorPro</Text>
        </View>

        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Gerencie seus orçamentos com precisão e estilo.</Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="E-mail"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, isDarkMode && styles.inputDark]}
              placeholder="Senha"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={isDarkMode ? '#94a3b8' : '#64748b'}
              />
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, isDarkMode && styles.inputDark]}
                placeholder="Confirme a senha"
                placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={isDarkMode ? '#94a3b8' : '#64748b'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {mode === 'login' && (
          <TouchableOpacity onPress={onShowForgot} style={styles.forgotBtn}>
            <Text style={[styles.forgotText, isDarkMode && styles.linkTextDark]}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, isDarkMode && styles.buttonDark]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Entrar no Sistema' : 'Criar minha Conta'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={[styles.linkText, isDarkMode && styles.linkTextDark]}>{mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.themeButton} onPress={onToggleDarkMode}>
          <Text style={styles.themeText}>{isDarkMode ? 'Modo claro' : 'Modo escuro'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(AuthScreen);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f8fafc', padding: 16 },
  containerDark: {
    backgroundColor: '#020617'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8
  },
  cardDark: {
    backgroundColor: '#111827'
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -5 },
  forgotText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  brandTitle: {
    fontSize: 24, fontWeight: '900', color: '#0f172a'
  },
  brandTitleDark: {
    color: '#e2e8f0'
  },
  title: {
    fontSize: 28, fontWeight: '900', color: '#0f172a'
  },
  titleDark: {
    color: '#e2e8f0'
  },
  subtitle: {
    marginTop: 8,
    color: '#475569',
    fontSize: 14,
    marginBottom: 20
  },
  subtitleDark: {
    color: '#94a3b8'
  },
  form: {
    marginBottom: 16
  },
  input: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
  },
  passwordContainer: {
    position: 'relative', marginBottom: 12
  },
  passwordInput: {
    height: 52, borderRadius: 18, paddingHorizontal: 16, paddingRight: 48, backgroundColor: '#f1f5f9', color: '#0f172a', borderWidth: 0
  },
  eyeIcon: { position: 'absolute', right: 16, top: 16 },
  button: {
    backgroundColor: '#2563eb', borderRadius: 20, paddingVertical: 16, alignItems: 'center'
  },
  buttonDark: {
    backgroundColor: '#1d4ed8'
  },
  buttonText: {
    color: '#ffffff', fontWeight: '800'
  },
  linkButton: {
    marginTop: 16, alignItems: 'center'
  },
  linkText: {
    color: '#2563eb', fontWeight: '700'
  },
  linkTextDark: {
    color: '#93c5fd'
  },
  themeButton: {
    marginTop: 18, alignItems: 'center'
  },
  themeText: {
    color: '#64748b', fontWeight: '700'
  }
});