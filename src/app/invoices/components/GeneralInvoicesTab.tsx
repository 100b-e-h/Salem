'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Card as CardType, Invoice } from '@/types';
import { formatDate } from '@/utils/financial';
import { format } from 'date-fns';
import { NewTransactionDialog } from './NewTransactionDialog';
import { EditTransactionDialog } from './EditTransactionDialog';
import { TransactionsTable } from './TransactionsTable';
import { InvoiceFiltersPopover, type FilterState } from './InvoiceFiltersPopover';
import { MultiCardSelector } from './MultiCardSelector';
import type { Transaction } from '@/types';
import type { User } from '@supabase/supabase-js';

interface GeneralInvoicesTabProps {
    user: User | null;
}

export const GeneralInvoicesTab: React.FC<GeneralInvoicesTabProps> = ({ user }) => {
    const [cards, setCards] = useState<CardType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    const fetchTransactions = useCallback(async () => {
        if (!user || !selectedMonth) return;
        if (selectedCardIds.length === 0) {
            setTransactions([]);
            return;
        }

        if (selectedCardIds.length > 1) {
            // Fetch all transactions across selected cards for the selected month
            const [year, month] = selectedMonth.split('-').map(Number);
            const cardIdsParam = selectedCardIds.join(',');
            const res = await fetch(`/api/invoices/all?year=${year}&month=${month}&cardIds=${cardIdsParam}`);
            if (res.ok) {
                const all: Transaction[] = await res.json();
                setTransactions(all);
            } else {
                setTransactions([]);
            }
            return;
        }

        // Single card selected
        const selectedCard = selectedCardIds[0];
        // Buscar a fatura correspondente ao mês selecionado
        const [year, month] = selectedMonth.split('-').map(Number);
        const currentInvoice = invoices.find(invoice =>
            invoice.cardId === selectedCard &&
            invoice.year === year &&
            invoice.month === month
        );

        if (!currentInvoice) {
            setTransactions([]);
            return;
        }

        const res = await fetch(`/api/cards/${selectedCard}/transactions`);
        if (res.ok) {
            const all: Transaction[] = await res.json();
            // Filtrar transações que pertencem a esta fatura usando invoiceId
            setTransactions(
                all.filter((t) => t.invoiceId === currentInvoice.invoiceId)
            );
        } else {
            setTransactions([]);
        }
    }, [user, selectedCardIds, selectedMonth, invoices]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions, transactionDialogOpen]);

    const handleEditTransaction = (tx: Transaction) => {
        setEditingTransaction(tx);
        setEditDialogOpen(true);
    };

    const handleDeleteTransaction = async (tx: Transaction) => {
        if (!confirm(`Tem certeza que deseja deletar "${tx.description}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/transactions/${tx.transactionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }

            await Promise.all([fetchTransactions(), loadData()]);
        } catch {
            alert('Erro ao deletar transação');
        }
    };

    const loadData = useCallback(async () => {
        if (!user) return;

        try {
            const [cardsResponse, invoicesResponse] = await Promise.all([
                fetch('/api/cards'),
                fetch('/api/invoices')
            ]);

            if (!cardsResponse.ok || !invoicesResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const [cardsData, invoicesData] = await Promise.all([
                cardsResponse.json(),
                invoicesResponse.json()
            ]);

            setCards(cardsData);
            setInvoices(invoicesData);
        } catch {
            // Erro silencioso - falha no carregamento
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    useEffect(() => {
        if (cards.length > 0 && selectedCardIds.length === 0) {
            setSelectedCardIds(cards.map(c => c.cardId));
        }
    }, [cards, selectedCardIds.length]);

    useEffect(() => {
        if (!selectedMonth) {
            const currentMonth = format(new Date(), 'yyyy-MM');
            setSelectedMonth(currentMonth);
        }
    }, [selectedMonth]);

    const getSelectedCard = () => {
        return selectedCardIds.length === 1
            ? cards.find(card => card.cardId === selectedCardIds[0])
            : undefined;
    };

    const getInvoiceForMonth = (cardId: string, yearMonth: string) => {
        const [year, month] = yearMonth.split('-').map(Number);
        return invoices.find(invoice =>
            invoice.cardId === cardId &&
            invoice.year === year &&
            invoice.month === month
        );
    };

    const openInvoices = invoices.filter(invoice => invoice.status === 'open');
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');

    const getMonthOptions = useMemo(() => {
        const options = new Map<string, { value: string; label: string; isCurrent: boolean; status?: string }>();
        const currentDate = new Date();
        const currentYearMonth = format(currentDate, 'yyyy-MM');

        options.set(currentYearMonth, {
            value: currentYearMonth,
            label: `${format(currentDate, 'MMM/yyyy')} (Atual)`,
            isCurrent: true
        });

        openInvoices.forEach(invoice => {
            const yearMonth = `${invoice.year}-${String(invoice.month).padStart(2, '0')}`;
            if (!options.has(yearMonth)) {
                const date = new Date(invoice.year, invoice.month - 1);
                options.set(yearMonth, {
                    value: yearMonth,
                    label: `${format(date, 'MMM/yyyy')} (Aberta)`,
                    isCurrent: false,
                    status: 'open'
                });
            }
        });

        paidInvoices.forEach(invoice => {
            const yearMonth = `${invoice.year}-${String(invoice.month).padStart(2, '0')}`;
            if (!options.has(yearMonth)) {
                const date = new Date(invoice.year, invoice.month - 1);
                options.set(yearMonth, {
                    value: yearMonth,
                    label: `${format(date, 'MMM/yyyy')} (Paga)`,
                    isCurrent: false,
                    status: 'paid'
                });
            }
        });

        for (let i = 1; i <= 12; i++) {
            const futureDate = new Date(currentDate);
            futureDate.setMonth(currentDate.getMonth() + i);
            const futureYearMonth = format(futureDate, 'yyyy-MM');

            if (!options.has(futureYearMonth)) {
                options.set(futureYearMonth, {
                    value: futureYearMonth,
                    label: format(futureDate, 'MMM/yyyy'),
                    isCurrent: false
                });
            }
        }

        return Array.from(options.values()).sort((a, b) => b.value.localeCompare(a.value));
    }, [openInvoices, paidInvoices]);

    // Filter transactions based on filter state
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
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
    }, [transactions, filters]);

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

    const getStatusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'open':
                return <Badge variant="secondary">Aberta</Badge>;
            case 'paid':
                return <Badge variant="default">Paga</Badge>;
            case 'overdue':
                return <Badge variant="destructive">Vencida</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const markInvoiceAsPaid = async (invoiceId: string) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'mark_paid'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark invoice as paid');
            }

            await loadData();
        } catch {
            alert('Erro ao marcar fatura como paga');
        }
    };

    const reopenInvoice = async (invoiceId: string) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reopen'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reopen invoice');
            }

            await loadData();
        } catch {
            alert('Erro ao reabrir fatura');
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
        );
    }

    const selectedCardData = getSelectedCard();
    const currentInvoice = selectedCardIds.length === 1 && selectedMonth ?
        getInvoiceForMonth(selectedCardIds[0], selectedMonth) : null;

    return (
        <div className="space-y-6">
            {selectedCardData && (
                <>
                    <NewTransactionDialog
                        open={transactionDialogOpen}
                        onClose={() => setTransactionDialogOpen(false)}
                        onTransactionCreated={loadData}
                        card={selectedCardData}
                        selectedMonth={selectedMonth}
                    />
                    <EditTransactionDialog
                        open={editDialogOpen}
                        onOpenChange={(open) => setEditDialogOpen(open)}
                        transaction={editingTransaction}
                        onSaved={() => {
                            fetchTransactions();
                            loadData();
                        }}
                    />
                </>
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">💳 Fatura do Cartão</h2>
                <Button
                    onClick={() => setTransactionDialogOpen(true)}
                    disabled={selectedCardIds.length !== 1}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                    <span className="mr-2">+</span>
                    Novo Lançamento À Vista
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
                            Você precisa cadastrar pelo menos um cartão para visualizar faturas.
                        </p>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <span className="mr-2">+</span>
                            Cadastrar Cartão
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="bg-card border-border shadow-md">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">
                                        📅 Competência
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                    >
                                        {getMonthOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {selectedCardIds.length > 0 && (
                        <Card className="bg-card border-border shadow-md">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">💳</div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-foreground">
                                                {selectedCardIds.length === 1 && selectedCardData ? selectedCardData.alias : `${selectedCardIds.length} Cartões`}
                                            </h2>
                                            <p className="text-muted-foreground">
                                                {selectedCardIds.length === 1 && selectedCardData ? `${selectedCardData.brand} • Fatura ${selectedMonth}` : `Consolidado • Fatura ${selectedMonth}`}
                                            </p>
                                        </div>
                                    </div>
                                    {currentInvoice && getStatusBadge(currentInvoice.status)}
                                </div>

                                {(selectedCardIds.length > 1 || currentInvoice) ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                                <div className="text-3xl mb-3">💰</div>
                                                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                    Valor Total da Fatura
                                                </h3>
                                                <CurrencyDisplay
                                                    amount={filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)}
                                                    size="xl"
                                                    variant="negative"
                                                />
                                            </div>

                                            {selectedCardIds.length === 1 && currentInvoice && (
                                                <>
                                                    <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                                        <div className="text-3xl mb-3">📅</div>
                                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                            Data de Vencimento
                                                        </h3>
                                                        <div className="text-lg font-semibold text-foreground">
                                                            {currentInvoice.dueDate ? formatDate(new Date(currentInvoice.dueDate)) : 'N/A'}
                                                        </div>
                                                    </div>

                                                    <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                                        <div className="text-3xl mb-3">
                                                            {currentInvoice.status === 'paid' ? '✅' : '⏳'}
                                                        </div>
                                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                            Status da Fatura
                                                        </h3>
                                                        <div className="flex justify-center">
                                                            {getStatusBadge(currentInvoice.status)}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {selectedCardIds.length > 1 && (
                                                <>
                                                    <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                                        <div className="text-3xl mb-3">💳</div>
                                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                            Total de Cartões
                                                        </h3>
                                                        <div className="text-2xl font-semibold text-foreground">
                                                            {cards.length}
                                                        </div>
                                                    </div>

                                                    <div className="text-center p-6 bg-muted/30 rounded-lg border border-border">
                                                        <div className="text-3xl mb-3">📋</div>
                                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                            Total de Transações
                                                        </h3>
                                                        <div className="text-2xl font-semibold text-foreground">
                                                            {filteredTransactions.length}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {selectedCardIds.length === 1 && currentInvoice && currentInvoice.status === 'open' && (
                                            <div className="flex justify-center">
                                                <Button
                                                    onClick={() => markInvoiceAsPaid(currentInvoice.invoiceId)}
                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    ✅ Marcar como Paga
                                                </Button>
                                            </div>
                                        )}

                                        {selectedCardIds.length === 1 && currentInvoice && currentInvoice.status === 'paid' && (
                                            <div className="flex justify-center">
                                                <Button
                                                    onClick={() => reopenInvoice(currentInvoice.invoiceId)}
                                                    variant="outline"
                                                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                                >
                                                    🔄 Reabrir Fatura
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-4">📄</div>
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                            Fatura não encontrada
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            Não há dados para esta competência ainda.
                                        </p>
                                        {selectedCardIds.length === 1 && (
                                            <Button
                                                onClick={() => setTransactionDialogOpen(true)}
                                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                <span className="mr-2">+</span>
                                                Criar Lançamento
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    <Card className="bg-card border-border shadow-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-foreground">
                                    📋 Detalhamento Completo da Fatura
                                </h3>
                                <div className="flex space-x-2">
                                    <InvoiceFiltersPopover
                                        onFilterChange={setFilters}
                                        activeFilterCount={activeFilterCount}
                                        transactions={transactions}
                                        showInstallmentFilter={false}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => setTransactionDialogOpen(true)}
                                        disabled={selectedCardIds.length !== 1}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <span className="mr-2">+</span>
                                        Novo Lançamento À Vista
                                    </Button>
                                </div>
                            </div>

                            {activeFilterCount > 0 && (
                                <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                                    <span className="text-sm text-muted-foreground">
                                        Mostrando <strong className="text-foreground">{filteredTransactions.length}</strong> de <strong className="text-foreground">{transactions.length}</strong> transações
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

                            <TransactionsTable
                                transactions={filteredTransactions}
                                onEdit={handleEditTransaction}
                                onDelete={handleDeleteTransaction}
                            />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};