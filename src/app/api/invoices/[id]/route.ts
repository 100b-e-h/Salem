import { NextRequest, NextResponse } from "next/server";
import { drizzleDb } from "@/lib/drizzle-database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  validateRequest,
  uuidSchema,
  amountSchema,
  dateSchema,
} from "@/lib/validation";
import { z } from "zod";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

// Schema para ações de fatura
const invoiceActionSchema = z.object({
  action: z.enum(["mark_paid", "reopen"], {
    message: "Ação inválida para fatura",
  }),
});

// Schema para atualizar fatura
const updateInvoiceSchema = z.object({
  totalAmount: amountSchema.optional(),
  paidAmount: amountSchema.optional(),
  dueDate: dateSchema.optional(),
  closingDate: dateSchema.optional(),
  status: z.enum(["open", "paid", "overdue"]).optional(),
});

// PATCH - Marcar fatura como paga
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parâmetros da URL
    const { id } = await params;
    const invoiceIdResult = uuidSchema.safeParse(id);
    if (!invoiceIdResult.success) {
      return NextResponse.json(
        { error: "ID da fatura inválido" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();

    // Validar dados da requisição
    const body = await request.json();
    let validatedData;
    try {
      validatedData = validateRequest(invoiceActionSchema, body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Dados inválidos" },
        { status: 400 }
      );
    }

    const validInvoiceId = invoiceIdResult.data;

    if (validatedData.action === "mark_paid") {
      const updatedInvoice = await drizzleDb.markInvoiceAsPaid(
        validInvoiceId,
        user.id
      );
      return NextResponse.json(updatedInvoice);
    } else if (validatedData.action === "reopen") {
      // Reabrir fatura (marcar como open)
      const updatedInvoice = await drizzleDb.updateInvoice(
        validInvoiceId,
        { status: "open" },
        user.id
      );
      return NextResponse.json(updatedInvoice);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    console.error("Error updating invoice:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar fatura" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar fatura
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parâmetros da URL
    const { id } = await params;
    const invoiceIdResult = uuidSchema.safeParse(id);
    if (!invoiceIdResult.success) {
      return NextResponse.json(
        { error: "ID da fatura inválido" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();

    // Validar dados da requisição
    const body = await request.json();
    let validatedData;
    try {
      validatedData = validateRequest(updateInvoiceSchema, body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Dados inválidos" },
        { status: 400 }
      );
    }

    const validInvoiceId = invoiceIdResult.data;

    const updatedInvoice = await drizzleDb.updateInvoice(
      validInvoiceId,
      {
        totalAmount: validatedData.totalAmount,
        paidAmount: validatedData.paidAmount,
        dueDate: validatedData.dueDate,
        closingDate: validatedData.closingDate,
        status: validatedData.status,
      },
      user.id
    );

    return NextResponse.json(updatedInvoice);
  } catch (err) {
    console.error("Error updating invoice:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar fatura" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar fatura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar parâmetros da URL
    const { id } = await params;
    const invoiceIdResult = uuidSchema.safeParse(id);
    if (!invoiceIdResult.success) {
      return NextResponse.json(
        { error: "ID da fatura inválido" },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();
    const validInvoiceId = invoiceIdResult.data;

    await drizzleDb.deleteInvoice(validInvoiceId, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting invoice:", err);
    return NextResponse.json(
      { error: "Erro ao deletar fatura" },
      { status: 500 }
    );
  }
}
