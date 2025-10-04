import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { formatCentavosToMoney, type CentavosValue } from '@/utils/money';

const currencyDisplayVariants = cva(
    "font-medium",
    {
        variants: {
            size: {
                sm: "text-sm",
                md: "text-base",
                lg: "text-lg font-semibold",
                xl: "text-2xl font-bold"
            },
            variant: {
                positive: "text-green-600",
                negative: "text-red-600",
                neutral: "text-foreground"
            }
        },
        defaultVariants: {
            size: "md",
            variant: "neutral"
        }
    }
);

interface CurrencyDisplayProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof currencyDisplayVariants> {
    amount: CentavosValue; // Agora recebe valor em centavos
    currency?: string;
    showSign?: boolean;
    showSymbol?: boolean;
}

export function CurrencyDisplay({
    amount,
    currency = 'BRL',
    size,
    variant,
    showSign = false,
    showSymbol = true,
    className,
    ...props
}: CurrencyDisplayProps) {
    // Determina a variante automaticamente baseada no valor se não especificada
    let finalVariant = variant;
    if (variant === 'neutral' && showSign) {
        finalVariant = amount >= 0 ? 'positive' : 'negative';
    }

    // Converte centavos para reais e formata
    const displayValue = formatCentavosToMoney(amount, {
        showSymbol,
        currency,
        locale: 'pt-BR'
    });

    // Adiciona sinal de + para valores positivos se solicitado
    const finalDisplayValue = showSign && amount > 0 ? `+${displayValue}` : displayValue;

    return (
        <span
            className={cn(currencyDisplayVariants({ size, variant: finalVariant }), className)}
            {...props}
        >
            {finalDisplayValue}
        </span>
    );
}
