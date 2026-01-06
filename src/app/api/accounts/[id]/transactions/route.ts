import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { transactionsInSalem as transactions, accountsInSalem as accounts } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc } from "drizzle-orm";
import { normalizeDateString } from "@/utils/invoice";

// GET - Listar transações de uma conta
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

    const { id: accountId } = await params;

    const accountTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          eq(transactions.accountId, accountId)
        )
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    return NextResponse.json(accountTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Criar nova transação (aporte ou retirada)
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

    const { id: accountId } = await params;
    const body = await request.json();
    const { amount, description, type, date } = body;

    // Validação
    if (
      amount === undefined ||
      amount === null ||
      !description ||
      !type ||
      !date
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { amount, description, type, date },
        },
        { status: 400 }
      );
    }

    // Buscar a conta para atualizar o saldo
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)));

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Sempre tratar amount como positivo e aplicar o sinal conforme o tipo
    const absAmount = Math.abs(parseInt(amount));
    let signedAmount = absAmount;
    if (type === "withdrawal") {
      signedAmount = -absAmount;
    }

    // Normalize the date string to ISO timestamp
    const normalizedDate = normalizeDateString(date);

    // Criar a transação
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        accountId,
        amount: signedAmount,
        description,
        type,
        date: normalizedDate,
      })
      .returning();

    // Atualizar o saldo da conta
    const newBalance = account.balance + signedAmount;
    await db
      .update(accounts)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
