'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatPercentage } from '@/utils/financial';

interface Asset {
    id: string;
    name: string;
    accountName: string;
    type: 'poupanca' | 'cdb' | 'tesouro' | 'saldo_corrente_rendido' | 'outro';
    principal: number;
    currentBalance: number;
    rateMethod: 'fixa_anual' | 'fixa_diaria' | 'percentual_de_indice';
    annualRate?: number;
    dailyRate?: number;
    indexName?: string;
    indexPercent?: number;
    startDate: Date;
    totalReturn: number;
    monthlyReturn: number;
    projectedBalance: number;
    status: 'ativo' | 'resgatado' | 'pausado';
}

export default function AssetsPage() {
    const [assets] = useState<Asset[]>([]);

    const getAssetTypeIcon = (type: Asset['type']) => {
        switch (type) {
            case 'poupanca': return '🐷';
            case 'cdb': return '🏦';
            case 'tesouro': return '🏛️';
            case 'saldo_corrente_rendido': return '💳';
            case 'outro': return '📊';
            default: return '💰';
        }
    };

    const getAssetTypeLabel = (type: Asset['type']) => {
        switch (type) {
            case 'poupanca': return 'Poupança';
            case 'cdb': return 'CDB';
            case 'tesouro': return 'Tesouro Direto';
            case 'saldo_corrente_rendido': return 'Conta Remunerada';
            case 'outro': return 'Outros';
            default: return type;
        }
    };

    const getStatusBadge = (status: Asset['status']) => {
        switch (status) {
            case 'ativo':
                return <Badge variant="default">Ativo</Badge>;
            case 'resgatado':
                return <Badge variant="default">Resgatado</Badge>;
            case 'pausado':
                return <Badge variant="secondary">Pausado</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const getRateDisplay = (asset: Asset) => {
        if (asset.rateMethod === 'fixa_anual' && asset.annualRate) {
            return `${asset.annualRate}% a.a.`;
        }
        if (asset.rateMethod === 'fixa_diaria' && asset.dailyRate) {
            return `${(asset.dailyRate * 365).toFixed(2)}% a.a.`;
        }
        if (asset.rateMethod === 'percentual_de_indice' && asset.indexName && asset.indexPercent) {
            return `${asset.indexPercent}% do ${asset.indexName}`;
        }
        return 'N/A';
    };

    const getTotalBalance = () => {
        return assets
            .filter(asset => asset.status === 'ativo')
            .reduce((total, asset) => total + asset.currentBalance, 0);
    };

    const getTotalReturn = () => {
        return assets.reduce((total, asset) => total + asset.totalReturn, 0);
    };

    const getMonthlyReturn = () => {
        return assets
            .filter(asset => asset.status === 'ativo')
            .reduce((total, asset) => total + asset.monthlyReturn, 0);
    };

    const getAverageYield = () => {
        const activeAssets = assets.filter(asset => asset.status === 'ativo');
        if (activeAssets.length === 0) return 0;

        const totalPrincipal = activeAssets.reduce((sum, asset) => sum + asset.principal, 0);
        const totalBalance = activeAssets.reduce((sum, asset) => sum + asset.currentBalance, 0);

        if (totalPrincipal === 0) return 0;

        const overallReturn = (totalBalance - totalPrincipal) / totalPrincipal;
        // Convertendo para taxa anual aproximada baseada no tempo médio
        return overallReturn * 12; // Simplificação para demonstração
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Ativos e Rendimentos</h1>
                    <p className="text-gray-600 mt-2">
                        Acompanhe o desempenho dos seus investimentos e ativos que rendem
                    </p>
                </div>
                <Button>
                    <span className="mr-2">+</span>
                    Novo Ativo
                </Button>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo Total</h3>
                    <CurrencyDisplay amount={getTotalBalance()} size="lg" variant="positive" />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Rendimento Total</h3>
                    <CurrencyDisplay amount={getTotalReturn()} size="lg" variant="positive" showSign />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Rendimento Mensal</h3>
                    <CurrencyDisplay amount={getMonthlyReturn()} size="lg" variant="positive" showSign />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">🎯</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Rentabilidade Média</h3>
                    <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(getAverageYield() / 100)}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de ativos */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Carteira de Ativos
                            </h2>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                    Filtros
                                </Button>
                                <Button variant="outline" size="sm">
                                    Relatório
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {assets.map((asset) => {
                                const returnPercentage = asset.principal > 0 ?
                                    ((asset.currentBalance - asset.principal) / asset.principal) * 100 : 0;

                                return (
                                    <div
                                        key={asset.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="text-xl">{getAssetTypeIcon(asset.type)}</span>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {asset.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">{asset.accountName}</p>
                                                    </div>
                                                    {getStatusBadge(asset.status)}
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div>
                                                        <span className="text-gray-500 block">Tipo:</span>
                                                        <span className="font-medium">{getAssetTypeLabel(asset.type)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Taxa:</span>
                                                        <span className="font-medium">{getRateDisplay(asset)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Início:</span>
                                                        <span className="font-medium">{formatDate(asset.startDate)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right ml-4">
                                                {asset.status === 'ativo' ? (
                                                    <CurrencyDisplay amount={asset.currentBalance} size="lg" variant="positive" />
                                                ) : (
                                                    <div className="text-lg font-semibold text-gray-400">Resgatado</div>
                                                )}

                                                {asset.totalReturn !== 0 && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        <CurrencyDisplay
                                                            amount={asset.totalReturn}
                                                            size="sm"
                                                            variant="positive"
                                                            showSign
                                                        />
                                                        <span className="ml-1">
                                                            ({returnPercentage > 0 ? '+' : ''}{returnPercentage.toFixed(2)}%)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Detalhes expandidos */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-200 text-sm">
                                            <div>
                                                <span className="text-gray-500 block">Principal:</span>
                                                <CurrencyDisplay amount={asset.principal} size="sm" />
                                            </div>

                                            {asset.status === 'ativo' && (
                                                <>
                                                    <div>
                                                        <span className="text-gray-500 block">Rendimento Mensal:</span>
                                                        <CurrencyDisplay
                                                            amount={asset.monthlyReturn}
                                                            size="sm"
                                                            variant="positive"
                                                            showSign
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className="text-gray-500 block">Projeção (12m):</span>
                                                        <CurrencyDisplay amount={asset.projectedBalance} size="sm" />
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex space-x-2">
                                                {asset.status === 'ativo' && (
                                                    <>
                                                        <Button variant="outline" size="sm">
                                                            Aporte
                                                        </Button>
                                                        <Button variant="outline" size="sm">
                                                            Resgate
                                                        </Button>
                                                    </>
                                                )}
                                                <Button variant="ghost" size="sm">
                                                    Histórico
                                                </Button>
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
                    {/* Distribuição por tipo */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Distribuição por Tipo
                        </h3>

                        <div className="space-y-3">
                            {Object.entries(
                                assets
                                    .filter(asset => asset.status === 'ativo')
                                    .reduce((acc, asset) => {
                                        acc[asset.type] = (acc[asset.type] || 0) + asset.currentBalance;
                                        return acc;
                                    }, {} as Record<string, number>)
                            ).map(([type, amount]) => {
                                const percentage = (amount / getTotalBalance()) * 100;

                                return (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span>{getAssetTypeIcon(type as Asset['type'])}</span>
                                            <span className="text-sm text-gray-700">
                                                {getAssetTypeLabel(type as Asset['type'])}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <CurrencyDisplay amount={amount} size="sm" />
                                            <div className="text-xs text-gray-500">
                                                {percentage.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Performance */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Performance
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Melhor ativo:</span>
                                <div className="text-right">
                                    <div className="text-sm font-medium">CDB Inter</div>
                                    <div className="text-xs text-green-600">+8.6% a.a.</div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Maior rendimento:</span>
                                <CurrencyDisplay amount={245.80} size="sm" variant="positive" />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Tempo médio:</span>
                                <span className="text-sm font-medium">8 meses</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">CDI atual:</span>
                                <span className="text-sm font-medium text-blue-600">10.75% a.a.</span>
                            </div>
                        </div>
                    </Card>

                    {/* Próximas ações */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Próximas Ações
                        </h3>

                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-blue-600">📅</span>
                                    <span className="text-sm font-medium text-blue-900">
                                        Vencimento Tesouro
                                    </span>
                                </div>
                                <p className="text-xs text-blue-800">
                                    Tesouro SELIC vence em 45 dias
                                </p>
                            </div>

                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-green-600">💰</span>
                                    <span className="text-sm font-medium text-green-900">
                                        Crédito de Rendimento
                                    </span>
                                </div>
                                <p className="text-xs text-green-800">
                                    R$ 48,50 creditados hoje na poupança
                                </p>
                            </div>

                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-yellow-600">⚠️</span>
                                    <span className="text-sm font-medium text-yellow-900">
                                        Taxa em Queda
                                    </span>
                                </div>
                                <p className="text-xs text-yellow-800">
                                    CDI caiu 0.25% esta semana
                                </p>
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
                                📊 Simular Aporte
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                📈 Projeção Anual
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                🔄 Rebalancear
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                💾 Exportar Extrato
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
