'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card as CardType } from '@/types';

interface NewSubscriptionDialogProps {
    open: boolean;
    onClose: () => void;
    onSubscriptionCreated: () => void;
    card: CardType;
}

export const NewSubscriptionDialog: React.FC<NewSubscriptionDialogProps> = ({
    open,
    onClose,
    onSubscriptionCreated,
    card
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        categoryId: '',
        chargeDay: card.dueDay.toString(),
        startDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Criar transação de assinatura
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: formData.description,
                    amount: parseFloat(formData.amount) * 100, // Converter para centavos
                    cardId: card.id,
                    categoryId: formData.categoryId,
                    date: formData.startDate,
                    type: 'despesa',
                    tags: ['assinatura'], // Marcar como assinatura
                    recurring: true,
                    recurringDay: parseInt(formData.chargeDay)
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
                amount: '',
                categoryId: '',
                chargeDay: card.dueDay.toString(),
                startDate: new Date().toISOString().split('T')[0]
            });
        } catch {
            alert('Erro ao criar assinatura');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">🔄 Nova Assinatura - {card.alias}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                Valor Mensal (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                placeholder="0,00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Dia da Cobrança
                            </label>
                            <select
                                value={formData.chargeDay}
                                onChange={(e) => setFormData(prev => ({ ...prev, chargeDay: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            >
                                {Array.from({ length: 31 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Dia {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Data de Início
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
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