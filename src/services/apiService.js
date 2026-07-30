import axios from 'axios';

const API_BASE_URL = 'https://gestorpro-api-gzjg.onrender.com';

// Timeout fixado em 60.000 milissegundos (60 segundos)
const api = axios.create({ 
  baseURL: API_BASE_URL, 
  timeout: 60000 
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

// A BLINDAGEM MÁXIMA CONTRA CRASHES: Interceptador de Erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // O Axios cria um erro gigante e circular que mata o React Native.
    // Aqui nós destruímos o objeto e passamos pra frente só a mensagem de texto limpa!
    const errorMessage = error?.response?.data?.error || error?.message || 'Erro desconhecido na API';
    const safeError = new Error(errorMessage);
    safeError.status = error?.response?.status;

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