/**
 * Utilitários para conversão de valores financeiros
 *
 * Convenção:
 * - Valores monetários são armazenados como INTEGER no banco (centavos)
 * - No frontend, valores são exibidos como DECIMAL (reais)
 * - Conversão: Real * 100 = Centavos | Centavos / 100 = Real
 */

/**
 * Converte valor em reais (decimal) para centavos (integer)
 * Usado ao SALVAR dados no banco
 *
 * @param reais - Valor em reais (ex: 10.50)
 * @returns Valor em centavos (ex: 1050)
 */
export function reaisToCentavos(reais: number): number {
  if (isNaN(reais) || !isFinite(reais)) {
    return 0;
  }
  return Math.round(reais * 100);
}

/**
 * Converte valor em centavos (integer) para reais (decimal)
 * Usado ao EXIBIR dados do banco
 *
 * @param centavos - Valor em centavos (ex: 1050)
 * @returns Valor em reais (ex: 10.50)
 */
export function centavosToReais(centavos: number): number {
  if (isNaN(centavos) || !isFinite(centavos)) {
    return 0;
  }
  return centavos / 100;
}

/**
 * Converte string de valor monetário para centavos
 * Remove caracteres não numéricos e converte
 *
 * @param valorString - String do valor (ex: "R$ 10,50" ou "10.50")
 * @returns Valor em centavos
 */
export function parseMoneyToCentavos(valorString: string): number {
  if (!valorString || typeof valorString !== "string") {
    return 0;
  }

  // Remove tudo exceto números, vírgulas e pontos
  const cleanValue = valorString.replace(/[^\d,.-]/g, "");

  // Substitui vírgula por ponto (formato brasileiro)
  const normalizedValue = cleanValue.replace(",", ".");

  // Converte para número
  const reais = parseFloat(normalizedValue);

  return reaisToCentavos(reais);
}

/**
 * Formata valor em centavos para exibição em reais
 *
 * @param centavos - Valor em centavos
 * @param options - Opções de formatação
 * @returns String formatada (ex: "R$ 10,50")
 */
export function formatCentavosToMoney(
  centavos: number,
  options: {
    showSymbol?: boolean;
    locale?: string;
    currency?: string;
  } = {}
): string {
  const { showSymbol = true, locale = "pt-BR", currency = "BRL" } = options;

  const reais = centavosToReais(centavos);

  if (showSymbol) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(reais);
  } else {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(reais);
  }
}

/**
 * Converte input de formulário para centavos
 * Útil para campos de input controlados
 *
 * @param event - Evento do input
 * @returns Valor em centavos
 */
export function handleMoneyInputToCentavos(
  event: React.ChangeEvent<HTMLInputElement>
): number {
  return parseMoneyToCentavos(event.target.value);
}

/**
 * Formata valor para exibição em input
 *
 * @param centavos - Valor em centavos
 * @returns String formatada para input (ex: "10.50")
 */
export function formatCentavosForInput(centavos: number): string {
  const reais = centavosToReais(centavos);
  return reais.toFixed(2);
}

/**
 * Utilitário para debugar conversões
 */
export function debugMoneyConversion(
  value: number,
  type: "reais" | "centavos"
) {
  if (type === "reais") {
    console.log(`${value} reais = ${reaisToCentavos(value)} centavos`);
  } else {
    console.log(`${value} centavos = ${centavosToReais(value)} reais`);
  }
}

export type CentavosValue = number;
export type ReaisValue = number;
