// Página de relatórios financeiros

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/financial';

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('current-month');

    // Dados simulados para demonstração
    const reportData = {
        income: 5500.00,
        expenses: 3250.75,
        savings: 2249.25,
        investments: 850.00,
        creditUsed: 1500.00,
        creditLimit: 8000.00
    };

    const categoryExpenses = [
        { name: 'Alimentação', amount: 680.50, percentage: 20.9, icon: '🍽️' },
        { name: 'Transporte', amount: 450.00, percentage: 13.8, icon: '🚗' },
        { name: 'Moradia', amount: 1200.00, percentage: 36.9, icon: '🏠' },
        { name: 'Lazer', amount: 320.25, percentage: 9.8, icon: '🎬' },
        { name: 'Saúde', amount: 280.00, percentage: 8.6, icon: '🏥' },
        { name: 'Outros', amount: 320.00, percentage: 9.8, icon: '📦' }
    ];

    const monthlyTrend = [
        { month: 'Mai', income: 5200, expenses: 3100, savings: 2100 },
        { month: 'Jun', income: 5400, expenses: 3050, savings: 2350 },
        { month: 'Jul', income: 5300, expenses: 3200, savings: 2100 },
        { month: 'Ago', income: 5500, expenses: 3250, savings: 2250 }
    ];

    const upcomingCommitments = [
        { date: new Date(2025, 7, 5), description: 'Netflix', amount: 55.90, type: 'assinatura' },
        { date: new Date(2025, 7, 10), description: 'Parcela Notebook', amount: 250.00, type: 'parcela' },
        { date: new Date(2025, 7, 15), description: 'Fatura Nubank', amount: 850.00, type: 'fatura' },
        { date: new Date(2025, 7, 20), description: 'Spotify', amount: 21.90, type: 'assinatura' }
    ];

    const getPeriodOptions = () => [
        { value: 'current-month', label: 'Mês Atual' },
        { value: 'last-month', label: 'Mês Anterior' },
        { value: 'last-3-months', label: 'Últimos 3 Meses' },
        { value: 'current-year', label: 'Ano Atual' },
        { value: 'custom', label: 'Período Personalizado' }
    ];

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'assinatura': return '♻️';
            case 'parcela': return '#️⃣';
            case 'fatura': return '💳';
            default: return '📝';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                    <p className="text-gray-600 mt-2">
                        Análise detalhada das suas finanças e tendências
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {getPeriodOptions().map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <Button>
                        📊 Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Receitas</h3>
                    <CurrencyDisplay amount={reportData.income} size="lg" variant="positive" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💸</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Despesas</h3>
                    <CurrencyDisplay amount={reportData.expenses} size="lg" variant="negative" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Economia</h3>
                    <CurrencyDisplay
                        amount={reportData.income - reportData.expenses}
                        size="lg"
                        variant="positive"
                    />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Crédito Usado</h3>
                    <div className="space-y-1">
                        <CurrencyDisplay amount={reportData.creditUsed} size="lg" variant="negative" />
                        <div className="text-xs text-gray-500">
                            {((reportData.creditUsed / reportData.creditLimit) * 100).toFixed(0)}% do limite
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gastos por Categoria */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Gastos por Categoria
                        </h2>
                        <Button variant="outline" size="sm">
                            Ver Detalhes
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {categoryExpenses.map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                    <span className="text-lg">{category.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {category.name}
                                            </span>
                                            <CurrencyDisplay amount={category.amount} size="sm" variant="negative" />
                                        </div>
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${category.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 min-w-12 text-right">
                                        {category.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Total:</span>
                            <CurrencyDisplay amount={reportData.expenses} variant="negative" />
                        </div>
                    </div>
                </Card>

                {/* Tendência Mensal */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Tendência dos Últimos Meses
                        </h2>
                        <Button variant="outline" size="sm">
                            Gráfico
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {monthlyTrend.map((month, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-900">{month.month}/2025</h3>
                                    <Badge variant={month.savings > 2000 ? 'success' : 'warning'}>
                                        {month.savings > 2000 ? 'Positivo' : 'Atenção'}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500 block">Receitas</span>
                                        <CurrencyDisplay amount={month.income} size="sm" variant="positive" />
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Despesas</span>
                                        <CurrencyDisplay amount={month.expenses} size="sm" variant="negative" />
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Economia</span>
                                        <CurrencyDisplay amount={month.savings} size="sm" variant="neutral" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Próximos Compromissos */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Próximos Compromissos
                        </h2>
                        <Button variant="outline" size="sm">
                            Ver Calendário
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {upcomingCommitments.map((commitment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{getTypeIcon(commitment.type)}</span>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {commitment.description}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(commitment.date)}
                                        </p>
                                    </div>
                                </div>
                                <CurrencyDisplay amount={commitment.amount} size="sm" variant="negative" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Total próximos 30 dias:</span>
                            <CurrencyDisplay
                                amount={upcomingCommitments.reduce((sum, c) => sum + c.amount, 0)}
                                variant="negative"
                            />
                        </div>
                    </div>
                </Card>

                {/* Metas e Objetivos */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Metas do Mês
                        </h2>
                        <Button variant="outline" size="sm">
                            Configurar
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Meta de Economia</span>
                                <span className="font-medium">
                                    <CurrencyDisplay amount={2249.25} size="sm" /> / <CurrencyDisplay amount={2500.00} size="sm" />
                                </span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: '90%' }}
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">90% da meta alcançada</div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Limite de Gastos</span>
                                <span className="font-medium">
                                    <CurrencyDisplay amount={3250.75} size="sm" /> / <CurrencyDisplay amount={3500.00} size="sm" />
                                </span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: '93%' }}
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">93% do limite usado</div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Investimentos</span>
                                <span className="font-medium">
                                    <CurrencyDisplay amount={850.00} size="sm" /> / <CurrencyDisplay amount={1000.00} size="sm" />
                                </span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: '85%' }}
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">85% da meta de investimento</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Insights e Recomendações */}
            <Card className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    💡 Insights e Recomendações
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-green-600">✅</span>
                            <h3 className="font-medium text-green-900">Parabéns!</h3>
                        </div>
                        <p className="text-sm text-green-800">
                            Você está 10% acima da sua meta de economia este mês.
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-yellow-600">⚠️</span>
                            <h3 className="font-medium text-yellow-900">Atenção</h3>
                        </div>
                        <p className="text-sm text-yellow-800">
                            Gastos com alimentação aumentaram 15% comparado ao mês anterior.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-blue-600">💡</span>
                            <h3 className="font-medium text-blue-900">Dica</h3>
                        </div>
                        <p className="text-sm text-blue-800">
                            Considere antecipar algumas parcelas para reduzir juros futuros.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
