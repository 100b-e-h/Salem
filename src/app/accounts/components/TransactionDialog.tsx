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
import { Account } from '@/types';

interface TransactionDialogProps {
    open: boolean;
    onClose: () => void;
    onTransactionCreated: () => void;
    account: Account;
}

export function TransactionDialog({ open, onClose, onTransactionCreated, account }: TransactionDialogProps) {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0); // Valor em centavos
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const finalAmount = type === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount);

            const response = await fetch(`/api/accounts/${account.accountId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    amount: finalAmount,
                    type,
                    date,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }

            // Reset form
            setDescription('');
            setAmount(0);
            setType('deposit');
            setDate(new Date().toISOString().split('T')[0]);

            // Close dialog and refresh data
            onClose();
            onTransactionCreated();
        } catch {
            alert('Erro ao criar transação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {type === 'deposit' ? '💰 Novo Aporte' : '💸 Nova Retirada'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Conta: <span className="font-semibold text-foreground">{account.name}</span>
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-foreground font-medium">Tipo de Transação</Label>
                        <select
                            id="type"
                            className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            value={type}
                            onChange={e => setType(e.target.value as 'deposit' | 'withdrawal')}
                            required
                        >
                            <option value="deposit">💰 Aporte (Entrada)</option>
                            <option value="withdrawal">💸 Retirada (Saída)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-foreground font-medium">Descrição</Label>
                        <Input
                            id="description"
                            type="text"
                            placeholder="Ex: Salário, Transferência, Saque..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="bg-background border-border text-foreground shadow-sm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-foreground font-medium">Valor</Label>
                        <MoneyInput
                            id="amount"
                            onValueChange={centavos => setAmount(Number.isNaN(centavos) ? 0 : Math.abs(centavos))}
                            allowNegative={false}
                            required
                            value={amount === 0 ? '' : (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            className="bg-background border-border text-foreground shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-foreground font-medium">Data</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="bg-background border-border text-foreground shadow-sm"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={type === 'deposit' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                        >
                            {isSubmitting ? 'Salvando...' : type === 'deposit' ? '💰 Adicionar Aporte' : '💸 Registrar Retirada'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
