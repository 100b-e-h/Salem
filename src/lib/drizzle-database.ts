import { eq, and, desc, or, gte, gt } from "drizzle-orm";
import { db } from "./drizzle";
import {
  accountsInSalem as accounts,
  cardsInSalem as cards,
  invoicesInSalem as invoices,
  transactionsInSalem as transactions,
} from "./schema";

import {
  type Account,
  type Card,
  type Invoice,
  type NewAccount,
  type NewCard,
  type NewInvoice,
  type NewTransaction,
} from "./db_types";

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
      closingDate: string; // YYYY-MM-DD format
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
      closingDate: invoiceData.closingDate,
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
      closingDate?: string;
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
    if (invoiceData.closingDate)
      updateData.closingDate = invoiceData.closingDate;
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

  // Buscar faturas em aberto (não pagas)
  async getOpenInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "open")))
      .orderBy(desc(invoices.year), desc(invoices.month));
  }

  // Buscar faturas futuras para parcelamento
  async getFutureInvoices(userId: string): Promise<Invoice[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    return await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          or(
            and(
              eq(invoices.year, currentYear),
              gte(invoices.month, currentMonth)
            ),
            gt(invoices.year, currentYear)
          )
        )
      )
      .orderBy(invoices.year, invoices.month);
  }

  // Buscar ou criar faturas para parcelamento
  async getOrCreateInvoicesForInstallments(
    cardId: string,
    userId: string,
    startDate: Date,
    installments: number
  ): Promise<Invoice[]> {
    const invoicesPromises: Promise<Invoice>[] = [];

    for (let i = 0; i < installments; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);

      const month = installmentDate.getMonth() + 1;
      const year = installmentDate.getFullYear();

      // Buscar fatura existente
      let [existingInvoice] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.cardId, cardId),
            eq(invoices.month, month),
            eq(invoices.year, year),
            eq(invoices.userId, userId)
          )
        );

      if (!existingInvoice) {
        // Buscar informações do cartão para calcular datas
        const [card] = await db
          .select()
          .from(cards)
          .where(eq(cards.id, cardId));

        if (card) {
          const dueDate = new Date(year, month - 1, card.dueDay);
          const closingDate = new Date(year, month - 1, card.closingDay);

          existingInvoice = await this.createInvoice(
            {
              cardId,
              month,
              year,
              totalAmount: 0,
              paidAmount: 0,
              dueDate: dueDate.toISOString().split("T")[0],
              closingDate: closingDate.toISOString().split("T")[0],
              status: "open",
            },
            userId
          );
        }
      }

      if (existingInvoice) {
        invoicesPromises.push(Promise.resolve(existingInvoice));
      }
    }

    return Promise.all(invoicesPromises);
  }

  // Buscar ou criar fatura para um cartão em um período específico
  async findOrCreateInvoice(
    cardId: string,
    month: number,
    year: number,
    closingDate: string,
    dueDate: string,
    userId: string
  ): Promise<Invoice> {
    // Primeiro tenta buscar a fatura existente
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.cardId, cardId),
          eq(invoices.month, month),
          eq(invoices.year, year),
          eq(invoices.userId, userId)
        )
      );

    if (existingInvoice) {
      return existingInvoice;
    }

    // Se não existir, cria uma nova
    return await this.createInvoice(
      {
        cardId,
        month,
        year,
        totalAmount: 0,
        paidAmount: 0,
        dueDate,
        closingDate,
        status: "open",
      },
      userId
    );
  }

  // Marcar fatura como paga
  async markInvoiceAsPaid(id: string, userId: string): Promise<Invoice> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return await this.updateInvoice(
      id,
      {
        paidAmount: centavosToReais(invoice.totalAmount),
        status: "paid",
      },
      userId
    );
  }

  // Criar transação parcelada
  async createInstallmentTransaction(
    transactionData: {
      cardId: string;
      amount: number; // Valor total em REAIS
      description: string;
      date: string;
      category?: string;
      installments: number;
      tags?: string[];
    },
    userId: string
  ): Promise<object[]> {
    const transactions = [];
    const installmentAmount = Math.round(
      transactionData.amount / transactionData.installments
    );
    const remainderAmount =
      transactionData.amount -
      installmentAmount * (transactionData.installments - 1);

    for (let i = 0; i < transactionData.installments; i++) {
      const installmentDate = new Date(transactionData.date);
      installmentDate.setMonth(installmentDate.getMonth() + i);

      const currentAmount =
        i === transactionData.installments - 1
          ? remainderAmount
          : installmentAmount;

      const transaction = {
        userId,
        cardId: transactionData.cardId,
        amount: Math.round(currentAmount * 100), // Converter para centavos
        description: `${transactionData.description} (${i + 1}/${
          transactionData.installments
        })`,
        type: "expense",
        date: installmentDate.toISOString().split("T")[0],
        category: transactionData.category || null,
        installments: transactionData.installments,
        currentInstallment: i + 1,
        parentTransactionId: i === 0 ? null : undefined, // Será preenchido depois
        tags: transactionData.tags || [],
      };

      transactions.push(transaction);
    }

    return transactions;
  }

  // Deletar transação
  async deleteTransaction(id: string, userId: string): Promise<void> {
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
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
