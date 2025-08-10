// Tipos base para o sistema Salem

export interface Account {
  id: string;
  name: string;
  type: "corrente" | "poupanca" | "carteira" | "corretora";
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  alias: string;
  brand: string;
  totalLimit: number;
  closingDay: number; // Dia do fechamento da fatura (1-31)
  dueDay: number; // Dia do vencimento da fatura (1-31)
  currentInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = "prevista" | "fechada" | "paga";

export interface Invoice {
  id: string;
  cardId: string;
  yearMonth: string; // YYYY-MM
  status: InvoiceStatus;
  totalForecast: number;
  totalClosed: number;
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: "despesa" | "receita";
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = "despesa" | "receita" | "transferencia";

export interface Transaction {
  id: string;
  date: Date;
  sourceAccountId?: string;
  destinationAccountId?: string;
  cardId?: string;
  invoiceId?: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  tags: string[];
  description: string;
  reconciled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RecurrenceType = "fixa" | "assinatura";
export type RecurrenceStatus = "ativa" | "pausada" | "cancelada";
export type RecurrenceSource = "conta" | "cartao";

export interface Recurrence {
  id: string;
  type: RecurrenceType;
  source: RecurrenceSource;
  accountId?: string;
  cardId?: string;
  amount: number;
  categoryId: string;
  description: string;
  vendor: string;
  indexation?: "fixo" | number; // Percentual de reajuste
  rrule: string; // RRULE do iCal
  nextDate: Date;
  endDate?: Date;
  status: RecurrenceStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription extends Recurrence {
  chargeDay: number; // Dia da cobrança (1-31)
  currentValue: number;
  priceHistory: Array<{
    date: Date;
    amount: number;
    reason?: string;
  }>;
  tryNextInvoiceIfAfterClosing: boolean;
}

export type InstallmentStatus = "prevista" | "lancada" | "quitada";

export interface Installment {
  id: string;
  cardId: string;
  purchaseDate: Date;
  totalAmount: number;
  installmentCount: number;
  monthlyInterest: number;
  firstDueDate: Date;
  description: string;
  vendor: string;
  categoryId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallmentItem {
  id: string;
  installmentId: string;
  installmentNumber: number;
  yearMonth: string; // YYYY-MM
  amount: number;
  status: InstallmentStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetType =
  | "poupanca"
  | "cdb"
  | "tesouro"
  | "saldo_corrente_rendido"
  | "outro";
export type RateMethod = "fixa_anual" | "fixa_diaria" | "percentual_de_indice";
export type IndexType = "CDI" | "Selic" | "outro";

export interface Asset {
  id: string;
  accountId: string;
  type: AssetType;
  name: string;
  principal: number;
  rateMethod: RateMethod;
  indexName?: IndexType;
  indexPercent?: number; // Percentual do índice (ex: 100% do CDI)
  annualRate?: number; // Taxa anual fixa
  dailyRate?: number; // Taxa diária fixa
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetEventType = "aporte" | "resgate" | "troca_taxa" | "ajuste";

export interface AssetEvent {
  id: string;
  assetId: string;
  date: Date;
  type: AssetEventType;
  amount?: number; // Para aportes/resgates
  newRate?: number; // Para troca de taxa
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetDailyReturn {
  id: string;
  assetId: string;
  date: Date;
  dailyReturn: number;
  endBalance: number;
  indexRate?: number; // Taxa do índice do dia (se aplicável)
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para o frontend
export interface DashboardData {
  currentInvoiceForecast: number;
  nextInvoiceForecast: number;
  upcomingCommitments: Array<{
    date: Date;
    type: "recorrente" | "assinatura" | "parcela";
    description: string;
    amount: number;
    vendor: string;
  }>;
  monthlyReturn: number;
  totalAssets: number;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  type: "recorrente" | "assinatura" | "parcela" | "transacao";
  description: string;
  amount: number;
  vendor?: string;
  status: "previsto" | "lancado" | "quitado";
  cardId?: string;
  accountId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  totalAssets: number;
  totalCreditUsed: number;
  totalCreditAvailable: number;
}

// Utilitários para filtros
export interface FilterOptions {
  dateFrom?: Date;
  dateTo?: Date;
  accountIds?: string[];
  cardIds?: string[];
  categoryIds?: string[];
  tags?: string[];
  types?: TransactionType[];
  status?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
