// Componente para exibir valores monetários

import React from 'react';
import { formatCurrency } from '@/utils/financial';

interface CurrencyDisplayProps {
    amount: number;
    currency?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'positive' | 'negative' | 'neutral';
    showSign?: boolean;
    className?: string;
}

export function CurrencyDisplay({
    amount,
    currency = 'BRL',
    size = 'md',
    variant = 'neutral',
    showSign = false,
    className = ''
}: CurrencyDisplayProps) {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg font-semibold',
        xl: 'text-2xl font-bold'
    };

    const variantClasses = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-gray-900'
    };

    // Determina a variante automaticamente baseada no valor se não especificada
    let finalVariant = variant;
    if (variant === 'neutral' && showSign) {
        finalVariant = amount >= 0 ? 'positive' : 'negative';
    }

    const formatValue = (value: number) => {
        if (currency === 'BRL') {
            return formatCurrency(value);
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
        }).format(value);
    };

    const displayValue = showSign && amount > 0 ? `+${formatValue(amount)}` : formatValue(amount);

    return (
        <span className={`
      ${sizeClasses[size]}
      ${variantClasses[finalVariant]}
      ${className}
    `.trim()}>
            {displayValue}
        </span>
    );
}
