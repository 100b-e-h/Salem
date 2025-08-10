// Página de gerenciamento de cartões

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { mockDb } from '@/lib/database';
import { Card as CardType, Invoice } from '@/types';

export default function CardsPage() {
    const [cards, setCards] = useState<CardType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cardsData, invoicesData] = await Promise.all([
                mockDb.getAllCards(),
                mockDb.getAllCards().then(cards =>
                    Promise.all(cards.map(card => mockDb.getInvoicesByCard(card.id)))
                ).then(results => results.flat())
            ]);

            setCards(cardsData);
            setInvoices(invoicesData);
        } catch (error) {
            console.error('Erro ao carregar dados dos cartões:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCardInvoice = (cardId: string, type: 'current' | 'next' = 'current') => {
        const currentDate = new Date();
        let targetMonth = currentDate.getMonth() + 1;
        let targetYear = currentDate.getFullYear();

        if (type === 'next') {
            targetMonth += 1;
            if (targetMonth > 12) {
                targetMonth = 1;
                targetYear += 1;
            }
        }

        const yearMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        return invoices.find(invoice => invoice.cardId === cardId && invoice.yearMonth === yearMonth);
    };

    const calculateLimitUsage = (card: CardType) => {
        const currentInvoice = getCardInvoice(card.id);
        const usedAmount = currentInvoice?.totalForecast || 0;
        const percentage = (usedAmount / card.totalLimit) * 100;

        return {
            used: usedAmount,
            available: card.totalLimit - usedAmount,
            percentage: Math.min(percentage, 100)
        };
    };

    const getTotalLimit = () => {
        return cards.reduce((total, card) => total + card.totalLimit, 0);
    };

    const getTotalUsed = () => {
        return cards.reduce((total, card) => {
            const usage = calculateLimitUsage(card);
            return total + usage.used;
        }, 0);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                    <div className="grid gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-200 h-40 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cartões</h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie seus cartões de crédito e faturas
                    </p>
                </div>
                <Button>
                    <span className="mr-2">+</span>
                    Novo Cartão
                </Button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Cartões</h3>
                    <div className="text-2xl font-bold text-gray-900">{cards.length}</div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Limite Total</h3>
                    <CurrencyDisplay amount={getTotalLimit()} size="lg" variant="neutral" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Usado</h3>
                    <CurrencyDisplay amount={getTotalUsed()} size="lg" variant="negative" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Disponível</h3>
                    <CurrencyDisplay
                        amount={getTotalLimit() - getTotalUsed()}
                        size="lg"
                        variant="positive"
                    />
                </Card>
            </div>

            {/* Lista de Cartões */}
            {cards.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">💳</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum cartão cadastrado
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Adicione seus cartões de crédito para controlar gastos e faturas.
                        </p>
                        <Button>
                            <span className="mr-2">+</span>
                            Adicionar Primeiro Cartão
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cards.map((card) => {
                        const usage = calculateLimitUsage(card);
                        const currentInvoice = getCardInvoice(card.id);
                        const nextInvoice = getCardInvoice(card.id, 'next');

                        return (
                            <Card key={card.id} className="relative">
                                {/* Header do Cartão */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">💳</div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{card.alias}</h3>
                                            <p className="text-sm text-gray-500">{card.brand}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={usage.percentage > 80 ? 'danger' :
                                            usage.percentage > 60 ? 'warning' : 'success'}
                                        size="sm"
                                    >
                                        {usage.percentage.toFixed(0)}%
                                    </Badge>
                                </div>

                                {/* Limite */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Limite:</span>
                                        <CurrencyDisplay amount={card.totalLimit} size="sm" />
                                    </div>

                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Usado:</span>
                                        <CurrencyDisplay amount={usage.used} size="sm" variant="negative" />
                                    </div>

                                    <div className="flex justify-between text-sm mb-3">
                                        <span className="text-gray-500">Disponível:</span>
                                        <CurrencyDisplay amount={usage.available} size="sm" variant="positive" />
                                    </div>

                                    {/* Barra de progresso */}
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${usage.percentage > 80 ? 'bg-red-500' :
                                                    usage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${usage.percentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Faturas */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Fatura Atual:</span>
                                        <div className="text-right">
                                            <CurrencyDisplay
                                                amount={currentInvoice?.totalForecast || 0}
                                                size="sm"
                                                variant="negative"
                                            />
                                            <div className="text-xs text-gray-400">
                                                Venc: {card.dueDay}/{String(new Date().getMonth() + 1).padStart(2, '0')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Próxima Fatura:</span>
                                        <div className="text-right">
                                            <CurrencyDisplay
                                                amount={nextInvoice?.totalForecast || 0}
                                                size="sm"
                                                variant="neutral"
                                            />
                                            <div className="text-xs text-gray-400">
                                                Venc: {card.dueDay}/{String(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2).padStart(2, '0')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Datas importantes */}
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Fechamento:</span>
                                        <span>Dia {card.closingDay}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>Vencimento:</span>
                                        <span>Dia {card.dueDay}</span>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        Ver Fatura
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        ⋯
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
