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
  
  const preco = toNumber(insumo.preco, NaN);
  const qtdLote = toNumber(insumo.qtdLote, NaN);
  const qtdUsada = toNumber(insumo.qtdUsada, NaN);

  if (!Number.isFinite(preco) || !Number.isFinite(qtdLote) || !Number.isFinite(qtdUsada)) {
    return 'Valores inválidos no ingrediente';
  }
  if (qtdLote <= 0) {
    return 'A quantidade do lote deve ser maior que zero';
  }
  if (qtdUsada <= 0) {
    return 'A quantidade usada deve ser maior que zero';
  }
  if (preco < 0) {
    return 'O preço do lote não pode ser negativo';
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

  // Mantém apenas dígitos e separadores decimais
  let str = String(value).replace(/[^0-9.,]/g, '');
  if (!str) return '';

  const separadores = (str.match(/[.,]/g) || []).length;

  // Um separador extra digitado no fim é ignorado, em vez de deslocar a vírgula
  // e transformar "10,5" em "105" na frente do usuário.
  if (separadores > 1 && /[.,]$/.test(str)) {
    str = str.slice(0, -1);
  }

  const ultimoSeparador = Math.max(str.lastIndexOf(','), str.lastIndexOf('.'));
  if (ultimoSeparador === -1) return str;

  // O último separador é o decimal; os anteriores eram separadores de milhar.
  const inteiro = str.slice(0, ultimoSeparador).replace(/[.,]/g, '');
  const decimal = str.slice(ultimoSeparador + 1).replace(/[.,]/g, '');

  return `${inteiro}.${decimal}`;
};

/**
 * Converte qualquer entrada do usuário ("1.234,56", "12,5", 10) em número.
 * Nunca devolve NaN — o que zerava cálculos em silêncio.
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
export const toNumber = (value, fallback = 0) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;

  const sanitized = sanitizeNumber(value);
  if (sanitized === '' || sanitized === '.') return fallback;

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : fallback;
};