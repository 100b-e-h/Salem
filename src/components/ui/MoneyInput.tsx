import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    parseMoneyToCentavos,
    formatCentavosForInput,
    type CentavosValue
} from '@/utils/money';

interface MoneyInputProps {
    id?: string;
    label?: string;
    value: CentavosValue; // Valor em centavos
    onChange: (centavos: CentavosValue) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    min?: number; // Valor mínimo em reais
    max?: number; // Valor máximo em reais
}

export function MoneyInput({
    id,
    label,
    value,
    onChange,
    placeholder = "0,00",
    required = false,
    disabled = false,
    className,
    ...props
}: MoneyInputProps) {
    // Estado local para o valor displayado (em formato de string)
    const [displayValue, setDisplayValue] = React.useState(
        formatCentavosForInput(value)
    );

    // Atualiza o valor displayado quando o valor prop muda
    React.useEffect(() => {
        setDisplayValue(formatCentavosForInput(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayValue(inputValue);

        // Converte para centavos e chama onChange
        const centavos = parseMoneyToCentavos(inputValue);
        onChange(centavos);
    };

    const handleBlur = () => {
        // Ao perder o foco, formatar o valor corretamente
        setDisplayValue(formatCentavosForInput(value));
    };

    return (
        <div className={className}>
            {label && (
                <Label htmlFor={id} className="text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            <Input
                id={id}
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                {...props}
            />
        </div>
    );
}

export function useMoneyInput(initialValue: CentavosValue = 0) {
    const [value, setValue] = React.useState<CentavosValue>(initialValue);

    const reset = () => setValue(0);

    const setValueInReais = (reais: number) => {
        setValue(parseMoneyToCentavos(reais.toString()));
    };

    return {
        value,
        setValue,
        reset,
        setValueInReais,
    };
}