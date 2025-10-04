import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

interface AccountConversionProps {
    balance: number;
    currency: string;
}

export function AccountConversion({ balance, currency }: AccountConversionProps) {
    const { convertedAmount, loading } = useCurrencyConversion(
        balance / 100, // Converte centavos para reais
        currency,
        'BRL'
    );

    if (currency === 'BRL') {
        return <span className="text-muted-foreground">-</span>;
    }

    if (loading) {
        return <span className="text-muted-foreground text-xs">Convertendo...</span>;
    }

    if (convertedAmount === null) {
        return <span className="text-muted-foreground text-xs">Erro</span>;
    }

    // Converte de volta para centavos para manter consistência
    const centavos = Math.round(convertedAmount * 100);

    return (
        <span className="text-sm font-medium text-green-600">
            R$ {(centavos / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}
        </span>
    );
}