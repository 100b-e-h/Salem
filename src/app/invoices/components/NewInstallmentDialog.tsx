'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card as CardType } from '@/types';

interface NewInstallmentDialogProps {
    open: boolean;
    onClose: () => void;
    onInstallmentCreated: () => void;
    card: CardType;
}

export const NewInstallmentDialog: React.FC<NewInstallmentDialogProps> = ({
    open,
    onClose,
    onInstallmentCreated,
    card
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        totalAmount: '',
        installments: '2',
        categoryId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        firstDueDate: ''
    });

    const calculateInstallmentValue = () => {
        if (formData.totalAmount && formData.installments) {
            const total = parseFloat(formData.totalAmount);
            const installmentCount = parseInt(formData.installments);
            return (total / installmentCount).toFixed(2);
        }
        return '0.00';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Criar transação parcelada
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: formData.description,
                    totalAmount: parseFloat(formData.totalAmount) * 100, // Converter para centavos
                    installments: parseInt(formData.installments),
                    cardId: card.id,
                    categoryId: formData.categoryId,
                    date: formData.purchaseDate,
                    firstDueDate: formData.firstDueDate,
                    type: 'despesa',
                    isInstallment: true
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create installment');
            }

            onInstallmentCreated();
            onClose();

            // Reset form
            setFormData({
                description: '',
                totalAmount: '',
                installments: '2',
                categoryId: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                firstDueDate: ''
            });
        } catch {
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
                    <h2 className="text-xl font-semibold mb-4">📊 Nova Compra Parcelada - {card.alias}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                Valor Total (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.totalAmount}
                                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
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
                                        {i + 2}x de R$ {formData.totalAmount ? (parseFloat(formData.totalAmount) / (i + 2)).toFixed(2) : '0,00'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Valor por parcela:</strong> R$ {calculateInstallmentValue()}
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
                                Data da Primeira Parcela
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.firstDueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstDueDate: e.target.value }))}
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
                                {loading ? 'Criando...' : 'Criar Parcelamento'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
};