import { eq, and, desc } from "drizzle-orm";
import { db } from "./drizzle";
import {
  accounts,
  cards,
  invoices,
  type Account,
  type Card,
  type Invoice,
  type NewAccount,
  type NewCard,
  type NewInvoice,
} from "./schema";
import { reaisToCentavos, centavosToReais } from "@/utils/money";

class DrizzleDatabase {
  async getAllAccounts(userId: string): Promise<Account[]> {
    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));

    return result;
  }

  async getAccountById(id: string, userId: string): Promise<Account | null> {
    const result = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .limit(1);

    return result[0] || null;
  }

  async createAccount(
    accountData: {
      name: string;
      type: "corrente" | "poupanca" | "carteira" | "corretora";
      balance: number; // Valor em CENTAVOS
      currency?: string;
    },
    userId: string
  ): Promise<Account> {
    const newAccount: NewAccount = {
      userId,
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance, // Já em centavos
      currency: accountData.currency || "BRL",
    };

    const result = await db.insert(accounts).values(newAccount).returning();

    return result[0];
  }

  async updateAccount(
    id: string,
    accountData: {
      name?: string;
      type?: "corrente" | "poupanca" | "carteira" | "corretora";
      balance?: number; // Valor em CENTAVOS
      currency?: string;
    },
    userId: string
  ): Promise<Account> {
    const updateData: Partial<NewAccount> = {};

    if (accountData.name) updateData.name = accountData.name;
    if (accountData.type) updateData.type = accountData.type;
    if (accountData.balance !== undefined)
      updateData.balance = accountData.balance;
    if (accountData.currency) updateData.currency = accountData.currency;

    const result = await db
      .update(accounts)
      .set(updateData)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();

    return result[0];
  }

  async deleteAccount(id: string, userId: string): Promise<void> {
    await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  }

  async getAllCards(userId: string): Promise<Card[]> {
    const result = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, userId))
      .orderBy(desc(cards.createdAt));

    return result;
  }

  async getCardById(id: string, userId: string): Promise<Card | null> {
    const result = await db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), eq(cards.userId, userId)))
      .limit(1);

    return result[0] || null;
  }

  async createCard(
    cardData: {
      alias: string;
      brand: string;
      totalLimit: number; // Valor em REAIS (será convertido para centavos)
      closingDay: number;
      dueDay: number;
    },
    userId: string
  ): Promise<Card> {
    const newCard: NewCard = {
      userId,
      alias: cardData.alias,
      brand: cardData.brand,
      totalLimit: reaisToCentavos(cardData.totalLimit), // Converte para centavos
      closingDay: cardData.closingDay,
      dueDay: cardData.dueDay,
    };

    const result = await db.insert(cards).values(newCard).returning();

    return result[0];
  }

  async updateCard(
    id: string,
    cardData: {
      alias?: string;
      brand?: string;
      totalLimit?: number; // Valor em REAIS (será convertido para centavos)
      closingDay?: number;
      dueDay?: number;
    },
    userId: string
  ): Promise<Card> {
    const updateData: Partial<NewCard> = {};

    if (cardData.alias) updateData.alias = cardData.alias;
    if (cardData.brand) updateData.brand = cardData.brand;
    if (cardData.totalLimit !== undefined)
      updateData.totalLimit = reaisToCentavos(cardData.totalLimit);
    if (cardData.closingDay) updateData.closingDay = cardData.closingDay;
    if (cardData.dueDay) updateData.dueDay = cardData.dueDay;

    const result = await db
      .update(cards)
      .set(updateData)
      .where(and(eq(cards.id, id), eq(cards.userId, userId)))
      .returning();

    return result[0];
  }

  async deleteCard(id: string, userId: string): Promise<void> {
    await db
      .delete(cards)
      .where(and(eq(cards.id, id), eq(cards.userId, userId)));
  }

  async getAllInvoices(userId: string): Promise<Invoice[]> {
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.year), desc(invoices.month));

    return result;
  }

  async getInvoicesByCard(cardId: string, userId: string): Promise<Invoice[]> {
    const result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.cardId, cardId), eq(invoices.userId, userId)))
      .orderBy(desc(invoices.year), desc(invoices.month));

    return result;
  }

  async createInvoice(
    invoiceData: {
      cardId: string;
      month: number;
      year: number;
      totalAmount: number; // Valor em REAIS (será convertido para centavos)
      paidAmount?: number; // Valor em REAIS (será convertido para centavos)
      dueDate: string; // YYYY-MM-DD format
      status?: "open" | "paid" | "overdue";
    },
    userId: string
  ): Promise<Invoice> {
    const newInvoice: NewInvoice = {
      userId,
      cardId: invoiceData.cardId,
      month: invoiceData.month,
      year: invoiceData.year,
      totalAmount: reaisToCentavos(invoiceData.totalAmount), // Converte para centavos
      paidAmount: reaisToCentavos(invoiceData.paidAmount || 0), // Converte para centavos
      dueDate: invoiceData.dueDate,
      status: invoiceData.status || "open",
    };

    const result = await db.insert(invoices).values(newInvoice).returning();

    return result[0];
  }

  async updateInvoice(
    id: string,
    invoiceData: {
      totalAmount?: number; // Valor em REAIS (será convertido para centavos)
      paidAmount?: number; // Valor em REAIS (será convertido para centavos)
      dueDate?: string;
      status?: "open" | "paid" | "overdue";
    },
    userId: string
  ): Promise<Invoice> {
    const updateData: Partial<NewInvoice> = {};

    if (invoiceData.totalAmount !== undefined)
      updateData.totalAmount = reaisToCentavos(invoiceData.totalAmount);
    if (invoiceData.paidAmount !== undefined)
      updateData.paidAmount = reaisToCentavos(invoiceData.paidAmount);
    if (invoiceData.dueDate) updateData.dueDate = invoiceData.dueDate;
    if (invoiceData.status) updateData.status = invoiceData.status;

    const result = await db
      .update(invoices)
      .set(updateData)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    return result[0];
  }

  async deleteInvoice(id: string, userId: string): Promise<void> {
    await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  }

  formatAccountForDisplay(account: Account) {
    return {
      ...account,
      balanceInReais: centavosToReais(account.balance),
    };
  }

  /**
   * Converte os valores monetários de um cartão de centavos para reais para exibição
   */
  formatCardForDisplay(card: Card) {
    return {
      ...card,
      totalLimitInReais: centavosToReais(card.totalLimit),
    };
  }

  /**
   * Converte os valores monetários de uma fatura de centavos para reais para exibição
   */
  formatInvoiceForDisplay(invoice: Invoice) {
    return {
      ...invoice,
      totalAmountInReais: centavosToReais(invoice.totalAmount),
      paidAmountInReais: centavosToReais(invoice.paidAmount),
    };
  }

  async clearUserData(userId: string): Promise<void> {
    // Deletar faturas primeiro (por causa das foreign keys)
    await db.delete(invoices).where(eq(invoices.userId, userId));

    // Deletar cartões
    await db.delete(cards).where(eq(cards.userId, userId));

    // Deletar contas
    await db.delete(accounts).where(eq(accounts.userId, userId));
  }
}

export const drizzleDb = new DrizzleDatabase();
export { DrizzleDatabase };
