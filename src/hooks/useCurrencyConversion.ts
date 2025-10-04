import { useState, useEffect } from "react";

interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: string;
}

interface UseCurrencyConversionResult {
  convertedAmount: number | null;
  loading: boolean;
  error: string | null;
}

export function useCurrencyConversion(
  amount: number,
  fromCurrency: string,
  toCurrency: string = "BRL"
): UseCurrencyConversionResult {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se as moedas são iguais, não precisa converter
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      setLoading(false);
      setError(null);
      return;
    }

    // Se amount é 0, retorna 0
    if (amount === 0) {
      setConvertedAmount(0);
      setLoading(false);
      setError(null);
      return;
    }

    const convertCurrency = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          from: fromCurrency,
          to: toCurrency,
          amount: amount.toString(),
        });

        const response = await fetch(`/api/currency?${params}`);

        if (!response.ok) {
          throw new Error("Failed to convert currency");
        }

        const data: CurrencyConversion = await response.json();
        setConvertedAmount(data.result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setConvertedAmount(null);
      } finally {
        setLoading(false);
      }
    };

    convertCurrency();
  }, [amount, fromCurrency, toCurrency]);

  return { convertedAmount, loading, error };
}

// Hook para converter múltiplas contas
export function useMultipleCurrencyConversion(
  accounts: Array<{ balance: number; currency: string }>,
  targetCurrency: string = "BRL"
) {
  const [totalConverted, setTotalConverted] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      setTotalConverted(0);
      return;
    }

    const convertAll = async () => {
      setLoading(true);
      setError(null);

      try {
        let total = 0;

        for (const account of accounts) {
          if (account.currency === targetCurrency) {
            total += account.balance / 100; // Converte centavos para valor real
          } else {
            const params = new URLSearchParams({
              from: account.currency,
              to: targetCurrency,
              amount: (account.balance / 100).toString(),
            });

            const response = await fetch(`/api/currency?${params}`);

            if (!response.ok) {
              throw new Error(
                `Failed to convert ${account.currency} to ${targetCurrency}`
              );
            }

            const data: CurrencyConversion = await response.json();
            total += data.result;
          }
        }

        setTotalConverted(Math.round(total * 100)); // Converte de volta para centavos
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setTotalConverted(null);
      } finally {
        setLoading(false);
      }
    };

    convertAll();
  }, [accounts, targetCurrency]);

  return { totalConverted, loading, error };
}
