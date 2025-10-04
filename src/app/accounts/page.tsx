'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { NewAccountDialog } from './components/NewAccountDialog';
import { EditAccountDialog } from './components/EditAccountDialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { AccountConversion } from '@/components/AccountConversion';
import { Account } from '@/types';
import { formatDate } from '@/utils/financial';

export default function AccountsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

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

    // Separar valores por moeda
    const getBalanceByurrency = () => {
        const balances = { BRL: 0, USD: 0, EUR: 0 };
        accounts.forEach(account => {
            if (balances.hasOwnProperty(account.currency)) {
                balances[account.currency as keyof typeof balances] += account.balance;
            }
        });
        return balances;
    };

    const getTotalBRLBalance = () => {
        return accounts
            .filter(account => account.currency === 'BRL')
            .reduce((total, account) => total + account.balance, 0);
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

    // Excluir conta
    const handleDelete = async (account: Account) => {
        if (!window.confirm(`Tem certeza que deseja excluir a conta "${account.name}"? Essa ação não pode ser desfeita.`)) return;
        try {
            const response = await fetch(`/api/accounts/${account.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Erro ao excluir conta');
            await loadAccounts();
        } catch {
            alert('Erro ao excluir conta.');
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
            {/* Dialog de nova conta */}
            <NewAccountDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onAccountCreated={loadAccounts}
            />
            {/* Dialog de edição de conta */}
            <EditAccountDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                onAccountUpdated={loadAccounts}
                account={selectedAccount}
            />
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Contas</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie suas contas bancárias e carteiras
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <span className="mr-2">+</span>
                    Nova Conta
                </Button>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card className="text-center px-3 py-2 bg-card border-border min-h-0 h-auto flex flex-col justify-center">
                    <div className="text-xl mb-1">🇧🇷</div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Saldo em Reais</h3>
                    <CurrencyDisplay
                        amount={getTotalBRLBalance()}
                        size="md"
                        variant={getTotalBRLBalance() >= 0 ? 'positive' : 'negative'}
                    />
                </Card>

                <Card className="text-center px-3 py-2 bg-card border-border min-h-0 h-auto flex flex-col justify-center">
                    <div className="text-xl mb-1">🇺🇸</div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Saldo em Dólares</h3>
                    <div className="text-base font-bold text-foreground">
                        ${(getBalanceByurrency().USD / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                </Card>

                <Card className="text-center px-3 py-2 bg-card border-border min-h-0 h-auto flex flex-col justify-center">
                    <div className="text-xl mb-1">🇪🇺</div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Saldo em Euros</h3>
                    <div className="text-base font-bold text-foreground">
                        €{(getBalanceByurrency().EUR / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </div>
                </Card>

                <Card className="text-center px-3 py-2 bg-card border-border min-h-0 h-auto flex flex-col justify-center">
                    <div className="text-xl mb-1">🏦</div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Total de Contas</h3>
                    <div className="text-xl font-bold text-foreground">{accounts.length}</div>
                </Card>

                <Card className="text-center px-3 py-2 bg-card border-border min-h-0 h-auto flex flex-col justify-center">
                    <div className="text-xl mb-1">📈</div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Contas Positivas</h3>
                    <div className="text-xl font-bold text-primary">
                        {accounts.filter(acc => acc.balance > 0).length}
                    </div>
                </Card>
            </div>

            {/* Lista de Contas */}
            <Card className="bg-card border-border">
                <div className="flex items-center justify-between p-6">
                    <h2 className="text-lg font-semibold text-foreground">Todas as Contas</h2>
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
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Nenhuma conta cadastrada
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Comece criando sua primeira conta para começar a controlar suas finanças.
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            <span className="mr-2">+</span>
                            Criar Primeira Conta
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Conta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Saldo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Valor em BRL
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Atualizado em
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-muted/30">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-xl mr-3">
                                                    {getAccountTypeIcon(account.type)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">
                                                        {account.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        {account.currency}
                                                        {account.currency !== 'BRL' && (
                                                            <span className="text-xs bg-primary/10 text-primary px-1 rounded">
                                                                Convertido
                                                            </span>
                                                        )}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <AccountConversion
                                                balance={account.balance}
                                                currency={account.currency}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {formatDate(account.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setSelectedAccount(account);
                                                    setEditDialogOpen(true);
                                                }}>
                                                    Editar
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    Extrato
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(account)}>
                                                    Excluir
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
