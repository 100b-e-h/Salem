'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { TagsInput } from '@/components/ui/TagsInput';
import { Card as CardType } from '@/types';

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
        categoryId: 'outros',
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
        const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        
        for (let i = 0; i < 15; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            options.push({ value, label: formattedLabel });
        }
        return options;
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
            
            const response = await fetch(`/api/cards/${selectedCardId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: formData.description,
                    amount: Math.round(totalAmount * 100), // Converter para centavos e garantir inteiro
                    installments: parseInt(formData.installments),
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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Número de Parcelas
                            </label>
                            <select
                                value={formData.installments}
                                onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i + 2} value={i + 2}>
                                        {i + 2}x
                                    </option>
                                ))}
                            </select>
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
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary text-primary-foreground"
                            >
                                {loading ? 'Criando...' : 'Criar Parcelamento'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
};