'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { Account } from '@/types';
import { formatDate } from '@/utils/financial';

export default function AccountsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAccounts = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/accounts');
            if (!response.ok) {
                throw new Error('Failed to fetch accounts');
            }
            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadAccounts();
        }
    }, [user, loadAccounts]);

    const getTotalBalance = () => {
        return accounts.reduce((total, account) => total + account.balance, 0);
    };

    const getAccountTypeIcon = (type: string) => {
        switch (type) {
            case 'corrente': return '🏦';
            case 'poupanca': return '🐷';
            case 'carteira': return '👛';
            case 'corretora': return '📊';
            default: return '💰';
        }
    };

    const getAccountTypeLabel = (type: string) => {
        switch (type) {
            case 'corrente': return 'Conta Corrente';
            case 'poupanca': return 'Poupança';
            case 'carteira': return 'Carteira';
            case 'corretora': return 'Corretora';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
                    <div className="grid gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
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
                    <h1 className="text-3xl font-bold text-gray-900">Contas</h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie suas contas bancárias e carteiras
                    </p>
                </div>
                <Button>
                    <span className="mr-2">+</span>
                    Nova Conta
                </Button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo Total</h3>
                    <CurrencyDisplay
                        amount={getTotalBalance()}
                        size="lg"
                        variant={getTotalBalance() >= 0 ? 'positive' : 'negative'}
                    />
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">🏦</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Contas</h3>
                    <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
                </Card>

                <Card className="text-center">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Contas Positivas</h3>
                    <div className="text-2xl font-bold text-green-600">
                        {accounts.filter(acc => acc.balance > 0).length}
                    </div>
                </Card>
            </div>

            {/* Lista de Contas */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Todas as Contas</h2>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                            Filtros
                        </Button>
                        <Button variant="outline" size="sm">
                            Exportar
                        </Button>
                    </div>
                </div>

                {accounts.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">🏦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhuma conta cadastrada
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Comece criando sua primeira conta para começar a controlar suas finanças.
                        </p>
                        <Button>
                            <span className="mr-2">+</span>
                            Criar Primeira Conta
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Conta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Saldo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Atualizado em
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-xl mr-3">
                                                    {getAccountTypeIcon(account.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {account.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {account.currency}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge
                                                variant={account.type === 'corrente' ? 'secondary' :
                                                    account.type === 'poupanca' ? 'default' :
                                                        account.type === 'corretora' ? 'secondary' : 'outline'}
                                            >
                                                {getAccountTypeLabel(account.type)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <CurrencyDisplay
                                                amount={account.balance}
                                                variant={account.balance >= 0 ? 'positive' : 'negative'}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(account.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button variant="ghost" size="sm">
                                                    Editar
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    Extrato
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    ⋯
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
