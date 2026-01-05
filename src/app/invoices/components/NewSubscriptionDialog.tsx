'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { TagsInput } from '@/components/ui/TagsInput';
import { Card as CardType } from '@/types';

interface NewSubscriptionDialogProps {
    open: boolean;
    onClose: () => void;
    onSubscriptionCreated: () => void;
    card?: CardType;
}

export const NewSubscriptionDialog: React.FC<NewSubscriptionDialogProps> = ({
    open,
    onClose,
    onSubscriptionCreated,
    card
}) => {
    const [loading, setLoading] = useState(false);
    const [cards, setCards] = useState<CardType[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string>(card?.cardId || '');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    
    const [formData, setFormData] = useState({
        description: '',
        amountCentavos: 0,
        categoryId: '',
        chargeDay: '1',
        transactionDate: new Date().toISOString().split('T')[0], // Date when subscription is charged
        tags: [] as string[]
    });

    // Generate month options for Competência (15 months: current + 14 future)
    const getMonthOptions = () => {
        const options = [];
        const today = new Date();
        
        for (let i = 0; i < 15; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            options.push({
                value: `${year}-${String(month).padStart(2, '0')}`,
                label: monthName.charAt(0).toUpperCase() + monthName.slice(1)
            });
        }
        
        return options;
    };

    // Set default selected month to current month
    useEffect(() => {
        if (!selectedMonth) {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
        }
    }, [selectedMonth]);

    // Fetch cards if not provided
    useEffect(() => {
        if (!card && open) {
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
            fetchCards();
        }
    }, [card, open]);

    // Update form when card prop changes
    useEffect(() => {
        if (card) {
            setSelectedCardId(card.cardId);
            setFormData(prev => ({ ...prev, chargeDay: card.dueDay.toString() }));
        }
    }, [card]);

    const handleCardChange = (cardId: string) => {
        setSelectedCardId(cardId);
        const selectedCard = cards.find(c => c.cardId === cardId);
        if (selectedCard) {
             setFormData(prev => ({ ...prev, chargeDay: selectedCard.dueDay.toString() }));
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedCardId) {
            alert('Selecione um cartão');
            setLoading(false);
            return;
        }

        try {
            // Parse selected month for invoice period
            const [year, month] = selectedMonth.split('-').map(Number);
            
            // Criar transação de assinatura usando o endpoint correto
            const response = await fetch(`/api/cards/${selectedCardId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: formData.description,
                    amount: formData.amountCentavos,
                    category: formData.categoryId || null,
                    date: formData.transactionDate, // Use transaction date, not invoice date
                    installments: 1, // Assinatura é tratada como transação única recorrente
                    invoiceMonth: month,
                    invoiceYear: year,
                    financeType: "subscription", // Mark as subscription
                    tags: formData.tags,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create subscription');
            }

            onSubscriptionCreated();
            onClose();

            // Reset form
            setFormData({
                description: '',
                amountCentavos: 0,
                categoryId: '',
                chargeDay: card?.dueDay.toString() || '1',
                transactionDate: new Date().toISOString().split('T')[0],
                tags: []
            });
        } catch {
            alert('Erro ao criar assinatura');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const displayCard = card || cards.find(c => c.cardId === selectedCardId);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">
                        🔄 Nova Assinatura {displayCard ? `- ${displayCard.alias}` : ''}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!card && (
                             <div>
                                <label className="block text-sm font-medium mb-2">
                                    🏦 Lançar no Cartão *
                                </label>
                                <select
                                    value={selectedCardId}
                                    onChange={(e) => handleCardChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                    required
                                >
                                    <option value="" disabled>Selecione um cartão...</option>
                                    {cards.map(c => (
                                        <option key={c.cardId} value={c.cardId}>{c.alias} - {c.brand}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Descrição da Assinatura
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                placeholder="Ex: Netflix, Spotify, etc..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Valor Mensal
                            </label>
                            <MoneyInput
                                required
                                initialCentavos={formData.amountCentavos}
                                onValueChange={(centavos) => setFormData(prev => ({ ...prev, amountCentavos: centavos }))}
                                placeholder="0,00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Competência (Fatura)
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                required
                            >
                                {getMonthOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Dia da Cobrança (1-31)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                required
                                value={formData.chargeDay}
                                onChange={(e) => setFormData(prev => ({ ...prev, chargeDay: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                placeholder="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Data da Transação
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.transactionDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            />
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
                                {loading ? 'Criando...' : 'Criar Assinatura'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
};