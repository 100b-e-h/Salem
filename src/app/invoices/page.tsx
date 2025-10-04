'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { Card as CardType, Invoice } from '@/types';
import { formatDate } from '@/utils/financial';
import { addMonths, format } from 'date-fns';

export default function InvoicesPage() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CardType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [loading, setLoading] = useState(true);

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

    const getMonthOptions = () => {
        const options = [];
        const currentDate = new Date();

        // 3 meses anteriores
        for (let i = 3; i >= 1; i--) {
            const date = addMonths(currentDate, -i);
            options.push({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'MMM/yyyy')
            });
        }

        // Mês atual
        options.push({
            value: format(currentDate, 'yyyy-MM'),
            label: `${format(currentDate, 'MMM/yyyy')} (Atual)`
        });

        // 3 meses futuros
        for (let i = 1; i <= 3; i++) {
            const date = addMonths(currentDate, i);
            options.push({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'MMM/yyyy')
            });
        }

        return options;
    };

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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Faturas</h1>
                    <p className="text-gray-600 mt-2">
                        Visualize e gerencie as faturas dos seus cartões
                    </p>
                </div>
                <Button>
                    <span className="mr-2">📄</span>
                    Gerar Relatório
                </Button>
            </div>

            {cards.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">💳</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum cartão cadastrado
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Você precisa cadastrar pelo menos um cartão para visualizar faturas.
                        </p>
                        <Button>
                            <span className="mr-2">+</span>
                            Cadastrar Cartão
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Seletores */}
                    <Card>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-64">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cartão
                                </label>
                                <select
                                    value={selectedCard}
                                    onChange={(e) => setSelectedCard(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {cards.map((card) => (
                                        <option key={card.id} value={card.id}>
                                            {card.alias} - {card.brand}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 min-w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Competência
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {getMonthOptions().map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Detalhes da Fatura */}
                    {selectedCardData && (
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl">💳</div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {selectedCardData.alias}
                                        </h2>
                                        <p className="text-gray-500">
                                            {selectedCardData.brand} • Fatura {selectedMonth}
                                        </p>
                                    </div>
                                </div>
                                {currentInvoice && getStatusBadge(currentInvoice.status)}
                            </div>

                            {currentInvoice ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📊</div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                                            Total Previsto
                                        </h3>
                                        <CurrencyDisplay
                                            amount={currentInvoice.totalAmount}
                                            size="lg"
                                            variant="negative"
                                        />
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🔒</div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                                            Total Fechado
                                        </h3>
                                        <CurrencyDisplay
                                            amount={currentInvoice.totalAmount}
                                            size="lg"
                                            variant="neutral"
                                        />
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl mb-2">✅</div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                                            Total Pago
                                        </h3>
                                        <CurrencyDisplay
                                            amount={currentInvoice.paidAmount}
                                            size="lg"
                                            variant="positive"
                                        />
                                    </div>

                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📅</div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                                            Vencimento
                                        </h3>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {formatDate(calculateDueDate(selectedCardData, selectedMonth))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-4">📄</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Fatura não encontrada
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Não há dados para esta competência ainda.
                                    </p>
                                    <Button variant="outline">
                                        Criar Fatura
                                    </Button>
                                </div>
                            )}

                            {/* Informações do Cartão */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Informações do Cartão
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Limite Total:</span>
                                        <div className="font-medium">
                                            <CurrencyDisplay amount={selectedCardData.totalLimit} />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Dia de Fechamento:</span>
                                        <div className="font-medium">{selectedCardData.closingDay}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Dia de Vencimento:</span>
                                        <div className="font-medium">{selectedCardData.dueDay}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Limite Disponível:</span>
                                        <div className="font-medium">
                                            <CurrencyDisplay
                                                amount={selectedCardData.totalLimit - (currentInvoice?.totalAmount || 0)}
                                                variant="positive"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Lançamentos da Fatura */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Lançamentos da Fatura
                            </h3>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                    Filtrar
                                </Button>
                                <Button size="sm">
                                    <span className="mr-2">+</span>
                                    Novo Lançamento
                                </Button>
                            </div>
                        </div>

                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-4">📝</div>
                            <p>Nenhum lançamento encontrado para esta fatura.</p>
                            <p className="text-sm mt-2">
                                Os lançamentos aparecerão aqui conforme forem sendo registrados.
                            </p>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
