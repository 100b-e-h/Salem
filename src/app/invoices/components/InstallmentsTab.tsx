'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Card as CardType } from '@/types';
import { TransactionsTable } from './TransactionsTable';
import { NewInstallmentDialog } from './NewInstallmentDialog';
import type { Transaction } from '@/types';
import type { User } from '@supabase/supabase-js';

interface InstallmentsTabProps {
    user: User | null;
}

export const InstallmentsTab: React.FC<InstallmentsTabProps> = ({ user }) => {
    const [cards, setCards] = useState<CardType[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState<Transaction[]>([]);
    const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);

    const fetchInstallments = useCallback(async () => {
        if (!user || !selectedCard) return;

        const res = await fetch(`/api/cards/${selectedCard}/transactions`);
        if (res.ok) {
            const all: Transaction[] = await res.json();
            // Filtrar apenas transações que são parceladas
            setInstallments(
                all.filter((t) => t.installments && t.installments > 1)
            );
        } else {
            setInstallments([]);
        }
    }, [user, selectedCard]);

    useEffect(() => {
        fetchInstallments();
    }, [fetchInstallments, installmentDialogOpen]);

    const handleDeleteInstallment = async (tx: Transaction) => {
        const confirmMessage = `Tem certeza que deseja deletar "${tx.description}"? Isso irá deletar TODAS AS ${tx.installments} PARCELAS do lançamento.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`/api/transactions/${tx.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete installment');
            }

            await fetchInstallments();
            await loadCards();
        } catch {
            alert('Erro ao deletar parcelamento');
        }
    };

    const loadCards = useCallback(async () => {
        if (!user) return;

        try {
            const cardsResponse = await fetch('/api/cards');

            if (!cardsResponse.ok) {
                throw new Error('Failed to fetch cards');
            }

            const cardsData = await cardsResponse.json();
            setCards(cardsData);
        } catch {
            // Erro silencioso
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadCards();
        }
    }, [user, loadCards]);

    useEffect(() => {
        if (cards.length > 0 && !selectedCard) {
            setSelectedCard(cards[0].id);
        }
    }, [cards, selectedCard]);

    const getSelectedCard = () => {
        return cards.find(card => card.id === selectedCard);
    };

    // Agrupar parcelas por transação pai
    const groupedInstallments = installments.reduce((groups, transaction) => {
        const parentId = transaction.parentTransactionId || transaction.id;
        if (!groups[parentId]) {
            groups[parentId] = [];
        }
        groups[parentId].push(transaction);
        return groups;
    }, {} as Record<string, Transaction[]>);

    const totalInstallmentsValue = installments.reduce((sum, installment) => sum + installment.amount, 0);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
        );
    }

    const selectedCardData = getSelectedCard();

    return (
        <div className="space-y-6">
            {selectedCardData && (
                <NewInstallmentDialog
                    open={installmentDialogOpen}
                    onClose={() => setInstallmentDialogOpen(false)}
                    onInstallmentCreated={() => {
                        fetchInstallments();
                        loadCards();
                    }}
                    card={selectedCardData}
                />
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">💳 Compras Parceladas</h2>
                <Button
                    onClick={() => setInstallmentDialogOpen(true)}
                    disabled={!selectedCardData}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                    <span className="mr-2">+</span>
                    Nova Compra Parcelada
                </Button>
            </div>

            {cards.length === 0 ? (
                <Card className="bg-card border-border shadow-md">
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">💳</div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Nenhum cartão cadastrado
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Você precisa cadastrar pelo menos um cartão para visualizar parcelamentos.
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="bg-card border-border shadow-md">
                        <div className="p-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    💳 Cartão
                                </label>
                                <select
                                    value={selectedCard}
                                    onChange={(e) => setSelectedCard(e.target.value)}
                                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                >
                                    {cards.map((card) => (
                                        <option key={card.id} value={card.id}>
                                            {card.alias} - {card.brand}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>

                    {selectedCardData && (
                        <>
                            <Card className="bg-card border-border shadow-md">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl">💳</div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-foreground">
                                                    Parcelamentos - {selectedCardData.alias}
                                                </h2>
                                                <p className="text-muted-foreground">
                                                    {selectedCardData.brand} • Compras a prazo
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-3xl mb-3">💰</div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Total em Parcelas
                                            </h3>
                                            <CurrencyDisplay
                                                amount={totalInstallmentsValue}
                                                size="xl"
                                                variant="negative"
                                            />
                                        </div>

                                        <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-3xl mb-3">📊</div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Compras Parceladas
                                            </h3>
                                            <div className="text-xl font-semibold text-foreground">
                                                {Object.keys(groupedInstallments).length}
                                            </div>
                                        </div>

                                        <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-3xl mb-3">📋</div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Total de Parcelas
                                            </h3>
                                            <div className="text-xl font-semibold text-foreground">
                                                {installments.length}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-card border-border shadow-md">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            💳 Compras Parceladas
                                        </h3>
                                        <Badge variant="secondary">
                                            {Object.keys(groupedInstallments).length} compra{Object.keys(groupedInstallments).length !== 1 ? 's' : ''}
                                        </Badge>
                                    </div>

                                    {installments.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-4">💳</div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">
                                                Nenhum parcelamento encontrado
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Este cartão não possui compras parceladas.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.entries(groupedInstallments).map(([parentId, transactions]) => {
                                                const mainTransaction = transactions[0];
                                                const installmentInfo = transactions.length > 1
                                                    ? `${transactions.length}x de `
                                                    : `${mainTransaction.currentInstallment || 1}/${mainTransaction.installments} - `;

                                                return (
                                                    <Card key={parentId} className="border border-border">
                                                        <div className="p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <h4 className="font-semibold text-foreground">
                                                                        {mainTransaction.description}
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {installmentInfo}
                                                                        <CurrencyDisplay amount={mainTransaction.amount} />
                                                                    </p>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <Badge variant="outline">
                                                                        {mainTransaction.installments}x
                                                                    </Badge>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleDeleteInstallment(mainTransaction)}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        🗑️ Deletar
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-border pt-3">
                                                                <TransactionsTable
                                                                    transactions={transactions}
                                                                    onEdit={() => { }} // Placeholder - parcelas podem não ser editáveis
                                                                    onDelete={handleDeleteInstallment}
                                                                />
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};