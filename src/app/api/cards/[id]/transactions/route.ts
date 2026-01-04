import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { 
  transactionsInSalem as transactions, 
  cardsInSalem as cards, 
  invoicesInSalem as invoices, 
  installmentsInSalem 
} from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { calculateInvoicePeriod, formatDateForDb } from "@/utils/invoice";
import {
  validateRequest,
  createTransactionSchema,
  uuidSchema,
} from "@/lib/validation";

// Helper function to remove installment suffix from description (e.g., " (1/6)")
function stripInstallmentSuffix(description: string): string {
  const installmentPattern = / \(\d+\/\d+\)$/;
  return description.replace(installmentPattern, '').trim();
}

// GET - Listar transações de um cartão
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parâmetros da URL
    const { id: cardId } = await params;
    const cardIdResult = uuidSchema.safeParse(cardId);
    if (!cardIdResult.success) {
      return NextResponse.json(
        { error: "ID do cartão inválido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const validCardId = cardIdResult.data;

    const cardTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          eq(transactions.cardId, validCardId)
        )
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    return NextResponse.json(cardTransactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    );
  }
}

// POST - Criar nova transação no cartão
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parâmetros da URL
    const { id: cardId } = await params;
    const cardIdResult = uuidSchema.safeParse(cardId);
    if (!cardIdResult.success) {
      return NextResponse.json(
        { error: "ID do cartão inválido" },
        { status: 400 }
      );
    }

    // Validar dados da requisição
    const body = await request.json();

    let validatedData;
    try {
      validatedData = validateRequest(createTransactionSchema, body);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Dados inválidos",
          receivedData: body,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const validCardId = cardIdResult.data;

    // Buscar o cartão para verificar se existe e pertence ao usuário
    const [card] = await db
      .select()
      .from(cards)
      .where(and(eq(cards.cardId, validCardId), eq(cards.userId, user.id)));

    if (!card) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    // Helper para calcular datas da fatura
    const getInvoiceDates = (month: number, year: number) => {
      const invoiceMonthIndex = month - 1;
      const closingDate = new Date(year, invoiceMonthIndex, card.closingDay);

      let dueMonth = invoiceMonthIndex;
      let dueYear = year;

      if (card.dueDay < card.closingDay) {
        dueMonth += 1;
        if (dueMonth > 11) {
            dueMonth = 0;
            dueYear += 1;
        }
      }
      const dueDate = new Date(dueYear, dueMonth, card.dueDay);
      return { closingDate, dueDate };
    };

    // Calcular qual fatura essa transação deve pertencer baseada na data de fechamento
    const transactionDate = new Date(validatedData.date);

    if (validatedData.installments > 1) {
      // Lógica para transações parceladas
      
      // 1. Primeiro, criar o registro base no installmentsInSalem
      const installmentAmount = Math.round(
        validatedData.amount / validatedData.installments
      );
      
      // Strip any installment suffix from the description before storing
      const cleanDescription = stripInstallmentSuffix(validatedData.description);
      
      const [installmentBase] = await db
        .insert(installmentsInSalem)
        .values({
          userId: user.id,
          cardId: validCardId,
          installmentBaseDescription: cleanDescription,
          installmentAmount: installmentAmount,
          installments: validatedData.installments,
          category: validatedData.category || null,
          date: validatedData.date,
          financeType: "installment",
          type: "expense",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      if (!installmentBase) {
        throw new Error("Failed to create installment base record");
      }

      // 2. Agora criar todas as transações referenciando o installmentId
      const createdTransactions = [];
      const remainderAmount =
        validatedData.amount -
        installmentAmount * (validatedData.installments - 1);

      for (let i = 0; i < validatedData.installments; i++) {
        const installmentDate = new Date(transactionDate);
        installmentDate.setMonth(transactionDate.getMonth() + i);

        const currentAmount =
          i === validatedData.installments - 1
            ? remainderAmount
            : installmentAmount;

        // Calcular qual fatura essa parcela deve pertencer
        let invoicePeriod;
        if (validatedData.invoiceMonth && validatedData.invoiceYear) {
            let targetMonth = validatedData.invoiceMonth + i;
            let targetYear = validatedData.invoiceYear;

            while (targetMonth > 12) {
                targetMonth -= 12;
                targetYear += 1;
            }

            const dates = getInvoiceDates(targetMonth, targetYear);
            invoicePeriod = {
                month: targetMonth,
                year: targetYear,
                closingDate: dates.closingDate,
                dueDate: dates.dueDate
            };
        } else {
            invoicePeriod = calculateInvoicePeriod(
              installmentDate,
              card.closingDay,
              card.dueDay
            );
        }

        // Buscar ou criar a fatura do período correto ANTES de criar a transação
        let invoice = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.cardId, validCardId),
              eq(invoices.month, invoicePeriod.month),
              eq(invoices.year, invoicePeriod.year)
            )
          )
          .then(rows => rows[0]);

        if (invoice) {
          // Atualizar valor da fatura existente
          await db
            .update(invoices)
            .set({
              updatedAt: new Date().toISOString(),
            })
            .where(eq(invoices.invoiceId, invoice.invoiceId));
        } else {
          // Criar nova fatura
          const [newInvoice] = await db.insert(invoices).values({
            userId: user.id,
            cardId: validCardId,
            month: invoicePeriod.month,
            year: invoicePeriod.year,
            paidAmount: 0,
            dueDate: formatDateForDb(invoicePeriod.dueDate),
            closingDate: formatDateForDb(invoicePeriod.closingDate),
            status: "open",
          }).returning();
          invoice = newInvoice;
        }

        if (!invoice) {
          throw new Error(`Failed to create or find invoice for installment ${i + 1}`);
        }

        const [newTransaction] = await db
          .insert(transactions)
          .values({
            userId: user.id,
            cardId: validCardId,
            amount: Math.round(Math.abs(currentAmount)),
            description: `${cleanDescription} (${i + 1}/${
              validatedData.installments
            })`,
            type: "expense",
            date: installmentDate.toISOString().split("T")[0],
            category: validatedData.category || null,
            installments: validatedData.installments,
            currentInstallment: i + 1,
            sharedWith: validatedData.sharedWith || null,
            financeType: "installment",
            invoiceId: invoice.invoiceId,
            installmentsId: installmentBase.installmentId, // Referência ao registro base
          })
          .returning();

        createdTransactions.push(newTransaction);
      }

      // Refresh materialized view after creating installment transactions
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.invoices_summary`);
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.installments_summary`);

      return NextResponse.json(createdTransactions, { status: 201 });
    }

    // Lógica para transação à vista
    let invoicePeriod;
    if (validatedData.invoiceMonth && validatedData.invoiceYear) {
        const dates = getInvoiceDates(validatedData.invoiceMonth, validatedData.invoiceYear);
        invoicePeriod = {
            month: validatedData.invoiceMonth,
            year: validatedData.invoiceYear,
            closingDate: dates.closingDate,
            dueDate: dates.dueDate
        };
    } else {
        invoicePeriod = calculateInvoicePeriod(
          transactionDate,
          card.closingDay,
          card.dueDay
        );
    }

    // Buscar ou criar a fatura do período correto ANTES de criar a transação
    let invoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.cardId, validCardId),
          eq(invoices.month, invoicePeriod.month),
          eq(invoices.year, invoicePeriod.year)
        )
      )
      .then(rows => rows[0]);

    if (invoice) {
      await db
        .update(invoices)
        .set({
          updatedAt: new Date().toISOString(),
        })
        .where(eq(invoices.invoiceId, invoice.invoiceId));
    } else {
      const newInvoiceData = {
        userId: user.id,
        cardId: validCardId,
        month: invoicePeriod.month,
        year: invoicePeriod.year,
        paidAmount: 0,
        dueDate: formatDateForDb(invoicePeriod.dueDate),
        closingDate: formatDateForDb(invoicePeriod.closingDate),
        status: "open" as const,
      };

      const [newInvoice] = await db.insert(invoices).values(newInvoiceData).returning();
      invoice = newInvoice;
    }

    if (!invoice) {
      throw new Error("Failed to create or find invoice");
    }

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        cardId: validCardId,
        amount: Math.round(Math.abs(validatedData.amount)),
        description: validatedData.description,
        type: "expense",
        date: validatedData.date,
        category: validatedData.category || null,
        installments: 1,
        currentInstallment: 1,
        sharedWith: validatedData.sharedWith || null,
        financeType: validatedData.financeType || "upfront", // Use financeType from request or default to upfront
        invoiceId: invoice.invoiceId,
      })
      .returning();

    // Determine which materialized view to refresh based on finance type
    const financeTypeToRefresh = validatedData.financeType || "upfront";
    
    // Refresh appropriate materialized view after creating transaction
    try {
      if (financeTypeToRefresh === 'subscription') {
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.subscriptions_summary`);
      } else {
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.invoices_summary`);
      }
    } catch (viewError) {
      console.error('Failed to refresh materialized view:', viewError);
      // Fallback: Try to create the view if it doesn't exist
      try {
        if (financeTypeToRefresh === 'subscription') {
          await db.execute(sql`
            CREATE MATERIALIZED VIEW IF NOT EXISTS salem.subscriptions_summary AS
            SELECT 
              t.transaction_id,
              t.user_id,
              t.card_id,
              t.description,
              t.amount,
              t.category,
              t.date,
              t.created_at,
              t.updated_at
            FROM salem.transactions t
            WHERE t.finance_type = 'subscription'
            ORDER BY t.date DESC;
          `);
          console.log('Created subscriptions_summary materialized view');
        } else {
          await db.execute(sql`
            CREATE MATERIALIZED VIEW IF NOT EXISTS salem.invoices_summary AS
            SELECT 
              i.invoice_id,
              i.user_id,
              i.card_id,
              i.month,
              i.year,
              i.due_date,
              i.closing_date,
              i.status,
              i.paid_amount,
              COUNT(t.transaction_id) as transaction_count,
              COALESCE(SUM(t.amount), 0) as total_amount,
              i.created_at,
              i.updated_at
            FROM salem.invoices i
            LEFT JOIN salem.transactions t ON i.invoice_id = t.invoice_id
            GROUP BY i.invoice_id, i.user_id, i.card_id, i.month, i.year, 
                     i.due_date, i.closing_date, i.status, i.paid_amount, 
                     i.created_at, i.updated_at;
          `);
          console.log('Created invoices_summary materialized view');
        }
      } catch (createError) {
        console.error('Failed to create materialized view:', createError);
      }
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (err) {
    console.error("Error creating transaction:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
