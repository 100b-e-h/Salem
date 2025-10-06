import React, { useState, useEffect } from 'react';
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

interface EditAccountDialogProps {
    open: boolean;
    onClose: () => void;
    onAccountUpdated: () => void;
    account: Account | null;
}

export function EditAccountDialog({ open, onClose, onAccountUpdated, account }: EditAccountDialogProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [type, setType] = useState('corrente');
    const [balance, setBalance] = useState(0); // Valor em centavos
    const [currency, setCurrency] = useState('BRL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (account) {
            setName(account.name);
            setType(account.type);
            setBalance(account.balance); // Já em centavos
            setCurrency(account.currency);
        }
    }, [account]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting || !account) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/accounts/${account.id}`, {
                method: 'PUT',
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
                throw new Error('Failed to update account');
            }

            onClose();
            onAccountUpdated();
        } catch (error) {
            console.error('Erro ao editar conta:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">✏️ Editar Conta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground font-medium">Nome da Conta</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="bg-background border-border text-foreground shadow-sm"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-foreground font-medium">Tipo</Label>
                        <select
                            id="type"
                            className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            value={type}
                            onChange={e => setType(e.target.value)}
                            required
                        >
                            <option value="corrente">🏦 Conta Corrente</option>
                            <option value="poupanca">🐷 Poupança</option>
                            <option value="carteira">👛 Carteira</option>
                            <option value="corretora">📊 Corretora</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="balance" className="text-foreground font-medium">Saldo</Label>
                        <div className="flex gap-2 items-center">
                            <MoneyInput
                                id="balance"
                                initialCentavos={balance}
                                onValueChange={setBalance}
                                allowNegative={true}
                                required
                                key={account?.id}
                                value={balance === 0 ? '' : (Math.abs(balance) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            />
                            <Button type="button" size="sm" variant={balance < 0 ? 'default' : 'outline'} onClick={() => setBalance(balance > 0 ? -balance : balance === 0 ? -100 : balance)} title="Negativo">-</Button>
                            <Button type="button" size="sm" variant={balance >= 0 ? 'default' : 'outline'} onClick={() => setBalance(Math.abs(balance))} title="Positivo">+</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency" className="text-foreground font-medium">Moeda</Label>
                        <select
                            id="currency"
                            className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            required
                        >
                            <option value="BRL">🇧🇷 Real (BRL)</option>
                            <option value="USD">🇺🇸 Dólar (USD)</option>
                            <option value="EUR">🇪🇺 Euro (EUR)</option>
                        </select>
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
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {isSubmitting ? 'Salvando...' : '✅ Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
