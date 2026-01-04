import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { 
  transactionsInSalem as transactions, 
  invoicesInSalem as invoices, 
  cardsInSalem as cards, 
  installmentsInSalem 
} from "@/lib/schema";
import type {
  Transaction as TxType,
  Invoice as InvoiceType,
  Card as CardType,
} from "@/lib/db_types";
import { createClient } from "@/lib/supabase/server";
import { eq, and, sql } from "drizzle-orm";

// Helper function to remove installment suffix from description (e.g., " (1/6)")
function stripInstallmentSuffix(description: string): string {
  const installmentPattern = / \(\d+\/\d+\)$/;
  return description.replace(installmentPattern, '').trim();
}

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
    const { description, amount, date, category, installments, financeType, invoiceId, updateAllInstallments } = body;

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

    // Se a transação é um parcelamento e temos o installmentsId
    if (existing.installmentsId && updateAllInstallments) {
      console.log("Atualizando parcelamento completo:", {
        installmentId: existing.installmentsId,
        transactionId: existing.transactionId,
      });

      // Strip installment suffix from description if provided
      const cleanDescription = description !== undefined ? stripInstallmentSuffix(description) : undefined;

      // 1. Atualizar o registro base no installmentsInSalem
      await db
        .update(installmentsInSalem)
        .set({
          ...(cleanDescription !== undefined ? { installmentBaseDescription: cleanDescription } : {}),
          ...(amount !== undefined ? { installmentAmount: Number(amount) } : {}),
          ...(date !== undefined ? { date } : {}),
          ...(category !== undefined ? { category } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(installmentsInSalem.installmentId, existing.installmentsId),
            eq(installmentsInSalem.userId, user.id)
          )
        );

      // 2. Buscar todas as transações relacionadas ao mesmo installmentId
      const relatedTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.installmentsId, existing.installmentsId),
            eq(transactions.userId, user.id)
          )
        );

      console.log(`Atualizando ${relatedTransactions.length} parcelas relacionadas`);

      // 3. Atualizar cada transação relacionada
      for (const tx of relatedTransactions) {
        // Manter o sufixo de parcela na descrição (X/Y)
        let updatedDescription = tx.description;
        if (cleanDescription !== undefined) {
          const installmentPattern = / \(\d+\/\d+\)$/;
          const match = tx.description.match(installmentPattern);
          if (match) {
            updatedDescription = `${cleanDescription}${match[0]}`;
          } else {
            updatedDescription = cleanDescription;
          }
        }

        await db
          .update(transactions)
          .set({
            ...(description !== undefined ? { description: updatedDescription } : {}),
            ...(amount !== undefined ? { amount: Number(amount) } : {}),
            ...(category !== undefined ? { category } : {}),
            // Nota: data não é atualizada nas parcelas individuais para manter a sequência mensal
            updatedAt: new Date().toISOString(),
          })
          .where(eq(transactions.transactionId, tx.transactionId));
      }

      // Buscar a transação atualizada
      const [updated] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transactionId, id));

      // Refresh materialized views
      try {
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.invoices_summary`);
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.installments_summary`);
      } catch (err) {
        console.error("Failed to refresh materialized views", err);
      }

      return NextResponse.json(updated);
    } else {
      // Atualização normal de transação única
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
      
      // Refresh materialized views
      try {
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.invoices_summary`);
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.subscriptions_summary`);
        await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY salem.installments_summary`);
      } catch (err) {
        console.error("Failed to refresh materialized views", err);
      }
      return NextResponse.json(updated);
    }
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

    let isInstallment = false;

    // Se a transação tem installmentsId, deletar o registro base
    // A constraint CASCADE irá deletar todas as transações relacionadas automaticamente
    if (transaction.installmentsId) {
      console.log("Deletando parcelamento via installmentId:", {
        installmentId: transaction.installmentsId,
        transactionId: transaction.transactionId,
        description: transaction.description,
      });

      isInstallment = true;

      // Deletar o registro base do installment
      // O CASCADE irá deletar todas as transações relacionadas
      await db
        .delete(installmentsInSalem)
        .where(
          and(
            eq(installmentsInSalem.installmentId, transaction.installmentsId),
            eq(installmentsInSalem.userId, user.id)
          )
        );

      console.log("Parcelamento deletado com sucesso via CASCADE");
    } else {
      // Transação simples, deletar apenas ela
      await db
        .delete(transactions)
        .where(eq(transactions.transactionId, transactionId));
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
