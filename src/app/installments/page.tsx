// Página de gerenciamento de compras parceladas

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/financial';
import { addMonths } from 'date-fns';

interface InstallmentPlan {
    id: string;
    description: string;
    vendor: string;
    totalAmount: number;
    installmentCount: number;
    installmentValue: number;
    purchaseDate: Date;
    firstDueDate: Date;
    cardName: string;
    categoryName: string;
    monthlyInterest: number;
    currentInstallment: number;
    status: 'ativa' | 'quitada' | 'antecipada';
}

export default function InstallmentsPage() {
    const [installments] = useState<InstallmentPlan[]>([
        {
            id: '1',
            description: 'Notebook Dell Inspiron 15',
            vendor: 'Dell Store',
            totalAmount: 3000.00,
            installmentCount: 12,
            installmentValue: 250.00,
            purchaseDate: new Date(2025, 5, 15), // 15 de junho
            firstDueDate: new Date(2025, 6, 7), // 7 de julho
            cardName: 'Nubank Roxinho',
            categoryName: 'Eletrônicos',
            monthlyInterest: 0,
            currentInstallment: 3,
            status: 'ativa'
        },
        {
            id: '2',
            description: 'Geladeira Brastemp Frost Free',
            vendor: 'Magazine Luiza',
            totalAmount: 2400.00,
            installmentCount: 10,
            installmentValue: 240.00,
            purchaseDate: new Date(2025, 4, 20), // 20 de maio
            firstDueDate: new Date(2025, 5, 7), // 7 de junho
            cardName: 'Santander SX',
            categoryName: 'Casa',
            monthlyInterest: 1.5,
            currentInstallment: 4,
            status: 'ativa'
        },
        {
            id: '3',
            description: 'Curso de React Avançado',
            vendor: 'Udemy',
            totalAmount: 599.90,
            installmentCount: 6,
            installmentValue: 99.98,
            purchaseDate: new Date(2025, 2, 10), // 10 de março
            firstDueDate: new Date(2025, 2, 7), // 7 de março
            cardName: 'Nubank Roxinho',
            categoryName: 'Educação',
            monthlyInterest: 0,
            currentInstallment: 6,
            status: 'quitada'
        }
    ]);

    const getStatusBadge = (status: InstallmentPlan['status']) => {
        switch (status) {
            case 'ativa':
                return <Badge variant="info">Ativa</Badge>;
            case 'quitada':
                return <Badge variant="success">Quitada</Badge>;
            case 'antecipada':
                return <Badge variant="warning">Antecipada</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const calculateProgress = (installment: InstallmentPlan) => {
        return (installment.currentInstallment / installment.installmentCount) * 100;
    };

    const calculateRemainingAmount = (installment: InstallmentPlan) => {
        const remaining = installment.installmentCount - installment.currentInstallment;
        return remaining * installment.installmentValue;
    };

    const getNextDueDate = (installment: InstallmentPlan) => {
        if (installment.status === 'quitada') return null;
        return addMonths(installment.firstDueDate, installment.currentInstallment);
    };

    const getTotalActive = () => {
        return installments
            .filter(inst => inst.status === 'ativa')
            .reduce((total, inst) => total + calculateRemainingAmount(inst), 0);
    };

    const getActiveCount = () => {
        return installments.filter(inst => inst.status === 'ativa').length;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Compras Parceladas</h1>
                    <p className="text-gray-600 mt-2">
                        Acompanhe o progresso das suas compras parceladas
                    </p>
                </div>
                <Button>
                    <span className="mr-2">+</span>
                    Nova Compra Parcelada
                </Button>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">#️⃣</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Parceladas Ativas</h3>
                    <div className="text-2xl font-bold text-gray-900">{getActiveCount()}</div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total a Pagar</h3>
                    <CurrencyDisplay amount={getTotalActive()} size="lg" variant="negative" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Quitadas</h3>
                    <div className="text-2xl font-bold text-green-600">
                        {installments.filter(inst => inst.status === 'quitada').length}
                    </div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total Geral</h3>
                    <CurrencyDisplay
                        amount={installments.reduce((total, inst) => total + inst.totalAmount, 0)}
                        size="lg"
                        variant="neutral"
                    />
                </Card>
            </div>

            {/* Lista de parceladas */}
            <div className="space-y-6">
                {installments.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">#️⃣</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhuma compra parcelada
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Registre suas compras parceladas para acompanhar o progresso dos pagamentos.
                            </p>
                            <Button>
                                <span className="mr-2">+</span>
                                Registrar Primeira Compra
                            </Button>
                        </div>
                    </Card>
                ) : (
                    installments.map((installment) => {
                        const progress = calculateProgress(installment);
                        const remainingAmount = calculateRemainingAmount(installment);
                        const nextDue = getNextDueDate(installment);

                        return (
                            <Card key={installment.id}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {installment.description}
                                            </h3>
                                            {getStatusBadge(installment.status)}
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="block text-gray-500">Fornecedor:</span>
                                                <span className="font-medium">{installment.vendor}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500">Cartão:</span>
                                                <span className="font-medium">{installment.cardName}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500">Categoria:</span>
                                                <span className="font-medium">{installment.categoryName}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500">Data da Compra:</span>
                                                <span className="font-medium">{formatDate(installment.purchaseDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-2 ml-4">
                                        <Button variant="outline" size="sm">
                                            Detalhes
                                        </Button>
                                        {installment.status === 'ativa' && (
                                            <>
                                                <Button variant="outline" size="sm">
                                                    Antecipar
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    ⋯
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Valores e progresso */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                                    <div className="text-center">
                                        <span className="block text-sm text-gray-500 mb-1">Valor Total</span>
                                        <CurrencyDisplay amount={installment.totalAmount} size="lg" />
                                    </div>

                                    <div className="text-center">
                                        <span className="block text-sm text-gray-500 mb-1">Valor da Parcela</span>
                                        <CurrencyDisplay amount={installment.installmentValue} size="lg" variant="negative" />
                                    </div>

                                    <div className="text-center">
                                        <span className="block text-sm text-gray-500 mb-1">Restante</span>
                                        <CurrencyDisplay
                                            amount={remainingAmount}
                                            size="lg"
                                            variant={installment.status === 'ativa' ? 'negative' : 'neutral'}
                                        />
                                    </div>

                                    <div className="text-center">
                                        <span className="block text-sm text-gray-500 mb-1">
                                            {nextDue ? 'Próximo Vencimento' : 'Status'}
                                        </span>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {nextDue ? formatDate(nextDue) : 'Quitada'}
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de progresso */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>
                                            Parcela {installment.currentInstallment} de {installment.installmentCount}
                                        </span>
                                        <span>{progress.toFixed(0)}% concluído</span>
                                    </div>

                                    <div className="bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Informações adicionais */}
                                {installment.monthlyInterest > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-yellow-600">⚠️</span>
                                            <span className="text-sm text-yellow-800">
                                                Parcelamento com juros de {installment.monthlyInterest}% ao mês
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
