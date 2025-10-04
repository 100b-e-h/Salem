'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/financial';

interface Subscription {
    id: string;
    name: string;
    vendor: string;
    currentValue: number;
    chargeDay: number;
    cardName: string;
    categoryName: string;
    status: 'ativa' | 'pausada' | 'cancelada';
    startDate: Date;
    nextChargeDate: Date;
    priceHistory: Array<{
        date: Date;
        amount: number;
        reason?: string;
    }>;
}

export default function SubscriptionsPage() {
    const [subscriptions] = useState<Subscription[]>([]);

    const getStatusBadge = (status: Subscription['status']) => {
        switch (status) {
            case 'ativa':
                return <Badge variant="default">Ativa</Badge>;
            case 'pausada':
                return <Badge variant="secondary">Pausada</Badge>;
            case 'cancelada':
                return <Badge variant="destructive">Cancelada</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getUpcomingCharges = () => {
        return subscriptions
            .filter(sub => sub.status === 'ativa')
            .sort((a, b) => a.nextChargeDate.getTime() - b.nextChargeDate.getTime())
            .slice(0, 5);
    };

    const getTotalMonthly = () => {
        return subscriptions
            .filter(sub => sub.status === 'ativa')
            .reduce((total, sub) => total + sub.currentValue, 0);
    };

    const getActiveCount = () => {
        return subscriptions.filter(sub => sub.status === 'ativa').length;
    };

    const getPriceChange = (subscription: Subscription) => {
        if (subscription.priceHistory.length < 2) return null;

        const latest = subscription.priceHistory[subscription.priceHistory.length - 1];
        const previous = subscription.priceHistory[subscription.priceHistory.length - 2];

        return {
            difference: latest.amount - previous.amount,
            percentage: ((latest.amount - previous.amount) / previous.amount) * 100,
            reason: latest.reason
        };
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie suas assinaturas e cobranças recorrentes
                    </p>
                </div>
                <Button>
                    <span className="mr-2">+</span>
                    Nova Assinatura
                </Button>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">♻️</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Assinaturas Ativas</h3>
                    <div className="text-2xl font-bold text-green-600">{getActiveCount()}</div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Gasto Mensal</h3>
                    <CurrencyDisplay amount={getTotalMonthly()} size="lg" variant="negative" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">⏸️</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Pausadas</h3>
                    <div className="text-2xl font-bold text-yellow-600">
                        {subscriptions.filter(sub => sub.status === 'pausada').length}
                    </div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">❌</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Canceladas</h3>
                    <div className="text-2xl font-bold text-red-600">
                        {subscriptions.filter(sub => sub.status === 'cancelada').length}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista principal de assinaturas */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Todas as Assinaturas
                            </h2>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                    Filtros
                                </Button>
                                <Button variant="outline" size="sm">
                                    Exportar
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {subscriptions.map((subscription) => {
                                const priceChange = getPriceChange(subscription);

                                return (
                                    <div
                                        key={subscription.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {subscription.name}
                                                    </h3>
                                                    {getStatusBadge(subscription.status)}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                    <div>
                                                        <span className="text-gray-500">Fornecedor:</span>
                                                        <span className="ml-1 font-medium">{subscription.vendor}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Cartão:</span>
                                                        <span className="ml-1 font-medium">{subscription.cardName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Dia da cobrança:</span>
                                                        <span className="ml-1 font-medium">{subscription.chargeDay}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Categoria:</span>
                                                        <span className="ml-1 font-medium">{subscription.categoryName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right ml-4">
                                                <CurrencyDisplay
                                                    amount={subscription.currentValue}
                                                    size="lg"
                                                    variant={subscription.status === 'ativa' ? 'negative' : 'neutral'}
                                                />
                                                {subscription.status === 'ativa' && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        Próxima: {formatDate(subscription.nextChargeDate)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Alerta de mudança de preço */}
                                        {priceChange && priceChange.difference !== 0 && (
                                            <div className={`
                        mb-3 p-2 rounded-lg text-sm
                        ${priceChange.difference > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}
                      `}>
                                                <span className="font-medium">
                                                    {priceChange.difference > 0 ? '📈 Aumento' : '📉 Redução'} de{' '}
                                                    <CurrencyDisplay
                                                        amount={Math.abs(priceChange.difference)}
                                                        showSign
                                                    /> ({priceChange.percentage.toFixed(1)}%)
                                                </span>
                                                {priceChange.reason && (
                                                    <span className="ml-2">• {priceChange.reason}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Ações */}
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                Ativa desde {formatDate(subscription.startDate)}
                                            </div>

                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                    Timeline
                                                </Button>
                                                {subscription.status === 'ativa' && (
                                                    <>
                                                        <Button variant="outline" size="sm">
                                                            Pausar
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600">
                                                            Cancelar
                                                        </Button>
                                                    </>
                                                )}
                                                {subscription.status === 'pausada' && (
                                                    <Button variant="outline" size="sm">
                                                        Reativar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Próximas cobranças */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Próximas Cobranças
                        </h3>

                        <div className="space-y-3">
                            {getUpcomingCharges().map((subscription) => (
                                <div key={subscription.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {subscription.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(subscription.nextChargeDate)}
                                        </p>
                                    </div>
                                    <CurrencyDisplay
                                        amount={subscription.currentValue}
                                        size="sm"
                                        variant="negative"
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Estatísticas */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Estatísticas
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Gasto anual estimado:</span>
                                <CurrencyDisplay
                                    amount={getTotalMonthly() * 12}
                                    variant="negative"
                                />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Média por assinatura:</span>
                                <CurrencyDisplay
                                    amount={getActiveCount() > 0 ? getTotalMonthly() / getActiveCount() : 0}
                                    variant="neutral"
                                />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Mais cara:</span>
                                <CurrencyDisplay
                                    amount={Math.max(...subscriptions.filter(s => s.status === 'ativa').map(s => s.currentValue))}
                                    variant="negative"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Ações rápidas */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Ações Rápidas
                        </h3>

                        <div className="space-y-2">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                📊 Relatório Mensal
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                🔔 Configurar Alertas
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                📈 Análise de Gastos
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                💾 Exportar Dados
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
