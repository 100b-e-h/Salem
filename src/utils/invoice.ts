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
 * Formata a data para o formato YYYY-MM-DD usado no banco de dados
 */
export function formatDateForDb(date: Date): string {
  return date.toISOString().split("T")[0];
}
