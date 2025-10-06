import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { transactions, cards, invoices } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc } from "drizzle-orm";

// GET - Listar transações de um cartão
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cardId } = await params;

    const cardTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.userId, user.id), eq(transactions.cardId, cardId))
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    return NextResponse.json(cardTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cardId } = await params;
    const body = await request.json();
    const {
      amount,
      description,
      date,
      category,
      month,
      year,
      sharedWith, // Array of {id, email, paid}
    } = body;

    // Validação
    if (
      amount === undefined ||
      amount === null ||
      !description ||
      !date ||
      !month ||
      !year
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { amount, description, date, month, year },
        },
        { status: 400 }
      );
    }

    // Buscar o cartão para verificar se existe e pertence ao usuário
    const [card] = await db
      .select()
      .from(cards)
      .where(and(eq(cards.id, cardId), eq(cards.userId, user.id)));

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Criar a transação
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        cardId,
        amount: Math.abs(parseInt(amount)),
        description,
        type: "expense", // Transações de cartão são sempre despesas
        date,
        category: category || null, // Categoria como texto (alimentacao, transporte, etc)
        sharedWith:
          sharedWith && Array.isArray(sharedWith) && sharedWith.length > 0
            ? sharedWith
            : null,
      })
      .returning();

    // Buscar ou criar a fatura do mês
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.cardId, cardId),
          eq(invoices.month, month),
          eq(invoices.year, year)
        )
      );

    if (invoice) {
      // Atualizar valor da fatura existente
      await db
        .update(invoices)
        .set({
          totalAmount: invoice.totalAmount + Math.abs(parseInt(amount)),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    } else {
      // Criar nova fatura
      const dueDate = new Date(year, month - 1, card.dueDay);
      await db.insert(invoices).values({
        userId: user.id,
        cardId,
        month,
        year,
        totalAmount: Math.abs(parseInt(amount)),
        paidAmount: 0,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "open",
      });
    }

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
