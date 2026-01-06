'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Card as CardType } from '@/types';
import { TransactionsTable } from './TransactionsTable';
import { NewInstallmentDialog } from './NewInstallmentDialog';
import { MultiCardSelector } from './MultiCardSelector';
import { EditInstallmentDialog } from './EditInstallmentDialog';
import { InvoiceFiltersPopover, type FilterState } from './InvoiceFiltersPopover';
import type { Transaction } from '@/types';
import type { User } from '@supabase/supabase-js';

interface InstallmentsTabProps {
    user: User | null;
}

export const InstallmentsTab: React.FC<InstallmentsTabProps> = ({ user }) => {
    const [cards, setCards] = useState<CardType[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState<Transaction[]>([]);
    const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
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

    const fetchInstallments = useCallback(async () => {
        if (!user) return;
        if (selectedCardIds.length === 0) {
            setInstallments([]);
            return;
        }

        // Use multi-card API with cardIds parameter
        const cardIdsParam = selectedCardIds.join(',');
        const endpoint = `/api/cards/all/transactions?financeType=installment&cardIds=${cardIdsParam}`;
        
        const res = await fetch(endpoint);
        if (res.ok) {
            const all: Transaction[] = await res.json();
            setInstallments(all);
        } else {
            setInstallments([]);
        }
    }, [user, selectedCardIds]);

    useEffect(() => {
        fetchInstallments();
    }, [fetchInstallments, installmentDialogOpen]);

    const handleEditTransaction = (tx: Transaction) => {
        // Note: Editing an installment will affect all related installments with the same transaction reference
        console.log('Edit clicked for transaction:', tx);
        setEditingTransaction(tx);
        setEditDialogOpen(true);
        console.log('Dialog should open now, editDialogOpen:', true);
    };

    const handleDeleteInstallment = async (tx: Transaction) => {
        const confirmMessage = `Tem certeza que deseja deletar "${tx.description}"? Isso irá deletar TODAS AS ${tx.installments} PARCELAS do lançamento.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`/api/transactions/${tx.transactionId}`, {
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
        if (cards.length > 0 && selectedCardIds.length === 0) {
            // Select all cards by default
            setSelectedCardIds(cards.map(c => c.cardId));
        }
    }, [cards, selectedCardIds]);

    const getSelectedCards = () => {
        return cards.filter(card => selectedCardIds.includes(card.cardId));
    };

    const getSelectedCard = () => {
        // Return first selected card for dialog purposes
        return selectedCardIds.length === 1 
            ? cards.find(card => card.cardId === selectedCardIds[0])
            : undefined;
    };

    // Filter installments based on filter state
    const filteredInstallments = useMemo(() => {
        return installments.filter(transaction => {
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

            // Installments range filter
            if (filters.minInstallments) {
                const minInstallments = parseInt(filters.minInstallments);
                if (!transaction.installments || transaction.installments < minInstallments) return false;
            }
            if (filters.maxInstallments) {
                const maxInstallments = parseInt(filters.maxInstallments);
                if (!transaction.installments || transaction.installments > maxInstallments) return false;
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
    }, [installments, filters]);

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchQuery) count++;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        if (filters.minAmount) count++;
        if (filters.maxAmount) count++;
        if (filters.minInstallments) count++;
        if (filters.maxInstallments) count++;
        if (filters.selectedTags.length > 0) count++;
        if (filters.selectedCategories.length > 0) count++;
        return count;
    }, [filters]);

    const totalInstallmentsValue = filteredInstallments.reduce((sum, installment) => sum + installment.amount, 0);

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
            <EditInstallmentDialog
                open={editDialogOpen}
                onOpenChange={(open) => setEditDialogOpen(open)}
                transaction={editingTransaction}
                onSaved={() => {
                    fetchInstallments();
                    loadCards();
                }}
            />
            
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
                    disabled={!selectedCardData || selectedCardIds.length !== 1}
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
                                    💳 Selecione os Cartões
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
                                            <div className="text-2xl">💳</div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-foreground">
                                                    Parcelamentos - {selectedCardIds.length === cards.length ? 'Todos os Cartões' : selectedCardIds.length === 1 ? selectedCardData?.alias : `${selectedCardIds.length} Cartões`}
                                                </h2>
                                                <p className="text-muted-foreground">
                                                    {selectedCardIds.length === 1 && selectedCardData ? `${selectedCardData.brand} • Compras a prazo` : `${getSelectedCards().length} cartão${getSelectedCards().length > 1 ? 'ões' : ''} • Compras a prazo`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                Total de Parcelas
                                            </h3>
                                            <div className="text-xl font-semibold text-foreground">
                                                {installments.length}
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
                                            💳 Detalhamento de Parcelas
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <InvoiceFiltersPopover
                                                onFilterChange={setFilters}
                                                activeFilterCount={activeFilterCount}
                                                transactions={installments}
                                                showInstallmentFilter={true}
                                            />
                                            <Badge variant="secondary">
                                                {installments.length} parcela{installments.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                    </div>

                                    {activeFilterCount > 0 && (
                                        <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                                            <span className="text-sm text-muted-foreground">
                                                Mostrando <strong className="text-foreground">{filteredInstallments.length}</strong> de <strong className="text-foreground">{installments.length}</strong> parcelas
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
                                        <TransactionsTable
                                            transactions={filteredInstallments}
                                            onEdit={handleEditTransaction}
                                            onDelete={handleDeleteInstallment}
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