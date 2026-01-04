import type { CentavosValue, ReaisValue } from "@/utils/money";

export type {
  Account as DrizzleAccount,
  Card as DrizzleCard,
  Invoice as DrizzleInvoice,
  NewAccount,
  NewCard,
  NewInvoice,
} from "@/lib/schema";

export interface Account {
  accountId: string;
  name: string;
  type: "corrente" | "poupanca" | "carteira" | "corretora";
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  cardId: string;
  alias: string;
  brand: string;
  totalLimit: number;
  closingDay: number;
  dueDay: number;
  currentInvoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = "open" | "paid" | "overdue";

export interface Invoice {
  invoiceId: string;
  cardId: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountDisplay {
  accountId: string;
  name: string;
  type: "corrente" | "poupanca" | "carteira" | "corretora";
  balance: CentavosValue;
  balanceInReais: ReaisValue;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardDisplay {
  accountId: string;
  alias: string;
  brand: string;
  totalLimit: CentavosValue;
  totalLimitInReais: ReaisValue;
  closingDay: number;
  dueDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDisplay {
  invoiceId: string;
  cardId: string;
  month: number;
  year: number;
  totalAmount: CentavosValue;
  totalAmountInReais: ReaisValue;
  paidAmount: CentavosValue;
  paidAmountInReais: ReaisValue;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  category_id: string;
  name: string;
  type: "despesa" | "receita";
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = "despesa" | "receita" | "transferencia";
export type FinanceType = "installment" | "upfront" | "subscription";

export interface Transaction {
  transactionId: string;
  date: Date;
  sourceAccountId?: string;
  destinationAccountId?: string;
  cardId?: string;
  invoiceId?: string;
  installmentsId?: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  category?: string;
  tags: string[];
  description: string;
  reconciled: boolean;
  installments?: number;
  currentInstallment?: number;
  parentTransactionId?: string;
  financeType?: FinanceType;
  sharedWith?: Array<{ id: string; email: string; paid: boolean }>;
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
  indexation?: "fixo" | number;
  rrule: string;
  nextDate: Date;
  endDate?: Date;
  status: RecurrenceStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription extends Recurrence {
  chargeDay: number;
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
  installmentId: string;
  userId: string;
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
  indexRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
