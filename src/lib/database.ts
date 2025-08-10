// Sistema de armazenamento mock para desenvolvimento
// Em produção, isso seria substituído por um banco de dados real

import {
  Account,
  Card,
  Invoice,
  Category,
  Transaction,
  Recurrence,
  Subscription,
  Installment,
  InstallmentItem,
  Asset,
  AssetEvent,
  AssetDailyReturn,
} from "@/types";
import { generateId } from "@/utils/financial";

// Simulação de um banco de dados em memória
class MockDatabase {
  private accounts: Map<string, Account> = new Map();
  private cards: Map<string, Card> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private categories: Map<string, Category> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private recurrences: Map<string, Recurrence> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private installments: Map<string, Installment> = new Map();
  private installmentItems: Map<string, InstallmentItem> = new Map();
  private assets: Map<string, Asset> = new Map();
  private assetEvents: Map<string, AssetEvent> = new Map();
  private assetDailyReturns: Map<string, AssetDailyReturn> = new Map();

  // Inicializa com dados de exemplo
  constructor() {
    this.seedData();
  }

  private seedData() {
    // Categorias padrão
    const categories = [
      {
        name: "Alimentação",
        type: "despesa" as const,
        color: "#ef4444",
        icon: "🍽️",
      },
      {
        name: "Transporte",
        type: "despesa" as const,
        color: "#f97316",
        icon: "🚗",
      },
      {
        name: "Moradia",
        type: "despesa" as const,
        color: "#eab308",
        icon: "🏠",
      },
      { name: "Saúde", type: "despesa" as const, color: "#22c55e", icon: "🏥" },
      {
        name: "Educação",
        type: "despesa" as const,
        color: "#3b82f6",
        icon: "📚",
      },
      { name: "Lazer", type: "despesa" as const, color: "#8b5cf6", icon: "🎬" },
      {
        name: "Compras",
        type: "despesa" as const,
        color: "#ec4899",
        icon: "🛍️",
      },
      {
        name: "Serviços",
        type: "despesa" as const,
        color: "#64748b",
        icon: "⚙️",
      },
      {
        name: "Salário",
        type: "receita" as const,
        color: "#16a34a",
        icon: "💼",
      },
      {
        name: "Freelance",
        type: "receita" as const,
        color: "#059669",
        icon: "💻",
      },
      {
        name: "Investimentos",
        type: "receita" as const,
        color: "#0d9488",
        icon: "📈",
      },
      {
        name: "Outros",
        type: "despesa" as const,
        color: "#6b7280",
        icon: "📦",
      },
    ];

    categories.forEach((cat) => {
      const category: Category = {
        id: generateId(),
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.categories.set(category.id, category);
    });

    // Conta de exemplo
    const account: Account = {
      id: generateId(),
      name: "Conta Corrente Principal",
      type: "corrente",
      balance: 5000,
      currency: "BRL",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.set(account.id, account);

    // Cartão de exemplo
    const card: Card = {
      id: generateId(),
      alias: "Nubank Roxinho",
      brand: "Mastercard",
      totalLimit: 10000,
      closingDay: 7,
      dueDay: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cards.set(card.id, card);

    // Fatura atual
    const currentDate = new Date();
    const yearMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const invoice: Invoice = {
      id: generateId(),
      cardId: card.id,
      yearMonth,
      status: "prevista",
      totalForecast: 2500,
      totalClosed: 0,
      totalPaid: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(invoice.id, invoice);

    // Atualiza o cartão com a fatura atual
    card.currentInvoiceId = invoice.id;
    this.cards.set(card.id, card);
  }

  // Métodos para Accounts
  async createAccount(
    account: Omit<Account, "id" | "createdAt" | "updatedAt">
  ): Promise<Account> {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.set(newAccount.id, newAccount);
    return newAccount;
  }

  async getAccount(id: string): Promise<Account | null> {
    return this.accounts.get(id) || null;
  }

  async getAllAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async updateAccount(
    id: string,
    updates: Partial<Account>
  ): Promise<Account | null> {
    const account = this.accounts.get(id);
    if (!account) return null;

    const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Métodos para Cards
  async createCard(
    card: Omit<Card, "id" | "createdAt" | "updatedAt">
  ): Promise<Card> {
    const newCard: Card = {
      ...card,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cards.set(newCard.id, newCard);
    return newCard;
  }

  async getCard(id: string): Promise<Card | null> {
    return this.cards.get(id) || null;
  }

  async getAllCards(): Promise<Card[]> {
    return Array.from(this.cards.values());
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | null> {
    const card = this.cards.get(id);
    if (!card) return null;

    const updatedCard = { ...card, ...updates, updatedAt: new Date() };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteCard(id: string): Promise<boolean> {
    return this.cards.delete(id);
  }

  // Métodos para Categories
  async createCategory(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">
  ): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async getCategory(id: string): Promise<Category | null> {
    return this.categories.get(id) || null;
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<Category | null> {
    const category = this.categories.get(id);
    if (!category) return null;

    const updatedCategory = { ...category, ...updates, updatedAt: new Date() };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Métodos para Transactions
  async createTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransactionsByDate(
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) =>
        transaction.date >= startDate && transaction.date <= endDate
    );
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;

    const updatedTransaction = {
      ...transaction,
      ...updates,
      updatedAt: new Date(),
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Métodos para Invoices
  async createInvoice(
    invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">
  ): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(newInvoice.id, newInvoice);
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) || null;
  }

  async getInvoicesByCard(cardId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.cardId === cardId
    );
  }

  async updateInvoice(
    id: string,
    updates: Partial<Invoice>
  ): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    if (!invoice) return null;

    const updatedInvoice = { ...invoice, ...updates, updatedAt: new Date() };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Métodos para Installments
  async createInstallment(
    installment: Omit<Installment, "id" | "createdAt" | "updatedAt">
  ): Promise<Installment> {
    const newInstallment: Installment = {
      ...installment,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.installments.set(newInstallment.id, newInstallment);
    return newInstallment;
  }

  async getInstallment(id: string): Promise<Installment | null> {
    return this.installments.get(id) || null;
  }

  async getAllInstallments(): Promise<Installment[]> {
    return Array.from(this.installments.values());
  }

  async getInstallmentsByCard(cardId: string): Promise<Installment[]> {
    return Array.from(this.installments.values()).filter(
      (installment) => installment.cardId === cardId
    );
  }

  async updateInstallment(
    id: string,
    updates: Partial<Installment>
  ): Promise<Installment | null> {
    const installment = this.installments.get(id);
    if (!installment) return null;

    const updatedInstallment = {
      ...installment,
      ...updates,
      updatedAt: new Date(),
    };
    this.installments.set(id, updatedInstallment);
    return updatedInstallment;
  }

  async deleteInstallment(id: string): Promise<boolean> {
    return this.installments.delete(id);
  }

  // Limpar todos os dados (útil para testes)
  async clearAll(): Promise<void> {
    this.accounts.clear();
    this.cards.clear();
    this.invoices.clear();
    this.categories.clear();
    this.transactions.clear();
    this.recurrences.clear();
    this.subscriptions.clear();
    this.installments.clear();
    this.installmentItems.clear();
    this.assets.clear();
    this.assetEvents.clear();
    this.assetDailyReturns.clear();
    this.seedData();
  }
}

// Instância singleton do banco de dados mock
export const mockDb = new MockDatabase();
