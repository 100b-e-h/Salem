import { NextResponse } from "next/server";
import { drizzleDb } from "@/lib/drizzle-database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateRequest, createAccountSchema } from "@/lib/validation";

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

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const accounts = await drizzleDb.getAllAccounts(user.id);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    // Validar dados da requisição
    const body = await request.json();
    let validatedData;
    try {
      validatedData = validateRequest(createAccountSchema, body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Dados inválidos" },
        { status: 400 }
      );
    }

    const account = await drizzleDb.createAccount(validatedData, user.id);
    return NextResponse.json(account);
  } catch (err) {
    console.error("Error creating account:", err);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
