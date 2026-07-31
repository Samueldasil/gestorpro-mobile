import axios from 'axios';
import { API_TIMEOUT_DEFAULT } from '../config/constants';

const API_BASE_URL = 'https://gestorpro-api-gzjg.onrender.com';

// Mantido em 60s: o servidor hiberna no plano gratuito do Render e a primeira
// requisição do dia pode demorar dezenas de segundos para acordar.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_DEFAULT
});

// Rotas públicas: um 401 aqui significa "credencial errada", não "sessão expirada".
const AUTH_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/verify-token',
  '/api/auth/reset-password'
];

// Handler global de sessão inválida, registrado pelo App.
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : null;
}

// Traduz falhas técnicas do axios para algo que o usuário entenda.
const mensagemAmigavel = (error) => {
  const respostaServidor =
    error?.response?.data?.error ||
    error?.response?.data?.message;

  if (respostaServidor) return String(respostaServidor);

  if (error?.code === 'ECONNABORTED') {
    return 'O servidor demorou demais para responder. Verifique sua conexão e tente de novo.';
  }

  // Sem response e sem status = a requisição nem chegou ao servidor.
  if (!error?.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet.';
  }

  const status = error.response.status;
  if (status >= 500) return 'O servidor está indisponível no momento. Tente novamente em instantes.';
  if (status === 404) return 'Recurso não encontrado no servidor.';

  // Um 401 sem corpo virava "Request failed with status code 401" na tela.
  if (status === 401 || status === 403) {
    const url = error?.config?.url || '';
    return AUTH_ROUTES.some((route) => url.includes(route))
      ? 'E-mail ou senha incorretos.'
      : 'Sua sessão expirou. Faça login novamente.';
  }

  return error?.message || 'Erro desconhecido na API';
};

// A BLINDAGEM MÁXIMA CONTRA CRASHES: Interceptador de Erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // O Axios cria um erro gigante e circular que mata o React Native.
    // Aqui nós destruímos o objeto e passamos pra frente só a mensagem de texto limpa!
    const safeError = new Error(mensagemAmigavel(error));
    safeError.status = error?.response?.status;
    safeError.code = error?.code;

    // Sessão expirada em qualquer rota autenticada derruba o login uma vez só,
    // em vez de cada tela precisar tratar 401 por conta própria.
    const url = error?.config?.url || '';
    const isAuthRoute = AUTH_ROUTES.some((route) => url.includes(route));
    if ((safeError.status === 401 || safeError.status === 403) && !isAuthRoute && onUnauthorized) {
      onUnauthorized(safeError);
    }

    // Devolve um erro JS puro e inofensivo para os seus blocos try/catch
    return Promise.reject(safeError);
  }
);

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;