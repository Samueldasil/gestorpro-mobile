/**
 * Funções de validação centralizadas
 * Evita duplicação de código de validação
 */

import { EMAIL_REGEX, MIN_PASSWORD_LENGTH } from '../config/constants';

/**
 * Valida um endereço de email
 * @param {string} email 
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateEmail = (email) => {
  if (!email?.trim()) {
    return 'E-mail é obrigatório';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'E-mail inválido';
  }
  return null;
};

/**
 * Valida uma senha
 * @param {string} password 
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Senha é obrigatória';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  return null;
};

/**
 * Valida se duas senhas são iguais
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'As senhas não coincidem';
  }
  return null;
};

/**
 * Valida um orçamento antes de salvar
 * @param {object} budget 
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateBudget = (budget) => {
  if (!budget?.nomeProduto?.trim()) {
    return 'Informe o nome do produto';
  }
  if (!Array.isArray(budget.insumos) || budget.insumos.length === 0) {
    return 'Adicione pelo menos um ingrediente';
  }
  if (isNaN(budget.precoVendaValor) || budget.precoVendaValor <= 0) {
    return 'Informe um preço de venda válido';
  }
  return null;
};

/**
 * Valida um ingrediente/insumo
 * @param {object} insumo 
 * @returns {string|null} - Mensagem de erro ou null se válido
 */
export const validateInsumo = (insumo) => {
  if (!insumo?.nome?.trim()) {
    return 'Nome do ingrediente é obrigatório';
  }
  if (!insumo.preco) {
    return 'Preço do ingrediente é obrigatório';
  }
  if (!insumo.qtdLote) {
    return 'Quantidade do lote é obrigatória';
  }
  if (!insumo.qtdUsada) {
    return 'Quantidade usada é obrigatória';
  }
  
  const preco = parseFloat(insumo.preco);
  const qtdLote = parseFloat(insumo.qtdLote);
  const qtdUsada = parseFloat(insumo.qtdUsada);
  
  if (isNaN(preco) || isNaN(qtdLote) || isNaN(qtdUsada) || qtdLote <= 0) {
    return 'Valores inválidos no ingrediente';
  }
  
  return null;
};

/**
 * Limpa e formata um número (converte vírgula em ponto e impede quebras)
 * @param {*} value 
 * @returns {string} - Número formatado ou string vazia
 */
export const sanitizeNumber = (value) => {
  // Correção do Bug do Zero: Aceita "0" como valor válido
  if (value === null || value === undefined) return '';
  
  // Limpa tudo que não for número ou ponto
  let str = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
  
  // Correção do Bug do NaN: Impede a digitação de múltiplos pontos (ex: 10.5.2)
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return str;
};

/**
 * Valida um número e retorna erro se inválido
 * @param {*} value 
 * @param {string} fieldName 
 * @returns {string|null} - Mensagem de erro ou null
 */
export const validateNumber = (value, fieldName = 'Campo') => {
  const sanitized = sanitizeNumber(value);
  if (sanitized === '') {
    return `${fieldName} inválido`;
  }
  return null;
};