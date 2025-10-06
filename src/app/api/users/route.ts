import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Buscar usuário por email
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 }
      );
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, name")
      .ilike("email", `%${email}%`)
      .neq("id", user.id)
      .limit(5);

    if (error) {
      console.error("Error searching users:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(profiles || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
