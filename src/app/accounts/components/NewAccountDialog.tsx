import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { useAuth } from '@/components/AuthProvider';

interface NewAccountDialogProps {
    open: boolean;
    onClose: () => void;
    onAccountCreated: () => void;
}

export function NewAccountDialog({ open, onClose, onAccountCreated }: NewAccountDialogProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [type, setType] = useState('corrente');
    const [balance, setBalance] = useState(0); // Valor em centavos
    const [currency, setCurrency] = useState('BRL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/accounts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    type,
                    balance,
                    currency,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create account');
            }

            // Reset form
            setName('');
            setType('corrente');
            setBalance(0);
            setCurrency('BRL');

            // Close dialog and refresh data
            onClose();
            onAccountCreated();
        } catch (error) {
            console.error('Erro ao criar conta:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Conta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Conta</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <select
                            id="type"
                            className="w-full border rounded px-3 py-2"
                            value={type}
                            onChange={e => setType(e.target.value)}
                            required
                        >
                            <option value="corrente">Conta Corrente</option>
                            <option value="poupanca">Poupança</option>
                            <option value="carteira">Carteira</option>
                            <option value="corretora">Corretora</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="balance">Saldo Inicial</Label>
                        <div className="flex gap-2 items-center">
                            <MoneyInput
                                id="balance"
                                onValueChange={centavos => setBalance(Number.isNaN(centavos) ? 0 : centavos)}
                                allowNegative={true}
                                required
                                value={balance === 0 ? '' : (Math.abs(balance) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            />
                            <Button type="button" size="sm" variant={balance < 0 ? 'default' : 'outline'} onClick={() => setBalance(balance > 0 ? -balance : balance === 0 ? -100 : balance)} title="Negativo">-</Button>
                            <Button type="button" size="sm" variant={balance >= 0 ? 'default' : 'outline'} onClick={() => setBalance(Math.abs(balance))} title="Positivo">+</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency">Moeda</Label>
                        <select
                            id="currency"
                            className="w-full border rounded px-3 py-2"
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            required
                        >
                            <option value="BRL">🇧🇷 Real (BRL)</option>
                            <option value="USD">🇺🇸 Dólar (USD)</option>
                            <option value="EUR">🇪🇺 Euro (EUR)</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
