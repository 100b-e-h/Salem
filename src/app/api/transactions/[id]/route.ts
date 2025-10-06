import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { transactions } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";

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
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
