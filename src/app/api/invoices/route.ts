import { NextRequest, NextResponse } from "next/server";
import { drizzleDb } from "@/lib/drizzle-database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Se status for especificado como 'open', buscar apenas faturas em aberto
    if (status === "open") {
      const invoices = await drizzleDb.getOpenInvoices(user.id);
      return NextResponse.json(invoices);
    }

    // Caso contrário, buscar todas as faturas
    const invoices = await drizzleDb.getAllInvoices(user.id);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
