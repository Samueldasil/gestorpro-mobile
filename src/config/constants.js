/**
 * Constantes centralizadas do aplicativo
 * Evita números mágicos e duplicações
 */

// Validação
export const MIN_PASSWORD_LENGTH = 6;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API
export const API_TIMEOUT_SHORT = 15000;    // 15 segundos para requisições rápidas
// Salvar orçamento é a requisição mais pesada: precisa de MAIS tempo que o
// padrão, não menos (antes eram 30s, que cortavam o salvamento em servidor frio).
export const API_TIMEOUT_LONG = 90000;     // 90 segundos para orçamentos
export const API_TIMEOUT_DEFAULT = 60000;  // 60 segundos: margem para o servidor acordar (Render free)

// Cálculos
export const MINUTES_PER_HOUR = 60;
export const MONTHS_PER_YEAR = 12;

// UI
export const TOAST_DURATION = 3000;
export const DEBOUNCE_DELAY = 500;

// Colors
export const COLORS = {
  light: {
    bg: '#f8fafc',
    bgSecondary: '#f1f5f9',
    card: '#ffffff',
    text: '#0f172a',
    subtext: '#475569',
    placeholder: '#94a3b8',
    border: '#e2e8f0',
    primary: '#2563eb',
    success: '#16a34a',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  dark: {
    bg: '#020617',
    bgSecondary: '#0f172a',
    card: '#111827',
    text: '#e2e8f0',
    subtext: '#cbd5e1',
    placeholder: '#64748b',
    border: '#334155',
    primary: '#1d4ed8',
    success: '#15803d',
    error: '#dc2626',
    warning: '#ea580c',
  }
};

// Tab names
export const TABS = {
  ORCAMENTO: 'orcamento',
  HISTORICO: 'historico',
  MACRO: 'macro',
  PERFIL: 'perfil',
  PRIVACIDADE: 'privacidade'
};

// Auth modes
export const AUTH_MODES = {
  LOGIN: 'login',
  REGISTER: 'register'
};

// Modo de custo
export const MODO_CUSTO = {
  AUTOMATICO: 'automatico',
  MANUAL: 'manual'
};

// Tipo de preço
export const TIPOS_PRECO = [
  { label: 'Receita total', value: 'total' },
  { label: 'por Kg', value: 'kg' },
  { label: 'por Litro', value: 'l' },
  { label: 'por Unidade', value: 'un' }
];

// Unidades
export const UNIDADES_PRODUTO = ['un', 'kg', 'g', 'l', 'ml'];
export const UNIDADES_LOTE = ['kg', 'g', 'l', 'ml', 'un'];
