/**
 * Formata uma string de data para exibição (apenas data, sem hora)
 * Usa UTC para evitar conversão de timezone
 * Aceita tanto strings de data (YYYY-MM-DD) quanto timestamps completos
 * @param dateString String de data ou timestamp ISO
 * @param locale Locale para formatação (padrão: 'pt-BR')
 * @returns Data formatada (ex: "05/01/2026")
 */
export function formatDateOnly(dateString: string | Date, locale: string = 'pt-BR'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  // Use UTC date components to avoid timezone conversion
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  // Format as YYYY-MM-DD and then format with locale
  const utcDateString = `${year}-${month}-${day}`;
  return new Date(utcDateString + 'T00:00:00').toLocaleDateString(locale);
}

export interface InvoicePeriod {
  month: number;
  year: number;
  closingDate: Date;
  dueDate: Date;
}

/**
 * Calcula qual fatura uma transação deve pertencer baseada na data da transação e no dia de fechamento do cartão
 */
export function calculateInvoicePeriod(
  transactionDate: Date,
  closingDay: number,
  dueDay: number
): InvoicePeriod {
  const transactionMonth = transactionDate.getMonth();
  const transactionYear = transactionDate.getFullYear();
  const transactionDay = transactionDate.getDate();

  let invoiceMonth = transactionMonth;
  let invoiceYear = transactionYear;

  // Se a transação foi feita após o dia de fechamento, vai para a próxima fatura
  if (transactionDay > closingDay) {
    invoiceMonth += 1;
    if (invoiceMonth > 11) {
      invoiceMonth = 0;
      invoiceYear += 1;
    }
  }

  // Data de fechamento da fatura
  const closingDate = new Date(invoiceYear, invoiceMonth, closingDay);

  // Data de vencimento da fatura
  let dueMonth = invoiceMonth;
  let dueYear = invoiceYear;

  // Se o dia de vencimento for menor que o dia de fechamento, vai para o próximo mês
  if (dueDay < closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  const dueDate = new Date(dueYear, dueMonth, dueDay);

  return {
    month: invoiceMonth + 1, // Convertendo para 1-12
    year: invoiceYear,
    closingDate,
    dueDate,
  };
}

/**
 * Determina se uma fatura está em aberto (não paga)
 */
export function isInvoiceOpen(invoice: {
  status: string;
  paidAmount: number;
  totalAmount: number;
}): boolean {
  return invoice.status === "open" && invoice.paidAmount < invoice.totalAmount;
}

/**
 * Formata a data para o formato de timestamp com timezone usado no banco de dados
 * Preserva o horário e timezone completo
 */
export function formatDateForDb(date: Date): string {
  return date.toISOString();
}

/**
 * Normaliza uma string de data para ISO timestamp UTC
 * Aceita tanto YYYY-MM-DD quanto ISO 8601 completo
 * Sempre retorna timestamp UTC at midnight (00:00:00.000Z)
 */
export function normalizeDateString(dateString: string): string {
  // Se já é um ISO timestamp completo, extrair a data e normalizar para midnight UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
  
  // Se é date-only format, converter para midnight UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T00:00:00.000Z`;
  }
  
  // Fallback: tentar parsear e normalizar para midnight UTC
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}
