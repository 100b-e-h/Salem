// Dashboard principal do Salem

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { mockDb } from '@/lib/database';
import { Account, Card as CardType, Invoice } from '@/types';
import { formatDate } from '@/utils/financial';
import { addDays } from 'date-fns';

export function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [accountsData, cardsData, invoicesData] = await Promise.all([
                mockDb.getAllAccounts(),
                mockDb.getAllCards(),
                mockDb.getAllCards().then(cards =>
                    Promise.all(cards.map(card => mockDb.getInvoicesByCard(card.id)))
                ).then(results => results.flat())
            ]);

            setAccounts(accountsData);
            setCards(cardsData);
            setInvoices(invoicesData);
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalBalance = () => {
        return accounts.reduce((total, account) => total + account.balance, 0);
    };

    const calculateCurrentInvoiceTotal = () => {
        const currentDate = new Date();
        const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        return invoices
            .filter(invoice => invoice.yearMonth === currentYearMonth && invoice.status === 'prevista')
            .reduce((total, invoice) => total + invoice.totalForecast, 0);
    };

    const calculateNextInvoiceTotal = () => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextYearMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

        return invoices
            .filter(invoice => invoice.yearMonth === nextYearMonth)
            .reduce((total, invoice) => total + invoice.totalForecast, 0);
    };

    const getUpcomingCommitments = () => {
        // Simulação de compromissos futuros - em uma implementação real, isso viria dos dados
        const today = new Date();
        return [
            {
                date: addDays(today, 2),
                type: 'assinatura' as const,
                description: 'Netflix',
                amount: 39.90,
                vendor: 'Netflix'
            },
            {
                date: addDays(today, 5),
                type: 'recorrente' as const,
                description: 'Aluguel',
                amount: 1200.00,
                vendor: 'Imobiliária'
            },
            {
                date: addDays(today, 7),
                type: 'parcela' as const,
                description: 'Notebook Dell - 3/12',
                amount: 250.00,
                vendor: 'Dell'
            }
        ];
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const totalBalance = calculateTotalBalance();
    const currentInvoiceTotal = calculateCurrentInvoiceTotal();
    const nextInvoiceTotal = calculateNextInvoiceTotal();
    const upcomingCommitments = getUpcomingCommitments();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Visão geral das suas finanças em {formatDate(new Date(), 'dd/MM/yyyy')}
                </p>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo Total</h3>
                    <CurrencyDisplay amount={totalBalance} size="lg" variant="positive" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Fatura Atual</h3>
                    <CurrencyDisplay amount={currentInvoiceTotal} size="lg" variant="negative" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📅</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Próxima Fatura</h3>
                    <CurrencyDisplay amount={nextInvoiceTotal} size="lg" variant="neutral" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Rendimento Mensal</h3>
                    <CurrencyDisplay amount={150.32} size="lg" variant="positive" showSign />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contas */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Contas</h2>
                        <Button size="sm" variant="outline">
                            Ver todas
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {accounts.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhuma conta cadastrada</p>
                        ) : (
                            accounts.map((account) => (
                                <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-lg">
                                            {account.type === 'corrente' ? '🏦' :
                                                account.type === 'poupanca' ? '🐷' :
                                                    account.type === 'carteira' ? '👛' : '📊'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{account.name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                                        </div>
                                    </div>
                                    <CurrencyDisplay
                                        amount={account.balance}
                                        variant={account.balance >= 0 ? 'positive' : 'negative'}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Cartões */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Cartões</h2>
                        <Button size="sm" variant="outline">
                            Ver faturas
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {cards.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhum cartão cadastrado</p>
                        ) : (
                            cards.map((card) => {
                                const currentInvoice = invoices.find(inv => inv.cardId === card.id);
                                const usedLimit = currentInvoice?.totalForecast || 0;
                                const availableLimit = card.totalLimit - usedLimit;
                                const limitPercentage = (usedLimit / card.totalLimit) * 100;

                                return (
                                    <div key={card.id} className="p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="text-lg">💳</div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{card.alias}</p>
                                                    <p className="text-sm text-gray-500">{card.brand}</p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={limitPercentage > 80 ? 'danger' : limitPercentage > 60 ? 'warning' : 'success'}
                                                size="sm"
                                            >
                                                {limitPercentage.toFixed(0)}%
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Disponível:</span>
                                            <CurrencyDisplay amount={availableLimit} size="sm" />
                                        </div>

                                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${limitPercentage > 80 ? 'bg-red-500' :
                                                        limitPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(limitPercentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Próximos Compromissos */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Próximos 7 dias</h2>
                        <Button size="sm" variant="outline">
                            Ver calendário
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {upcomingCommitments.map((commitment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="text-lg">
                                        {commitment.type === 'assinatura' ? '♻️' :
                                            commitment.type === 'recorrente' ? '⚙️' : '#️⃣'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{commitment.description}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(commitment.date)} • {commitment.vendor}
                                        </p>
                                    </div>
                                </div>
                                <CurrencyDisplay amount={commitment.amount} variant="negative" />
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Ações Rápidas */}
                <Card>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" size="sm" className="justify-start">
                            <span className="mr-2">💸</span>
                            Nova Despesa
                        </Button>

                        <Button variant="outline" size="sm" className="justify-start">
                            <span className="mr-2">💰</span>
                            Nova Receita
                        </Button>

                        <Button variant="outline" size="sm" className="justify-start">
                            <span className="mr-2">#️⃣</span>
                            Parcelada
                        </Button>

                        <Button variant="outline" size="sm" className="justify-start">
                            <span className="mr-2">♻️</span>
                            Assinatura
                        </Button>

                        <Button variant="outline" size="sm" className="justify-start">
                            <span className="mr-2">🏦</span>
                            Nova Conta
                        </Button>

                        <Button variant="outline" size="sm" className="justify-start">
                            <span className="mr-2">💳</span>
                            Novo Cartão
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
