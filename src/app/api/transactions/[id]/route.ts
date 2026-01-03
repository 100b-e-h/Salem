import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { transactionsInSalem as transactions, invoicesInSalem as invoices, cardsInSalem as cards } from "@/lib/schema";
import type {
  Transaction as TxType,
  Invoice as InvoiceType,
  Card as CardType,
} from "@/lib/db_types";
import { createClient } from "@/lib/supabase/server";
import { eq, and, sql } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { description, amount, date, category, installments, financeType, invoiceId } = body;

    if (
      !description &&
      amount === undefined &&
      !date &&
      !category &&
      !installments &&
      !financeType &&
      invoiceId === undefined
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, id));
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Transaction not found or unauthorized" },
        { status: 404 }
      );
    }

    await db
      .update(transactions)
      .set({
        ...(description !== undefined ? { description } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(date !== undefined ? { date } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(installments !== undefined
          ? { 
              installments: Number(installments),
              financeType: Number(installments) > 1 ? "installment" : "upfront"
            }
          : {}),
        ...(financeType !== undefined ? { financeType } : {}),
        ...(invoiceId !== undefined ? { invoiceId } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(transactions.transactionId, id));

    const [updated] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, id));
    
    // Note: Invoice ID is not changed during updates.
    // The transaction stays in its original invoice regardless of date/amount changes.
    // Refresh materialized view after updating transaction
    try {
      // Refresh both views since we don't know if financeType changed
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.invoices_summary`);
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.subscriptions_summary`);
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.installments_summary`);
    } catch (err) {
      console.error("Failed to refresh materialized views", err);
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar uma transação
export async function DELETE(
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

    const { id: transactionId } = await params;

    // Buscar a transação para verificar se existe e pertence ao usuário
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          eq(transactions.userId, user.id)
        )
      );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Se a transação é parcelada, buscar todas as parcelas relacionadas
    let transactionsToDelete = [transaction];
    let isInstallment = false;

    if (transaction.installments && transaction.installments > 1) {
      console.log("Deletando transação parcelada:", {
        id: transaction.transactionId,
        description: transaction.description,
        installments: transaction.installments,
      });

      isInstallment = true;

      // Buscar todas as transações com o mesmo número de parcelas e descrição base similar
      // As parcelas são identificadas pela descrição que contém " (X/Y)" no final
      let baseDescription = transaction.description;

      // Remover o sufixo de parcela da descrição se existir (ex: " (1/12)")
      const installmentPattern = / \(\d+\/\d+\)$/;
      if (installmentPattern.test(baseDescription)) {
        baseDescription = baseDescription.replace(installmentPattern, "");
      }

      console.log("Descrição base extraída:", baseDescription);

      // Buscar todas as transações relacionadas a este lançamento parcelado
      const relatedTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id),
            ...(transaction.cardId ? [eq(transactions.cardId, transaction.cardId)] : []),
            eq(transactions.installments, transaction.installments)
          )
        );

      console.log(
        "Transações relacionadas encontradas:",
        relatedTransactions.length
      );

      // Filtrar apenas as transações que fazem parte do mesmo lançamento
      // baseado na descrição base (sem o sufixo de parcela)
      const sameLaunchTransactions = relatedTransactions.filter((tx) => {
        let txBaseDescription = tx.description;
        if (installmentPattern.test(txBaseDescription)) {
          txBaseDescription = txBaseDescription.replace(installmentPattern, "");
        }
        return txBaseDescription === baseDescription;
      });

      console.log(
        "Transações do mesmo lançamento:",
        sameLaunchTransactions.length
      );
      transactionsToDelete = sameLaunchTransactions;
    }

    // Para cada transação a ser deletada, atualizar as faturas correspondentes
    for (const tx of transactionsToDelete) {
      if (tx.cardId) {
        // Buscar a fatura correspondente
        const transactionDate = new Date(tx.date);
        const month = transactionDate.getMonth() + 1;
        const year = transactionDate.getFullYear();

        const [invoice] = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.cardId, tx.cardId),
              eq(invoices.month, month),
              eq(invoices.year, year)
            )
          );
      }
    }

    // Deletar todas as transações relacionadas
    for (const tx of transactionsToDelete) {
      await db.delete(transactions).where(eq(transactions.transactionId, tx.transactionId));
    }

    // Refresh materialized view after deleting transactions
    try {
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.invoices_summary`);
      if (isInstallment) {
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.installments_summary`);
      }
      // Also refresh subscriptions_summary in case it was a subscription
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.subscriptions_summary`);
    } catch (err) {
      console.error("Failed to refresh materialized views", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
