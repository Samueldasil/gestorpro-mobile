import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import LogoBadge from '../components/LogoBadge';
import api from '../services/apiService';

export default function ForgotPasswordScreen({ onBack, isDarkMode, onShowToast }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestOtp = async () => {
    if (!email.trim()) {
      onShowToast?.('Informe seu e-mail.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setStep(2);
      onShowToast?.('Código enviado para o seu e-mail.', 'success');
    } catch (error) {
      onShowToast?.(error?.message || 'Erro ao enviar o código.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    if (!token.trim() || token.length !== 6) {
      onShowToast?.('Informe o código de 6 dígitos.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/auth/verify-token', { email: email.trim().toLowerCase(), token });
      setStep(3);
      onShowToast?.('Código validado.', 'success');
    } catch (error) {
      onShowToast?.(error?.message || 'Código inválido ou expirado.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      onShowToast?.('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      onShowToast?.('As senhas não conferem.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        token,
        newPassword,
      });
      Alert.alert('Sucesso', 'Senha redefinida com sucesso.');
      onBack();
    } catch (error) {
      onShowToast?.(error?.message || 'Erro ao redefinir a senha.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.card, isDarkMode && styles.cardDark]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={isDarkMode ? '#e2e8f0' : '#0f172a'} />
        </TouchableOpacity>

        <View style={styles.logoCenter}>
          <LogoBadge size={60} isDarkMode={isDarkMode} />
        </View>

        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          {step === 1 ? 'Recuperar senha' : step === 2 ? 'Verificar código' : 'Nova senha'}
        </Text>

        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          {step === 1
            ? 'Informe seu e-mail para receber um código de verificação.'
            : step === 2
              ? 'Digite o código de 6 dígitos enviado para o seu e-mail.'
              : 'Defina uma nova senha para sua conta.'}
        </Text>

        {step === 1 && (
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="E-mail"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}

        {step === 2 && (
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="Código de 6 dígitos"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={token}
            onChangeText={(text) => setToken(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
        )}

        {step === 3 && (
          <>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput, isDarkMode && styles.inputDark]}
                placeholder="Nova senha"
                placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput, isDarkMode && styles.inputDark]}
                placeholder="Confirmar senha"
                placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.eyeBtn}>
                <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, isDarkMode && styles.buttonDark]}
          onPress={step === 1 ? requestOtp : step === 2 ? verifyOtp : resetPassword}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{step === 1 ? 'Enviar código' : step === 2 ? 'Validar código' : 'Redefinir senha'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f8fafc', padding: 16 },
  containerDark: { backgroundColor: '#020617' },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 24, elevation: 8 },
  cardDark: { backgroundColor: '#111827' },
  backBtn: { marginBottom: 10 },
  logoCenter: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  titleDark: { color: '#e2e8f0' },
  subtitle: { marginTop: 8, color: '#475569', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  subtitleDark: { color: '#94a3b8' },
  input: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    marginBottom: 20,
    color: '#0f172a',
  },
  inputDark: { backgroundColor: '#0f172a', color: '#e2e8f0' },
  passwordInputWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDark: { backgroundColor: '#1d4ed8' },
  buttonText: { color: '#ffffff', fontWeight: '800' },
});