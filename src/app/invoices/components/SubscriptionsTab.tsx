'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Card as CardType } from '@/types';
import { TransactionsTable } from './TransactionsTable';
import { NewSubscriptionDialog } from './NewSubscriptionDialog';
import { EditTransactionDialog } from './EditTransactionDialog';
import { InvoiceFiltersPopover, type FilterState } from './InvoiceFiltersPopover';
import { MultiCardSelector } from './MultiCardSelector';
import type { Transaction } from '@/types';
import type { User } from '@supabase/supabase-js';

interface SubscriptionsTabProps {
    user: User | null;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ user }) => {
    const [cards, setCards] = useState<CardType[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Transaction[]>([]);
    const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        searchQuery: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        selectedTags: [],
        selectedCategories: [],
        minInstallments: '',
        maxInstallments: '',
    });

    const fetchSubscriptions = useCallback(async () => {
        if (!user) return;
        if (selectedCardIds.length === 0) {
            setSubscriptions([]);
            return;
        }

        const cardIdsParam = selectedCardIds.join(',');
        const endpoint = `/api/cards/all/transactions?financeType=subscription&cardIds=${cardIdsParam}`;
        
        const res = await fetch(endpoint);
        if (res.ok) {
            const all: Transaction[] = await res.json();
            setSubscriptions(all);
        } else {
            setSubscriptions([]);
        }
    }, [user, selectedCardIds]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions, subscriptionDialogOpen]);

    const handleEditTransaction = (tx: Transaction) => {
        setEditingTransaction(tx);
        setEditDialogOpen(true);
    };

    const handleDeleteSubscription = async (tx: Transaction) => {
        if (!confirm(`Tem certeza que deseja cancelar a assinatura "${tx.description}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/transactions/${tx.transactionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete subscription');
            }

            await fetchSubscriptions();
            await loadCards();
        } catch {
            alert('Erro ao cancelar assinatura');
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
        if (cards.length > 0 && selectedCardIds.length === 0) {
            setSelectedCardIds(cards.map(c => c.cardId));
        }
    }, [cards, selectedCardIds.length]);

    const getSelectedCards = () => {
        return cards.filter(card => selectedCardIds.includes(card.cardId));
    };

    const getSelectedCard = () => {
        return selectedCardIds.length === 1 
            ? cards.find(card => card.cardId === selectedCardIds[0])
            : undefined;
    };

    // Filter subscriptions based on filter state
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter(transaction => {
            // Search query filter
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                const matchesDescription = transaction.description?.toLowerCase().includes(query);
                if (!matchesDescription) return false;
            }

            // Date range filter
            if (filters.startDate || filters.endDate) {
                const transactionDate = new Date(transaction.date);
                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    if (transactionDate < startDate) return false;
                }
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    if (transactionDate > endDate) return false;
                }
            }

            // Amount range filter
            if (filters.minAmount) {
                const minAmount = parseFloat(filters.minAmount) * 100;
                if (Math.abs(transaction.amount) < minAmount) return false;
            }
            if (filters.maxAmount) {
                const maxAmount = parseFloat(filters.maxAmount) * 100;
                if (Math.abs(transaction.amount) > maxAmount) return false;
            }

            // Tags filter
            if (filters.selectedTags.length > 0) {
                const hasNoTagsFilter = filters.selectedTags.includes('__no_tags__');
                const regularTags = filters.selectedTags.filter(tag => tag !== '__no_tags__');
                
                // If transaction has no tags
                const transactionHasNoTags = !transaction.tags || !Array.isArray(transaction.tags) || transaction.tags.length === 0;
                
                if (hasNoTagsFilter && transactionHasNoTags) {
                    // Transaction matches "no tags" filter
                    return true;
                }
                
                if (regularTags.length > 0 && transaction.tags && Array.isArray(transaction.tags)) {
                    const hasMatchingTag = regularTags.some(tag => transaction.tags?.includes(tag));
                    if (hasMatchingTag) {
                        return true;
                    }
                }
                
                // If we get here and there are filters applied, no match was found
                if (hasNoTagsFilter || regularTags.length > 0) {
                    return false;
                }
            }

            // Categories filter
            if (filters.selectedCategories.length > 0) {
                if (!transaction.category) return false;
                if (!filters.selectedCategories.includes(transaction.category)) return false;
            }

            return true;
        });
    }, [subscriptions, filters]);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchQuery) count++;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        if (filters.minAmount) count++;
        if (filters.maxAmount) count++;
        if (filters.selectedTags.length > 0) count++;
        if (filters.selectedCategories.length > 0) count++;
        return count;
    }, [filters]);

    const totalSubscriptionsValue = filteredSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0);

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
                <>
                    <NewSubscriptionDialog
                        open={subscriptionDialogOpen}
                        onClose={() => setSubscriptionDialogOpen(false)}
                        onSubscriptionCreated={() => {
                            fetchSubscriptions();
                            loadCards();
                        }}
                        card={selectedCardData}
                    />
                    <EditTransactionDialog
                        open={editDialogOpen}
                        onOpenChange={(open) => setEditDialogOpen(open)}
                        transaction={editingTransaction}
                        onSaved={() => {
                            fetchSubscriptions();
                            loadCards();
                        }}
                    />
                </>
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">🔄 Assinaturas</h2>
                <Button
                    onClick={() => setSubscriptionDialogOpen(true)}
                    disabled={selectedCardIds.length !== 1}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                    <span className="mr-2">+</span>
                    Nova Assinatura
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
                            Você precisa cadastrar pelo menos um cartão para visualizar assinaturas.
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="bg-card border-border shadow-md">
                        <div className="p-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">
                                    💳 Cartões
                                </label>
                                <MultiCardSelector
                                    cards={cards}
                                    selectedCardIds={selectedCardIds}
                                    onSelectionChange={setSelectedCardIds}
                                />
                            </div>
                        </div>
                    </Card>

                    {selectedCardIds.length > 0 && (
                        <>
                            <Card className="bg-card border-border shadow-md">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl">🔄</div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-foreground">
                                                    Assinaturas - {selectedCardIds.length === 1 && selectedCardData ? selectedCardData.alias : `${selectedCardIds.length} Cartões`}
                                                </h2>
                                                <p className="text-muted-foreground">
                                                    {selectedCardIds.length === 1 && selectedCardData ? `${selectedCardData.brand} • Serviços recorrentes` : 'Consolidado • Serviços recorrentes'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-3xl mb-3">💰</div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Total Mensal em Assinaturas
                                            </h3>
                                            <CurrencyDisplay
                                                amount={totalSubscriptionsValue}
                                                size="xl"
                                                variant="negative"
                                            />
                                        </div>

                                        <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-3xl mb-3">📊</div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Quantidade de Assinaturas
                                            </h3>
                                            <div className="text-xl font-semibold text-foreground">
                                                {subscriptions.length}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedCardIds.length > 1 && (
                                        <div className="mt-6 pt-4 border-t border-border">
                                            <div className="text-sm text-muted-foreground mb-3">
                                                Cartões incluídos nesta visualização:
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {getSelectedCards().map((card) => (
                                                    <Badge 
                                                        key={card.cardId} 
                                                        variant="outline"
                                                        className="px-3 py-1 bg-muted/50"
                                                    >
                                                        {card.alias} • {card.brand}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="bg-card border-border shadow-md">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            🔄 Assinaturas Ativas
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <InvoiceFiltersPopover
                                                onFilterChange={setFilters}
                                                activeFilterCount={activeFilterCount}
                                                transactions={subscriptions}
                                                showInstallmentFilter={false}
                                            />
                                            <Badge variant="secondary">
                                                {subscriptions.length} assinatura{subscriptions.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                    </div>

                                    {activeFilterCount > 0 && (
                                        <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                                            <span className="text-sm text-muted-foreground">
                                                Mostrando <strong className="text-foreground">{filteredSubscriptions.length}</strong> de <strong className="text-foreground">{subscriptions.length}</strong> assinaturas
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setFilters({
                                                    searchQuery: '',
                                                    startDate: '',
                                                    endDate: '',
                                                    minAmount: '',
                                                    maxAmount: '',
                                                    selectedTags: [],
                                                    selectedCategories: [],
                                                    minInstallments: '',
                                                    maxInstallments: '',
                                                })}
                                                className="text-xs"
                                            >
                                                🔄 Limpar Filtros
                                            </Button>
                                        </div>
                                    )}

                                    {subscriptions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-4">🔄</div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">
                                                Nenhuma assinatura encontrada
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Este cartão não possui assinaturas ativas.
                                            </p>
                                        </div>
                                    ) : (
                                        <TransactionsTable
                                            transactions={filteredSubscriptions}
                                            onEdit={handleEditTransaction}
                                            onDelete={handleDeleteSubscription}
                                        />
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