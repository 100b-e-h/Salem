import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { transactions, invoices, cards } from "@/lib/schema";
import type {
  Transaction as TxType,
  Invoice as InvoiceType,
  Card as CardType,
} from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";

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
    const { description, amount, date, category } = body;

    if (!description && amount === undefined && !date && !category) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
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
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id));

    const [updated] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    // Recalculate affected invoice totals if needed.
    try {
      // Parse old and new invoice keys (cardId, month, year)

      const parseDate = (d: string | Date) => {
        const dt = d instanceof Date ? d : new Date(d);
        return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
      };

      const old = existing as TxType;
      const oldDateParts = parseDate(old.date as unknown as string);
      const oldCardId = (old.cardId as string) || null;
      const oldAmount = Number(old.amount || 0);

      const upd = updated as TxType;
      const newDateParts = parseDate(upd.date as unknown as string);
      const newCardId = (upd.cardId as string) || null;
      const newAmount = Number(upd.amount || 0);

      // If invoice bucket is the same, apply the delta to that invoice.
      if (
        oldCardId &&
        newCardId &&
        oldCardId === newCardId &&
        oldDateParts.year === newDateParts.year &&
        oldDateParts.month === newDateParts.month
      ) {
        const diff = newAmount - oldAmount;
        if (diff !== 0) {
          const [inv] = await db
            .select()
            .from(invoices)
            .where(
              and(
                eq(invoices.cardId, newCardId),
                eq(invoices.month, newDateParts.month),
                eq(invoices.year, newDateParts.year)
              )
            );
          if (inv) {
            await db
              .update(invoices)
              .set({
                totalAmount: Math.max(0, inv.totalAmount + diff),
                updatedAt: new Date(),
              })
              .where(eq(invoices.id, inv.id));
          } else {
            // Create invoice if missing (should be rare)
            const [cardRow] = await db
              .select()
              .from(cards)
              .where(eq(cards.id, newCardId));
            const dueDate = cardRow
              ? new Date(
                  newDateParts.year,
                  newDateParts.month - 1,
                  cardRow.dueDay
                )
              : new Date(newDateParts.year, newDateParts.month - 1);
            if (old.userId && newCardId) {
              await db.insert(invoices).values({
                userId: old.userId,
                cardId: newCardId,
                month: newDateParts.month,
                year: newDateParts.year,
                totalAmount: newAmount,
                paidAmount: 0,
                dueDate: dueDate.toISOString().split("T")[0],
                status: "open",
              });
            }
          }
        }
      } else {
        // Transaction moved between invoice buckets or card changed.
        // Subtract from old invoice
        let oldInv: InvoiceType | undefined = undefined;
        if (oldCardId) {
          [oldInv] = await db
            .select()
            .from(invoices)
            .where(
              and(
                eq(invoices.cardId, oldCardId),
                eq(invoices.month, oldDateParts.month),
                eq(invoices.year, oldDateParts.year)
              )
            );
        }
        if (oldInv) {
          await db
            .update(invoices)
            .set({
              totalAmount: Math.max(0, oldInv.totalAmount - oldAmount),
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, oldInv.id));
        }

        // Add to new invoice (or create)
        let newInv: InvoiceType | undefined = undefined;
        if (newCardId) {
          [newInv] = await db
            .select()
            .from(invoices)
            .where(
              and(
                eq(invoices.cardId, newCardId),
                eq(invoices.month, newDateParts.month),
                eq(invoices.year, newDateParts.year)
              )
            );
        }
        if (newInv) {
          await db
            .update(invoices)
            .set({
              totalAmount: newInv.totalAmount + newAmount,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, newInv.id));
        } else if (newCardId) {
          let cardRow: CardType | undefined = undefined;
          [cardRow] = await db
            .select()
            .from(cards)
            .where(eq(cards.id, newCardId));
          const dueDate = cardRow
            ? new Date(
                newDateParts.year,
                newDateParts.month - 1,
                cardRow.dueDay
              )
            : new Date(newDateParts.year, newDateParts.month - 1);
          if (old.userId) {
            await db.insert(invoices).values({
              userId: old.userId,
              cardId: newCardId,
              month: newDateParts.month,
              year: newDateParts.year,
              totalAmount: newAmount,
              paidAmount: 0,
              dueDate: dueDate.toISOString().split("T")[0],
              status: "open",
            });
          }
        }
      }
    } catch (err) {
      console.error(
        "Failed to recalculate invoice totals after transaction update",
        err
      );
      // don't fail the request because of invoice recalculation issues
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
          eq(transactions.id, transactionId),
          eq(transactions.userId, user.id)
        )
      );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Se a transação tem cardId, precisamos atualizar a fatura
    if (transaction.cardId) {
      // Buscar a fatura correspondente
      const transactionDate = new Date(transaction.date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.cardId, transaction.cardId),
            eq(invoices.month, month),
            eq(invoices.year, year)
          )
        );

      if (invoice) {
        // Atualizar o valor da fatura subtraindo o valor da transação
        const newTotal = Math.max(0, invoice.totalAmount - transaction.amount);

        if (newTotal === 0) {
          // Se a fatura ficou zerada, deletar ela
          await db.delete(invoices).where(eq(invoices.id, invoice.id));
        } else {
          // Caso contrário, atualizar o valor
          await db
            .update(invoices)
            .set({
              totalAmount: newTotal,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoice.id));
        }
      }
    }

    // Deletar a transação
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
