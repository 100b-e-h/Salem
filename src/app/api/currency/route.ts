import { NextRequest, NextResponse } from "next/server";

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

// Cache para armazenar as taxas por 1 hora
const cache = new Map<
  string,
  { data: ExchangeRateResponse; timestamp: number }
>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em millisegundos

async function getExchangeRates(): Promise<ExchangeRateResponse> {
  const cacheKey = "exchange-rates";
  const cached = cache.get(cacheKey);

  // Verifica se o cache ainda é válido
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // API gratuita para conversão de moedas
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/BRL"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data: ExchangeRateResponse = await response.json();

    // Armazena no cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);

    // Retorna taxas fixas como fallback
    return {
      base: "BRL",
      date: new Date().toISOString().split("T")[0],
      rates: {
        USD: 0.18, // 1 BRL = 0.18 USD (aproximado)
        EUR: 0.17, // 1 BRL = 0.17 EUR (aproximado)
        BRL: 1.0,
      },
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "USD";
    const to = searchParams.get("to") || "BRL";
    const amount = parseFloat(searchParams.get("amount") || "1");

    if (isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const rates = await getExchangeRates();

    // Converte de 'from' para BRL primeiro, depois para 'to'
    let result: number;

    if (from === "BRL") {
      // De BRL para outra moeda
      result = amount * (rates.rates[to] || 1);
    } else if (to === "BRL") {
      // De outra moeda para BRL
      result = amount / (rates.rates[from] || 1);
    } else {
      // Entre duas moedas diferentes (via BRL)
      const toBRL = amount / (rates.rates[from] || 1);
      result = toBRL * (rates.rates[to] || 1);
    }

    return NextResponse.json({
      from,
      to,
      amount,
      result: Math.round(result * 100) / 100, // Arredonda para 2 casas decimais
      rate: from === "BRL" ? rates.rates[to] : 1 / (rates.rates[from] || 1),
      timestamp: rates.date,
    });
  } catch (error) {
    console.error("Currency conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
