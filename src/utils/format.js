/**
 * Formata valores para o padrão brasileiro (IBGE):
 * - Separador de milhares: ponto (.)
 * - Separador decimal: vírgula (,)
 * Exemplo: 1000.50 -> R$ 1.000,50
 */

// Nem todo build Android traz o ICU completo: quando Intl falha, formatar
// dinheiro derrubava qualquer tela que mostrasse valores. O fallback manual
// garante que a tela continue de pé.
let intlDisponivel = true;

const formatarManualmente = (value) => {
  const negativo = value < 0;
  const [inteiro, decimal] = Math.abs(value).toFixed(2).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${comMilhar},${decimal}`;
};

export function formatMoney(value) {
  const number = typeof value === 'number' ? value : parseFloat(value);

  if (!Number.isFinite(number)) return 'R$ 0,00';

  if (intlDisponivel) {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }).format(number);
    } catch (error) {
      // Uma falha basta para desligar o Intl no resto da sessão.
      intlDisponivel = false;
      console.warn('Intl indisponível, usando formatação manual:', error?.message);
    }
  }

  return formatarManualmente(number);
}

/**
 * Converte uma data do servidor em texto pt-BR.
 * Datas ausentes ou inválidas viravam "Invalid Date" na tela e no PDF —
 * agora caem no fallback.
 */
export function formatDate(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return fallback;

  try {
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${date.getFullYear()}`;
  }
}
