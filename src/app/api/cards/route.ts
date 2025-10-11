import { NextResponse } from "next/server";
import { drizzleDb } from "@/lib/drizzle-database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateRequest, createCardSchema } from "@/lib/validation";

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
    const cards = await drizzleDb.getAllCards(user.id);
    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
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
      validatedData = validateRequest(createCardSchema, body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Dados inválidos" },
        { status: 400 }
      );
    }

    const card = await drizzleDb.createCard(validatedData, user.id);
    return NextResponse.json(card);
  } catch (err) {
    console.error("Error creating card:", err);
    return NextResponse.json(
      { error: "Erro ao criar cartão" },
      { status: 500 }
    );
  }
}
