import { API_TIMEOUT_LONG } from '../config/constants';
import api from '../services/apiService';

// --- Endpoints de Autenticação ---
export async function registerUser(email, password) {
  // Caminho exato que o Render espera
  const response = await api.post('/api/auth/register', { email, password });
  return response.data;
}

export async function loginUser(email, password) {
  // Caminho exato que o Render espera
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
}

// Rota de recuperação de senha corrigida
export async function forgotPassword(email) {
  // Caminho exato que o Render espera
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
}

// --- Endpoints de Negócio (exigem Token) ---
export async function saveBudget(payload) {
  // Adicionado o /api conforme o index.js do backend
  const response = await api.post('/api/budget', payload, { timeout: API_TIMEOUT_LONG });
  return response.data;
}

export async function getHistory() {
  // Adicionado o /api conforme o index.js do backend
  const response = await api.get('/api/history');
  return response.data;
}

export async function deleteBudget(id) {
  // Adicionado o /api conforme o index.js do backend
  const response = await api.delete(`/api/budget/${id}`);
  return response.data;
}