// Página de transações recorrentes

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/financial';

interface RecurrentTransaction {
    id: string;
    description: string;
    vendor: string;
    amount: number;
    type: 'receita' | 'despesa';
    frequency: 'mensal' | 'semanal' | 'anual';
    dayOfMonth: number;
    accountName?: string;
    cardName?: string;
    categoryName: string;
    status: 'ativa' | 'pausada' | 'cancelada';
    startDate: Date;
    nextDate: Date;
    endDate?: Date;
    indexation?: number; // Percentual de reajuste anual
}

export default function RecurrencesPage() {
    const [recurrences] = useState<RecurrentTransaction[]>([
        {
            id: '1',
            description: 'Salário',
            vendor: 'Empresa XYZ',
            amount: 5500.00,
            type: 'receita',
            frequency: 'mensal',
            dayOfMonth: 5,
            accountName: 'Conta Corrente Principal',
            categoryName: 'Salário',
            status: 'ativa',
            startDate: new Date(2024, 0, 5),
            nextDate: new Date(2025, 7, 5), // 5 de agosto
            indexation: 8.5 // 8.5% ao ano
        },
        {
            id: '2',
            description: 'Aluguel',
            vendor: 'Imobiliária Santos',
            amount: 1200.00,
            type: 'despesa',
            frequency: 'mensal',
            dayOfMonth: 1,
            accountName: 'Conta Corrente Principal',
            categoryName: 'Moradia',
            status: 'ativa',
            startDate: new Date(2024, 0, 1),
            nextDate: new Date(2025, 7, 1), // 1º de agosto
            indexation: 12.0 // 12% ao ano
        },
        {
            id: '3',
            description: 'Conta de Luz',
            vendor: 'CEMIG',
            amount: 180.00,
            type: 'despesa',
            frequency: 'mensal',
            dayOfMonth: 15,
            cardName: 'Nubank Roxinho',
            categoryName: 'Moradia',
            status: 'ativa',
            startDate: new Date(2024, 2, 15),
            nextDate: new Date(2025, 7, 15), // 15 de agosto
        },
        {
            id: '4',
            description: 'Academia',
            vendor: 'Smart Fit',
            amount: 89.90,
            type: 'despesa',
            frequency: 'mensal',
            dayOfMonth: 10,
            cardName: 'Santander SX',
            categoryName: 'Saúde',
            status: 'pausada',
            startDate: new Date(2024, 1, 10),
            nextDate: new Date(2025, 8, 10), // Pausada até setembro
        },
        {
            id: '5',
            description: 'Freelance Design',
            vendor: 'Cliente ABC',
            amount: 800.00,
            type: 'receita',
            frequency: 'mensal',
            dayOfMonth: 20,
            accountName: 'Conta Corrente Principal',
            categoryName: 'Freelance',
            status: 'ativa',
            startDate: new Date(2024, 5, 20),
            nextDate: new Date(2025, 7, 20), // 20 de agosto
            endDate: new Date(2025, 11, 20) // Termina em dezembro
        }
    ]);

    const getStatusBadge = (status: RecurrentTransaction['status']) => {
        switch (status) {
            case 'ativa':
                return <Badge variant="success">Ativa</Badge>;
            case 'pausada':
                return <Badge variant="warning">Pausada</Badge>;
            case 'cancelada':
                return <Badge variant="danger">Cancelada</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getTypeBadge = (type: RecurrentTransaction['type']) => {
        return type === 'receita' ?
            <Badge variant="success">Receita</Badge> :
            <Badge variant="danger">Despesa</Badge>;
    };

    const getFrequencyLabel = (frequency: RecurrentTransaction['frequency']) => {
        switch (frequency) {
            case 'mensal': return 'Mensal';
            case 'semanal': return 'Semanal';
            case 'anual': return 'Anual';
            default: return frequency;
        }
    };

    const getTotalMonthlyIncome = () => {
        return recurrences
            .filter(r => r.type === 'receita' && r.status === 'ativa' && r.frequency === 'mensal')
            .reduce((total, r) => total + r.amount, 0);
    };

    const getTotalMonthlyExpenses = () => {
        return recurrences
            .filter(r => r.type === 'despesa' && r.status === 'ativa' && r.frequency === 'mensal')
            .reduce((total, r) => total + r.amount, 0);
    };

    const getActiveCount = () => {
        return recurrences.filter(r => r.status === 'ativa').length;
    };

    const getUpcomingRecurrences = () => {
        return recurrences
            .filter(r => r.status === 'ativa')
            .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
            .slice(0, 5);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transações Recorrentes</h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie suas receitas e despesas que se repetem regularmente
                    </p>
                </div>
                <Button>
                    <span className="mr-2">+</span>
                    Nova Recorrência
                </Button>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">⚙️</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Recorrências Ativas</h3>
                    <div className="text-2xl font-bold text-green-600">{getActiveCount()}</div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Receitas Mensais</h3>
                    <CurrencyDisplay amount={getTotalMonthlyIncome()} size="lg" variant="positive" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💸</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Despesas Mensais</h3>
                    <CurrencyDisplay amount={getTotalMonthlyExpenses()} size="lg" variant="negative" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo Líquido</h3>
                    <CurrencyDisplay
                        amount={getTotalMonthlyIncome() - getTotalMonthlyExpenses()}
                        size="lg"
                        variant="positive"
                    />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista principal */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Todas as Recorrências
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
                            {recurrences.map((recurrence) => (
                                <div
                                    key={recurrence.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {recurrence.description}
                                                </h3>
                                                {getStatusBadge(recurrence.status)}
                                                {getTypeBadge(recurrence.type)}
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <span className="text-gray-500">Fornecedor:</span>
                                                    <span className="ml-1 font-medium">{recurrence.vendor}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Frequência:</span>
                                                    <span className="ml-1 font-medium">{getFrequencyLabel(recurrence.frequency)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Dia:</span>
                                                    <span className="ml-1 font-medium">{recurrence.dayOfMonth}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Origem:</span>
                                                    <span className="ml-1 font-medium">
                                                        {recurrence.accountName || recurrence.cardName}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Categoria:</span>
                                                    <span className="ml-1 font-medium">{recurrence.categoryName}</span>
                                                </div>
                                                {recurrence.indexation && (
                                                    <div>
                                                        <span className="text-gray-500">Reajuste:</span>
                                                        <span className="ml-1 font-medium">{recurrence.indexation}% a.a.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right ml-4">
                                            <CurrencyDisplay
                                                amount={recurrence.amount}
                                                size="lg"
                                                variant={recurrence.type === 'receita' ? 'positive' : 'negative'}
                                            />
                                            {recurrence.status === 'ativa' && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Próxima: {formatDate(recurrence.nextDate)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Data de término */}
                                    {recurrence.endDate && (
                                        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                                            ⏰ Termina em {formatDate(recurrence.endDate)}
                                        </div>
                                    )}

                                    {/* Ações */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-500">
                                            Ativa desde {formatDate(recurrence.startDate)}
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
                                                Próximas
                                            </Button>
                                            {recurrence.status === 'ativa' && (
                                                <>
                                                    <Button variant="outline" size="sm">
                                                        Pausar
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        Editar
                                                    </Button>
                                                </>
                                            )}
                                            {recurrence.status === 'pausada' && (
                                                <Button variant="outline" size="sm">
                                                    Reativar
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm">
                                                ⋯
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Próximas ocorrências */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Próximas Ocorrências
                        </h3>

                        <div className="space-y-3">
                            {getUpcomingRecurrences().map((recurrence) => (
                                <div key={recurrence.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {recurrence.description}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(recurrence.nextDate)} • {recurrence.vendor}
                                        </p>
                                    </div>
                                    <CurrencyDisplay
                                        amount={recurrence.amount}
                                        size="sm"
                                        variant={recurrence.type === 'receita' ? 'positive' : 'negative'}
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
                                <span className="text-gray-600">Receitas anuais:</span>
                                <CurrencyDisplay
                                    amount={getTotalMonthlyIncome() * 12}
                                    variant="positive"
                                />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Despesas anuais:</span>
                                <CurrencyDisplay
                                    amount={getTotalMonthlyExpenses() * 12}
                                    variant="negative"
                                />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Economia anual:</span>
                                <CurrencyDisplay
                                    amount={(getTotalMonthlyIncome() - getTotalMonthlyExpenses()) * 12}
                                    variant="positive"
                                />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Pausadas:</span>
                                <span className="text-orange-600 font-medium">
                                    {recurrences.filter(r => r.status === 'pausada').length}
                                </span>
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
                                📊 Projeção Anual
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                📈 Simular Reajuste
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                🔔 Configurar Alertas
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
