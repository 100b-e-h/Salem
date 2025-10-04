export const APP_CONFIG = {
  name: "Salem",
  description: "Sistema de Controle Financeiro Pessoal",
  version: "1.0.0",
  currency: "BRL",
  timezone: "America/Rio_Branco", // UTC-5
  locale: "pt-BR",
};

export const FINANCIAL_CONFIG = {
  // Configurações de cálculo
  DAYS_PER_YEAR: 365,
  DEFAULT_INTEREST_RATE: 0,
  MAX_INSTALLMENTS: 60,
  MIN_INSTALLMENT_VALUE: 5.0,

  // Configurações de limite
  LIMIT_WARNING_THRESHOLD: 0.8, // 80%
  LIMIT_DANGER_THRESHOLD: 0.9, // 90%

  // Configurações de alerta
  SUBSCRIPTION_ALERT_DAYS: 3,
  INVOICE_DUE_ALERT_DAYS: 7,

  // Configurações de visualização
  CALENDAR_MONTHS_HISTORY: 3,
  CALENDAR_MONTHS_FUTURE: 3,
  DEFAULT_PAGE_SIZE: 20,
};

export const UI_CONFIG = {
  // Cores do tema
  colors: {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#6366f1",
  },

  // Breakpoints
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};

export const ACCOUNT_TYPES = [
  { value: "corrente", label: "Conta Corrente", icon: "🏦" },
  { value: "poupanca", label: "Poupança", icon: "🐷" },
  { value: "carteira", label: "Carteira", icon: "👛" },
  { value: "corretora", label: "Corretora", icon: "📊" },
] as const;

export const CARD_BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "American Express" },
  { value: "hipercard", label: "Hipercard" },
  { value: "outros", label: "Outros" },
] as const;

export const TRANSACTION_TYPES = [
  { value: "despesa", label: "Despesa", icon: "💸", color: "text-red-600" },
  { value: "receita", label: "Receita", icon: "💰", color: "text-green-600" },
  {
    value: "transferencia",
    label: "Transferência",
    icon: "🔄",
    color: "text-blue-600",
  },
] as const;

export const RECURRENCE_TYPES = [
  { value: "fixa", label: "Recorrente Fixa", icon: "⚙️" },
  { value: "assinatura", label: "Assinatura", icon: "♻️" },
] as const;

export const INVOICE_STATUSES = [
  { value: "prevista", label: "Prevista", variant: "info" },
  { value: "fechada", label: "Fechada", variant: "warning" },
  { value: "paga", label: "Paga", variant: "success" },
] as const;

export const INSTALLMENT_STATUSES = [
  { value: "prevista", label: "Prevista", variant: "info" },
  { value: "lancada", label: "Lançada", variant: "warning" },
  { value: "quitada", label: "Quitada", variant: "success" },
] as const;

export const SUBSCRIPTION_STATUSES = [
  { value: "ativa", label: "Ativa", variant: "success" },
  { value: "pausada", label: "Pausada", variant: "warning" },
  { value: "cancelada", label: "Cancelada", variant: "danger" },
] as const;

export const ASSET_TYPES = [
  { value: "poupanca", label: "Poupança", icon: "🐷" },
  { value: "cdb", label: "CDB", icon: "🏦" },
  { value: "tesouro", label: "Tesouro Direto", icon: "🏛️" },
  { value: "saldo_corrente_rendido", label: "Conta Remunerada", icon: "💳" },
  { value: "outro", label: "Outros", icon: "📊" },
] as const;

export const RATE_METHODS = [
  { value: "fixa_anual", label: "Taxa Fixa Anual" },
  { value: "fixa_diaria", label: "Taxa Fixa Diária" },
  { value: "percentual_de_indice", label: "Percentual de Índice" },
] as const;

export const INDEX_TYPES = [
  { value: "CDI", label: "CDI" },
  { value: "Selic", label: "SELIC" },
  { value: "outro", label: "Outro" },
] as const;

export const VALIDATION_RULES = {
  account: {
    name: { required: true, minLength: 2, maxLength: 100 },
    balance: { required: true, type: "number" },
  },
  card: {
    alias: { required: true, minLength: 2, maxLength: 50 },
    totalLimit: { required: true, type: "number", min: 100 },
    closingDay: { required: true, type: "number", min: 1, max: 31 },
    dueDay: { required: true, type: "number", min: 1, max: 31 },
  },
  transaction: {
    amount: { required: true, type: "number", min: 0.01 },
    description: { required: true, minLength: 1, maxLength: 200 },
  },
  installment: {
    totalAmount: { required: true, type: "number", min: 1 },
    installmentCount: { required: true, type: "number", min: 2, max: 60 },
    monthlyInterest: { required: false, type: "number", min: 0, max: 50 },
  },
};

export const DATE_FORMATS = {
  display: "dd/MM/yyyy",
  displayShort: "dd/MM",
  displayMonth: "MMM/yyyy",
  displayFull: "dd/MM/yyyy HH:mm",
  api: "yyyy-MM-dd",
  competence: "yyyy-MM",
} as const;

export const MESSAGES = {
  errors: {
    required: "Este campo é obrigatório",
    invalid: "Valor inválido",
    network: "Erro de conexão. Tente novamente.",
    notFound: "Item não encontrado",
    unauthorized: "Acesso não autorizado",
  },
  success: {
    created: "Item criado com sucesso",
    updated: "Item atualizado com sucesso",
    deleted: "Item excluído com sucesso",
    saved: "Salvo com sucesso",
  },
  loading: {
    default: "Carregando...",
    saving: "Salvando...",
    deleting: "Excluindo...",
  },
} as const;
