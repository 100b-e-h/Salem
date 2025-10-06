'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { Card as CardType, Invoice } from '@/types';
import { formatDate } from '@/utils/financial';
import { format } from 'date-fns';
import { NewTransactionDialog } from './components/NewTransactionDialog';
import { EditTransactionDialog } from './components/EditTransactionDialog';
import { TransactionsTable } from './components/TransactionsTable';
import type { Transaction } from '@/types';

export default function InvoicesPage() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CardType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (!user || !selectedCard || !selectedMonth) return;
        const [year, month] = selectedMonth.split('-');
        const res = await fetch(`/api/cards/${selectedCard}/transactions`);
        if (res.ok) {
            const all: Transaction[] = await res.json();
            setTransactions(
                all.filter((t) => {
                    const ts = typeof t.date === 'string' ? Date.parse(t.date) : (t.date ? new Date(t.date).getTime() : NaN);
                    const d = new Date(ts);
                    return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
                })
            );
        } else {
            setTransactions([]);
        }
    }, [user, selectedCard, selectedMonth]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions, transactionDialogOpen]);

    const handleEditTransaction = (tx: Transaction) => {
        setEditingTransaction(tx);
        setEditDialogOpen(true);
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
        } catch (error) {
            console.error('Erro ao carregar dados das faturas:', error);
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
        if (cards.length > 0 && !selectedCard) {
            setSelectedCard(cards[0].id);
        }
    }, [cards, selectedCard]);

    useEffect(() => {
        if (!selectedMonth) {
            const currentMonth = format(new Date(), 'yyyy-MM');
            setSelectedMonth(currentMonth);
        }
    }, [selectedMonth]);

    const getSelectedCard = () => {
        return cards.find(card => card.id === selectedCard);
    };

    const getInvoiceForMonth = (cardId: string, yearMonth: string) => {
        const [year, month] = yearMonth.split('-').map(Number);
        return invoices.find(invoice =>
            invoice.cardId === cardId &&
            invoice.year === year &&
            invoice.month === month
        );
    };

    const getMonthOptions = useMemo(() => {
        const options = new Map<string, { value: string; label: string; isCurrent: boolean }>();
        const currentDate = new Date();
        const currentYearMonth = format(currentDate, 'yyyy-MM');

        options.set(currentYearMonth, {
            value: currentYearMonth,
            label: `${format(currentDate, 'MMM/yyyy')} (Atual)`,
            isCurrent: true
        });

        invoices.forEach(invoice => {
            const yearMonth = `${invoice.year}-${String(invoice.month).padStart(2, '0')}`;
            if (!options.has(yearMonth)) {
                const date = new Date(invoice.year, invoice.month - 1);
                options.set(yearMonth, {
                    value: yearMonth,
                    label: format(date, 'MMM/yyyy'),
                    isCurrent: false
                });
            }
        });

        return Array.from(options.values()).sort((a, b) => b.value.localeCompare(a.value));
    }, [invoices]);

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

    const calculateDueDate = (card: CardType, yearMonth: string) => {
        const [year, month] = yearMonth.split('-').map(Number);
        const dueDate = new Date(year, month - 1, card.dueDay);
        return dueDate;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                    <div className="bg-gray-200 h-96 rounded-lg"></div>
                </div>
            </div>
        );
    }

    const selectedCardData = getSelectedCard();
    const currentInvoice = selectedCard && selectedMonth ?
        getInvoiceForMonth(selectedCard, selectedMonth) : null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">💳 Faturas</h1>
                    <p className="text-muted-foreground mt-2">
                        Visualize e gerencie as faturas dos seus cartões
                    </p>
                </div>
                <Button
                    onClick={() => setTransactionDialogOpen(true)}
                    disabled={!selectedCardData}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                    <span className="mr-2">+</span>
                    Novo Lançamento
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

                    {selectedCardData && (
                        <Card className="bg-card border-border shadow-md">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">💳</div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-foreground">
                                                {selectedCardData.alias}
                                            </h2>
                                            <p className="text-muted-foreground">
                                                {selectedCardData.brand} • Fatura {selectedMonth}
                                            </p>
                                        </div>
                                    </div>
                                    {currentInvoice && getStatusBadge(currentInvoice.status)}
                                </div>

                                {currentInvoice ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-2xl mb-2">📊</div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1">
                                                Total Previsto
                                            </h3>
                                            <CurrencyDisplay
                                                amount={currentInvoice.totalAmount}
                                                size="lg"
                                                variant="negative"
                                            />
                                        </div>

                                        <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-2xl mb-2">🔒</div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1">
                                                Total Fechado
                                            </h3>
                                            <CurrencyDisplay
                                                amount={currentInvoice.totalAmount}
                                                size="lg"
                                                variant="neutral"
                                            />
                                        </div>

                                        <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-2xl mb-2">✅</div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1">
                                                Total Pago
                                            </h3>
                                            <CurrencyDisplay
                                                amount={currentInvoice.paidAmount}
                                                size="lg"
                                                variant="positive"
                                            />
                                        </div>

                                        <div className="text-center p-4 bg-muted/30 rounded-lg border border-border">
                                            <div className="text-2xl mb-2">📅</div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1">
                                                Vencimento
                                            </h3>
                                            <div className="text-base font-semibold text-foreground">
                                                {formatDate(calculateDueDate(selectedCardData, selectedMonth))}
                                            </div>
                                        </div>
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
                                        <Button
                                            onClick={() => setTransactionDialogOpen(true)}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            <span className="mr-2">+</span>
                                            Criar Lançamento
                                        </Button>
                                    </div>
                                )}

                                <div className="border-t border-border pt-6 mt-6">
                                    <h3 className="text-lg font-medium text-foreground mb-4">
                                        ℹ️ Informações do Cartão
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Limite Total:</span>
                                            <div className="font-medium">
                                                <CurrencyDisplay amount={Math.round(selectedCardData.totalLimit / 100)} />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Dia de Fechamento:</span>
                                            <div className="font-medium text-foreground">{selectedCardData.closingDay}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Dia de Vencimento:</span>
                                            <div className="font-medium text-foreground">{selectedCardData.dueDay}</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Limite Disponível:</span>
                                            <div className="font-medium">
                                                {(() => {
                                                    const normalizedLimit = Math.round(selectedCardData.totalLimit / 100);
                                                    const usedFromTransactions = transactions && transactions.length > 0
                                                        ? transactions.reduce((s, tx) => s + (tx.amount || 0), 0)
                                                        : (currentInvoice?.totalAmount || 0);
                                                    const available = normalizedLimit - usedFromTransactions;
                                                    return (
                                                        <CurrencyDisplay
                                                            amount={available}
                                                            variant="positive"
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card className="bg-card border-border shadow-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-foreground">
                                    📋 Lançamentos da Fatura
                                </h3>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-border text-foreground hover:bg-muted"
                                    >
                                        🔍 Filtrar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setTransactionDialogOpen(true)}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <span className="mr-2">+</span>
                                        Novo Lançamento
                                    </Button>
                                </div>
                            </div>

                            <TransactionsTable
                                transactions={transactions}
                                onEdit={handleEditTransaction}
                            />
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
