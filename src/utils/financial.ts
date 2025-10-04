import {
  format,
  addDays,
  addMonths,
  isAfter,
  isBefore,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Calcula o rendimento diário com capitalização composta
 * @param principal Valor principal
 * @param dailyRate Taxa diária (ex: 0.0003 para 0.03% ao dia)
 * @param days Número de dias
 * @returns Valor final após o período
 */
export function calculateCompoundReturn(
  principal: number,
  dailyRate: number,
  days: number
): number {
  return principal * Math.pow(1 + dailyRate, days);
}

/**
 * Converte taxa anual para taxa diária
 * @param annualRate Taxa anual (ex: 0.12 para 12% ao ano)
 * @returns Taxa diária equivalente
 */
export function annualToDailyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 365) - 1;
}

/**
 * Calcula o rendimento diário de um ativo
 * @param currentBalance Saldo atual
 * @param dailyRate Taxa diária
 * @returns Rendimento do dia
 */
export function calculateDailyReturn(
  currentBalance: number,
  dailyRate: number
): number {
  return currentBalance * dailyRate;
}

/**
 * Calcula as parcelas de uma compra parcelada
 * @param totalAmount Valor total da compra
 * @param installments Número de parcelas
 * @param monthlyInterest Taxa de juros mensal (opcional)
 * @returns Array com valores das parcelas
 */
export function calculateInstallments(
  totalAmount: number,
  installments: number,
  monthlyInterest: number = 0
): number[] {
  if (monthlyInterest === 0) {
    // Sem juros - divide igualmente e distribui centavos nas primeiras parcelas
    const baseValue = Math.floor((totalAmount * 100) / installments) / 100;
    const remainder = Math.round(
      (totalAmount - baseValue * installments) * 100
    );

    const values: number[] = [];
    for (let i = 0; i < installments; i++) {
      const extraCent = i < remainder ? 0.01 : 0;
      values.push(baseValue + extraCent);
    }
    return values;
  } else {
    // Com juros - usa fórmula de financiamento
    const monthlyRate = monthlyInterest / 100;
    const coefficient = Math.pow(1 + monthlyRate, installments);
    const installmentValue =
      (totalAmount * monthlyRate * coefficient) / (coefficient - 1);

    return Array(installments).fill(Math.round(installmentValue * 100) / 100);
  }
}

/**
 * Calcula a competência da fatura baseada na data de compra e dia de fechamento
 * @param purchaseDate Data da compra
 * @param closingDay Dia de fechamento do cartão
 * @returns String no formato YYYY-MM da competência
 */
export function calculateInvoiceCompetence(
  purchaseDate: Date,
  closingDay: number
): string {
  const purchaseDay = purchaseDate.getDate();
  let competenceDate = new Date(purchaseDate);

  // Se a compra foi depois do fechamento, vai para a próxima fatura
  if (purchaseDay > closingDay) {
    competenceDate = addMonths(competenceDate, 1);
  }

  return format(competenceDate, "yyyy-MM");
}

/**
 * Calcula o limite comprometido futuro de um cartão
 * @param cardLimit Limite total do cartão
 * @param currentInvoiceAmount Valor da fatura atual
 * @param futureCommitments Compromissos futuros (parcelas e assinaturas)
 * @param horizonDays Horizonte em dias para considerar
 * @returns Limite disponível previsto
 */
export function calculateAvailableLimit(
  cardLimit: number,
  currentInvoiceAmount: number,
  futureCommitments: Array<{ date: Date; amount: number }>,
  horizonDays: number = 30
): number {
  const horizonDate = addDays(new Date(), horizonDays);

  const futureAmount = futureCommitments
    .filter((commitment) => isBefore(commitment.date, horizonDate))
    .reduce((sum, commitment) => sum + commitment.amount, 0);

  return cardLimit - currentInvoiceAmount - futureAmount;
}

/**
 * Formata valor monetário para Real brasileiro
 * @param amount Valor em número
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

/**
 * Formata porcentagem
 * @param value Valor decimal (ex: 0.12 para 12%)
 * @param decimals Número de casas decimais
 * @returns String formatada (ex: "12,00%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata data para exibição
 * @param date Data
 * @param pattern Padrão de formatação
 * @returns String formatada
 */
export function formatDate(date: Date, pattern: string = "dd/MM/yyyy"): string {
  return format(date, pattern, { locale: ptBR });
}

/**
 * Calcula próximas ocorrências de uma recorrência simples mensal
 * @param startDate Data inicial
 * @param dayOfMonth Dia do mês (1-31)
 * @param count Número de ocorrências
 * @returns Array de datas
 */
export function calculateMonthlyRecurrence(
  startDate: Date,
  dayOfMonth: number,
  count: number
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Ajusta para o dia do mês desejado
    currentDate.setDate(1); // Primeiro vai para o dia 1
    currentDate = addMonths(currentDate, i === 0 ? 0 : 1);

    // Ajusta para o dia desejado, considerando meses curtos
    const lastDayOfMonth = endOfMonth(currentDate).getDate();
    const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
    currentDate.setDate(targetDay);

    dates.push(new Date(currentDate));
  }

  return dates;
}

/**
 * Valida se uma data está no range de uma fatura
 * @param date Data a verificar
 * @param previousClosing Data do fechamento anterior
 * @param currentClosing Data do fechamento atual
 * @returns Boolean indicando se a data pertence à fatura
 */
export function isDateInInvoicePeriod(
  date: Date,
  previousClosing: Date,
  currentClosing: Date
): boolean {
  return isAfter(date, previousClosing) && !isAfter(date, currentClosing);
}

/**
 * Calcula juros compostos para antecipação de parcelas
 * @param futureValue Valor futuro da parcela
 * @param monthlyRate Taxa mensal
 * @param months Número de meses até o vencimento
 * @returns Valor presente (com desconto)
 */
export function calculatePresentValue(
  futureValue: number,
  monthlyRate: number,
  months: number
): number {
  if (monthlyRate === 0) return futureValue;
  return futureValue / Math.pow(1 + monthlyRate, months);
}

/**
 * Gera ID único simples (sem dependência externa)
 * @returns String única
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Agrupa transações por período
 * @param transactions Array de transações
 * @param period Período para agrupamento ('day' | 'month' | 'year')
 * @returns Map agrupado
 */
export function groupTransactionsByPeriod<
  T extends { date: Date; amount: number }
>(
  transactions: T[],
  period: "day" | "month" | "year"
): Map<string, { transactions: T[]; total: number }> {
  const groups = new Map<string, { transactions: T[]; total: number }>();

  const getKey = (date: Date): string => {
    switch (period) {
      case "day":
        return format(date, "yyyy-MM-dd");
      case "month":
        return format(date, "yyyy-MM");
      case "year":
        return format(date, "yyyy");
    }
  };

  transactions.forEach((transaction) => {
    const key = getKey(transaction.date);

    if (!groups.has(key)) {
      groups.set(key, { transactions: [], total: 0 });
    }

    const group = groups.get(key)!;
    group.transactions.push(transaction);
    group.total += transaction.amount;
  });

  return groups;
}
