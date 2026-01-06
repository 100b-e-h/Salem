'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { TagsInput } from '@/components/ui/TagsInput';
import { Card as CardType } from '@/types';
import { cn } from '@/lib/utils';

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

interface NewInstallmentDialogProps {
    open: boolean;
    onClose: () => void;
    onInstallmentCreated: () => void;
    card?: CardType; // Optional - if not provided, user must select a card
}

export const NewInstallmentDialog: React.FC<NewInstallmentDialogProps> = ({
    open,
    onClose,
    onInstallmentCreated,
    card
}) => {
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState<CardType[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string>(card?.cardId || '');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [formData, setFormData] = useState({
        description: '',
        installmentAmountCentavos: 0,
        installments: '2',
        currentInstallmentNumber: '1', // Nova propriedade
        categoryId: 'outros',
        // Date stored as UTC timestamp (midnight), displayed as date-only in HTML input
        purchaseDate: new Date().toISOString().split('T')[0],
        tags: [] as string[]
    });

    React.useEffect(() => {
        if (!selectedMonth && open) {
            const currentMonth = new Date();
            setSelectedMonth(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`);
        }

        // Fetch cards if card prop is not provided
        if (!card && open) {
            fetchCards();
        } else if (card) {
            setSelectedCardId(card.cardId);
        }
    }, [selectedMonth, open, card]);

    const fetchCards = async () => {
        try {
            const res = await fetch('/api/cards');
            if (res.ok) {
                const data = await res.json();
                setCards(data);
                // Don't auto-select - let user choose
            }
        } catch (error) {
            console.error('Failed to fetch cards', error);
        }
    };

    const getMonthOptions = () => {
        const options = [];
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 24, 1);

        for (let i = 0; i < 39; i++) { // 24 meses atrás + 15 meses à frente
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            options.push({ value, label: formattedLabel });
        }
        return options;
    };

    // Nova função para calcular preview das parcelas
    const getInstallmentPreview = () => {
        if (!selectedMonth) return [];

        const totalInstallments = parseInt(formData.installments);
        const currentInstallment = parseInt(formData.currentInstallmentNumber);
        const [year, month] = selectedMonth.split('-').map(Number);

        const preview = [];

        // Mostrar até 5 parcelas (incluindo anteriores e futuras)
        const startIndex = Math.max(0, currentInstallment - 3); // Mostrar até 2 parcelas anteriores
        const endIndex = Math.min(totalInstallments, currentInstallment + 2); // Mostrar até 2 parcelas futuras

        for (let i = startIndex; i < endIndex; i++) {
            const installmentNum = i + 1;

            // Calcular o offset do mês baseado na parcela atual
            // Se currentInstallment = 10 e estamos vendo installmentNum = 1,
            // então offset = 1 - 10 = -9 (9 meses atrás)
            const monthOffset = installmentNum - currentInstallment;
            const date = new Date(year, month - 1 + monthOffset, 1);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

            preview.push({
                installmentNum,
                month: monthLabel,
                isSelected: installmentNum === currentInstallment,
                isPast: installmentNum < currentInstallment,
                isFuture: installmentNum > currentInstallment
            });
        }

        return preview;
    };

    const calculateTotalValue = () => {
        if (formData.installmentAmountCentavos && formData.installments) {
            const totalCentavos = formData.installmentAmountCentavos * parseInt(formData.installments);
            return (totalCentavos / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return '0,00';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedCardId) {
            alert('Por favor, selecione um cartão.');
            setLoading(false);
            return;
        }

        try {
            // Criar transação parcelada
            const totalAmount = (formData.installmentAmountCentavos * parseInt(formData.installments)) / 100;
            const [year, month] = selectedMonth.split('-').map(Number);
            const currentInstallment = parseInt(formData.currentInstallmentNumber);
            const installmentOffset = currentInstallment - 1; // Quantas parcelas já passaram

            const response = await fetch(`/api/cards/${selectedCardId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: formData.description,
                    amount: Math.round(totalAmount * 100),
                    installments: parseInt(formData.installments),
                    installmentOffset, // Novo campo
                    category: formData.categoryId,
                    date: formData.purchaseDate,
                    invoiceMonth: month,
                    invoiceYear: year,
                    tags: formData.tags,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create installment');
            }

            onInstallmentCreated();
            onClose();

            // Reset form
            setSelectedMonth('');
            setFormData({
                description: '',
                installmentAmountCentavos: 0,
                installments: '2',
                currentInstallmentNumber: '1',
                categoryId: 'outros',
                purchaseDate: new Date().toISOString().split('T')[0],
                tags: []
            });
        } catch (error) {
            console.error(error);
            alert('Erro ao criar parcelamento');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const installmentPreview = getInstallmentPreview();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-border/40">
                    <h2 className="text-xl font-semibold mb-4">
                        📊 Nova Compra Parcelada {card ? `- ${card.alias}` : ''}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!card && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    🏦 Lançar no Cartão *
                                </label>
                                <select
                                    value={selectedCardId}
                                    onChange={(e) => setSelectedCardId(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                    required
                                >
                                    <option value="">Selecione um cartão...</option>
                                    {cards.map(c => (
                                        <option key={c.cardId} value={c.cardId}>
                                            {c.alias} - {c.brand}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Descrição da Compra
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                placeholder="Ex: TV 55', Notebook, etc..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Categoria
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            >
                                {CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Valor da Parcela
                            </label>
                            <MoneyInput
                                required
                                initialCentavos={formData.installmentAmountCentavos}
                                onValueChange={(centavos) => setFormData(prev => ({ ...prev, installmentAmountCentavos: centavos }))}
                                placeholder="0,00"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Número de Parcelas
                                </label>
                                <select
                                    value={formData.installments}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        installments: e.target.value,
                                        currentInstallmentNumber: '1' // Reset quando mudar total
                                    }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i + 2} value={i + 2}>
                                            {i + 2}x
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Parcela Atual
                                </label>
                                <select
                                    value={formData.currentInstallmentNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currentInstallmentNumber: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                >
                                    {Array.from({ length: parseInt(formData.installments) }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {i + 1}/{formData.installments}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Valor Total:</strong> R$ {calculateTotalValue()}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Data da Compra
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Competência (Mês da Fatura)
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                required
                            >
                                {getMonthOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Preview das parcelas */}
                        {installmentPreview.length > 0 && (
                            <div className="p-3 bg-muted/50 rounded-lg border border-border/40">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    📅 Distribuição das Parcelas:
                                </p>
                                <div className="space-y-1">
                                    {parseInt(formData.currentInstallmentNumber) > 1 && installmentPreview[0].installmentNum > 1 && (
                                        <div className="text-xs text-muted-foreground px-2 italic">
                                            ... {installmentPreview[0].installmentNum - 1} parcela(s) anterior(es)
                                        </div>
                                    )}
                                    {installmentPreview.map((item) => (
                                        <div
                                            key={item.installmentNum}
                                            className={cn(
                                                "text-xs px-2 py-1 rounded transition-colors",
                                                item.isSelected
                                                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                                    : item.isPast
                                                    ? "text-muted-foreground/60 bg-muted/30"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            <span className={cn(item.isPast && "line-through")}>
                                                {item.month}: Parcela {item.installmentNum}/{formData.installments}
                                            </span>
                                            {item.isSelected && " ← Mês Selecionado"}
                                            {item.isPast && " (já lançada)"}
                                        </div>
                                    ))}
                                    {installmentPreview[installmentPreview.length - 1].installmentNum < parseInt(formData.installments) && (
                                        <div className="text-xs text-muted-foreground px-2 italic">
                                            ... e mais {parseInt(formData.installments) - installmentPreview[installmentPreview.length - 1].installmentNum} parcela(s)
                                        </div>
                                    )}
                                </div>

                                {parseInt(formData.currentInstallmentNumber) > 1 && (
                                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                        💡 <strong>Nota:</strong> As parcelas anteriores à {formData.currentInstallmentNumber}/{formData.installments} serão criadas retroativamente nos meses passados.
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tags
                            </label>
                            <TagsInput
                                value={formData.tags}
                                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                                placeholder="Adicionar tags (Enter para adicionar)..."
                            />
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary text-primary-foreground relative overflow-hidden"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                        Criando Parcelas...
                                    </span>
                                ) : (
                                    'Criar Parcelamento'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
};