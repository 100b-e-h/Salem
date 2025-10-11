import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { transactions, cards, invoices } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc } from "drizzle-orm";
import { calculateInvoicePeriod, formatDateForDb } from "@/utils/invoice";
import {
  validateRequest,
  createTransactionSchema,
  uuidSchema,
} from "@/lib/validation";

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
        { error: error instanceof Error ? error.message : "Dados inválidos" },
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
      .where(and(eq(cards.id, validCardId), eq(cards.userId, user.id)));

    if (!card) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    // Calcular qual fatura essa transação deve pertencer baseada na data de fechamento
    const transactionDate = new Date(validatedData.date);

    if (validatedData.installments > 1) {
      // Lógica para transações parceladas
      const createdTransactions = [];
      const installmentAmount = Math.round(
        validatedData.amount / validatedData.installments
      );
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
        const invoicePeriod = calculateInvoicePeriod(
          installmentDate,
          card.closingDay,
          card.dueDay
        );

        const [newTransaction] = await db
          .insert(transactions)
          .values({
            userId: user.id,
            cardId: validCardId,
            amount: Math.abs(currentAmount),
            description: `${validatedData.description} (${i + 1}/${
              validatedData.installments
            })`,
            type: "expense",
            date: installmentDate.toISOString().split("T")[0],
            category: validatedData.category || null,
            installments: validatedData.installments,
            currentInstallment: i + 1,
            sharedWith: validatedData.sharedWith || null,
          })
          .returning();

        createdTransactions.push(newTransaction);

        // Buscar ou criar a fatura do período correto
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.cardId, validCardId),
              eq(invoices.month, invoicePeriod.month),
              eq(invoices.year, invoicePeriod.year)
            )
          );

        if (invoice) {
          // Atualizar valor da fatura existente
          await db
            .update(invoices)
            .set({
              totalAmount: invoice.totalAmount + Math.abs(currentAmount),
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoice.id));
        } else {
          // Criar nova fatura
          await db.insert(invoices).values({
            userId: user.id,
            cardId: validCardId,
            month: invoicePeriod.month,
            year: invoicePeriod.year,
            totalAmount: Math.abs(currentAmount),
            paidAmount: 0,
            dueDate: formatDateForDb(invoicePeriod.dueDate),
            closingDate: formatDateForDb(invoicePeriod.closingDate),
            status: "open",
          });
        }
      }

      return NextResponse.json(createdTransactions, { status: 201 });
    }

    // Lógica para transação à vista (original)
    const invoicePeriod = calculateInvoicePeriod(
      transactionDate,
      card.closingDay,
      card.dueDay
    );

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        cardId: validCardId,
        amount: Math.abs(validatedData.amount),
        description: validatedData.description,
        type: "expense",
        date: validatedData.date,
        category: validatedData.category || null,
        installments: 1,
        currentInstallment: 1,
        sharedWith: validatedData.sharedWith || null,
      })
      .returning();

    // Buscar ou criar a fatura do período correto
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.cardId, validCardId),
          eq(invoices.month, invoicePeriod.month),
          eq(invoices.year, invoicePeriod.year)
        )
      );

    if (invoice) {
      await db
        .update(invoices)
        .set({
          totalAmount: invoice.totalAmount + Math.abs(validatedData.amount),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    } else {
      const newInvoiceData = {
        userId: user.id,
        cardId: validCardId,
        month: invoicePeriod.month,
        year: invoicePeriod.year,
        totalAmount: Math.abs(validatedData.amount),
        paidAmount: 0,
        dueDate: formatDateForDb(invoicePeriod.dueDate),
        closingDate: formatDateForDb(invoicePeriod.closingDate),
        status: "open" as const,
      };

      await db.insert(invoices).values(newInvoiceData);
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
