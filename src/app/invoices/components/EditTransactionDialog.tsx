import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/MoneyInput';
import type { Transaction } from '@/types';

type TxWithCat = Transaction & { category?: string };

interface EditTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction | null;
    onSaved: () => void;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({ open, onOpenChange, transaction, onSaved }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const CATEGORIES = [
        { value: 'alimentacao', label: '🍔 Alimentação' },
        { value: 'transporte', label: '🚗 Transporte' },
        { value: 'saude', label: '⚕️ Saúde' },
        { value: 'educacao', label: '📚 Educação' },
        { value: 'lazer', label: '🎮 Lazer' },
        { value: 'vestuario', label: '👕 Vestuário' },
        { value: 'moradia', label: '🏠 Moradia' },
        { value: 'servicos', label: '🔧 Serviços' },
        { value: 'compras', label: '🛒 Compras' },
        { value: 'outros', label: '📦 Outros' },
    ];

    useEffect(() => {
        if (transaction) {
            setDescription(transaction.description || '');
            setAmount(transaction.amount || 0);
            setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
            const tx = transaction as TxWithCat;
            setCategory(tx.category || '');
        } else {
            setDescription('');
            setAmount(0);
            setDate('');
            setCategory('');
        }
    }, [transaction]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/transactions/${transaction.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, amount, date, category }),
            });
            if (!res.ok) throw new Error('Failed to update');
            onSaved();
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to save transaction', err);
            alert('Erro ao salvar transação');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-card border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle>✏️ Editar Lançamento</DialogTitle>
                    <DialogDescription>Altere os dados e salve.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 p-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor</Label>
                            <MoneyInput id="amount" value={amount === 0 ? '' : (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} onValueChange={(v) => setAmount(Number(v))} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Selecione uma categoria...</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
