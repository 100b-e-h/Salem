import React, { forwardRef, useState, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: string;
    initialCentavos?: number;
    onChange?: (value: string, centavos: number) => void;
    onValueChange?: (centavos: number) => void;
    currency?: string;
    allowNegative?: boolean;
}


const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
    ({
        className,
        value = '',
        initialCentavos,
        onChange,
        onValueChange,
        currency = 'R$',
        allowNegative = false,
        placeholder = '0,00',
        ...props
    }, ref) => {
        // Valor "cru" (apenas números)
        // Valor em reais como string (ex: "1500,00")
        const [displayValue, setDisplayValue] = useState(() => {
            if (value) return value;
            if (initialCentavos !== undefined && initialCentavos !== 0) {
                return (initialCentavos / 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
            }
            return '';
        });

        // Atualiza displayValue se props.value ou initialCentavos mudar
        useEffect(() => {
            if (value) {
                setDisplayValue(value);
            } else if (initialCentavos !== undefined && initialCentavos !== 0) {
                setDisplayValue((initialCentavos / 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }));
            } else {
                setDisplayValue('');
            }
        }, [value, initialCentavos]);

        // Formata valor para exibição
        const formatMoney = (val: string): string => {
            // Remove tudo que não é número
            const numericValue = val.replace(/\D/g, '');
            if (!numericValue) return '';
            // Converte para centavos: cada dígito representa centavos
            const numberValue = parseInt(numericValue) / 100;
            return numberValue.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        };


        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let inputValue = e.target.value;
            // Permite negativo só no início
            const isNegative = allowNegative && inputValue.startsWith('-');
            if (isNegative) {
                inputValue = inputValue.substring(1);
            }
            // Formata valor
            let formattedValue = formatMoney(inputValue);
            if (isNegative && formattedValue !== '0,00') {
                formattedValue = '-' + formattedValue;
            }
            setDisplayValue(formattedValue);

            // Calcula centavos: converte o valor digitado para centavos
            const numericOnly = inputValue.replace(/\D/g, '');
            const centavos = numericOnly ? (isNegative ? -parseInt(numericOnly) : parseInt(numericOnly)) : 0;
            if (onChange) onChange(formattedValue, centavos);
            if (onValueChange) onValueChange(centavos);
        };

        const handleBlur = () => {
            // Quando sair do campo, se estiver vazio, mantém vazio
            if (!displayValue) {
                if (onChange) onChange('', 0);
                if (onValueChange) onValueChange(0);
            } else {
                // Força formatação
                setDisplayValue(formatMoney(displayValue));
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            // Permite: backspace, delete, tab, escape, enter
            if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                // Permite: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.keyCode === 65 && e.ctrlKey === true) ||
                (e.keyCode === 67 && e.ctrlKey === true) ||
                (e.keyCode === 86 && e.ctrlKey === true) ||
                (e.keyCode === 88 && e.ctrlKey === true) ||
                // Permite: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                return;
            }
            // Permite o sinal de menos apenas se allowNegative for true e estiver no início
            if (allowNegative && e.key === '-' && e.currentTarget.selectionStart === 0) {
                return;
            }
            // Garante que é um número
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        };

        // Ref para manipular o cursor
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Permite uso de ref externo
        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        // Ao focar, move o cursor para o final
        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            const el = inputRef.current;
            if (el && el.value) {
                // Move o cursor para o final apenas se houver valor
                const length = el.value.length;
                el.setSelectionRange(length, length);
            }
            if (props.onFocus) props.onFocus(e);
        };

        return (
            <div className="relative">
                {currency && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">
                        {currency}
                    </div>
                )}
                <Input
                    {...props}
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className={cn(
                        currency ? "pl-12" : "",
                        "text-right",
                        className
                    )}
                />
            </div>
        );
    }
);

MoneyInput.displayName = "MoneyInput";

export { MoneyInput };