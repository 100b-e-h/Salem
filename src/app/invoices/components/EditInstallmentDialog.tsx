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
import { TagsInput } from '@/components/ui/TagsInput';
import { Badge } from '@/components/ui/Badge';
import type { Transaction } from '@/types';

type TxWithCat = Transaction & { category?: string };

// Helper function to remove installment suffix from description (e.g., " (1/6)")
function stripInstallmentSuffix(description: string): string {
    const installmentPattern = / \(\d+\/\d+\)$/;
    return description.replace(installmentPattern, '').trim();
}

interface EditInstallmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction | null;
    onSaved: () => void;
}

export const EditInstallmentDialog: React.FC<EditInstallmentDialogProps> = ({
    open,
    onOpenChange,
    transaction,
    onSaved
}) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState<string[]>([]);
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
            // Strip installment suffix when displaying in the edit form
            setDescription(stripInstallmentSuffix(transaction.description || ''));
            setAmount(transaction.amount || 0);
            // Extract UTC date (YYYY-MM-DD) from timestamp for HTML date input
            // This ensures the date shown matches the stored UTC date
            setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
            const tx = transaction as TxWithCat;
            setCategory(tx.category || '');
            setTags(transaction.tags || []);
        } else {
            setDescription('');
            setAmount(0);
            setDate('');
            setCategory('');
            setTags([]);
        }
    }, [transaction]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;

        // Validação obrigatória da categoria
        if (!category) {
            alert('Por favor, selecione uma categoria para o lançamento.');
            return;
        }

        const confirmMessage = `Esta alteração será aplicada em TODAS AS ${transaction.installments} PARCELAS deste lançamento. Deseja continuar?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/transactions/${transaction.transactionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    amount,
                    date,
                    category,
                    tags,
                    updateAllInstallments: true, // Flag to update all related installments
                }),
            });
            if (!res.ok) throw new Error('Failed to update installments');
            onSaved();
            onOpenChange(false);
        } catch {
            alert('Erro ao salvar parcelamento');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-card border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle>✏️ Editar Parcelamento</DialogTitle>
                    <DialogDescription>
                        Altere os dados do parcelamento. As mudanças serão aplicadas em todas as parcelas.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 p-4">
                    {transaction && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                            <div className="flex items-start space-x-3">
                                <div className="text-2xl">⚠️</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                                        Atenção: Edição em Lote
                                    </h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        Esta alteração será aplicada em <strong>TODAS as {transaction.installments} parcelas</strong> deste lançamento.
                                    </p>
                                    <div className="mt-2 flex items-center space-x-2">
                                        <Badge variant="secondary" className="text-xs">
                                            Parcela {transaction.currentInstallment}/{transaction.installments}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Notebook Dell"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor da Parcela</Label>
                            <MoneyInput
                                id="amount"
                                value={amount === 0 ? '' : (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                onValueChange={(v) => setAmount(Number(v))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Data da 1ª Parcela</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Categoria *</Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            required
                        >
                            <option value="">Selecione uma categoria...</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">🏷️ Tags</Label>
                        <TagsInput
                            value={tags}
                            onChange={setTags}
                            placeholder="Adicionar tags (Enter para adicionar)..."
                        />
                    </div>

                    {transaction && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-medium text-foreground">📊 Informações do Parcelamento</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Total de Parcelas:</span>
                                    <p className="font-semibold text-foreground">{transaction.installments}x</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Valor Total:</span>
                                    <p className="font-semibold text-foreground">
                                        {((amount * (transaction.installments || 1)) / 100).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Salvando...' : '💾 Salvar Todas as Parcelas'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
