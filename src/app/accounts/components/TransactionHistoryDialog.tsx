import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Account } from '@/types';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    date: string;
    createdAt: string;
}

interface TransactionHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    account: Account;
}

export function TransactionHistoryDialog({ open, onClose, account }: TransactionHistoryDialogProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');

    // Definir mês vigente como padrão
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    const loadTransactions = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/accounts/${account.id}/transactions`);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        } catch {
            // Erro silencioso no carregamento
        } finally {
            setLoading(false);
        }
    }, [account]);

    useEffect(() => {
        if (open && account) {
            loadTransactions();
        }
    }, [open, account, loadTransactions]);

    const getTypeIcon = (type: string) => {
        return type === 'deposit' ? '💰' : '💸';
    };

    const getTypeLabel = (type: string) => {
        return type === 'deposit' ? 'Aporte' : 'Retirada';
    };

    // Filtrar transações
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            // Filtro por tipo
            if (filterType !== 'all' && transaction.type !== filterType) {
                return false;
            }

            // Filtro por data
            const transactionDate = new Date(transaction.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && transactionDate < start) return false;
            if (end && transactionDate > end) return false;

            // Filtro por pesquisa
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return transaction.description?.toLowerCase().includes(query) || false;
            }

            return true;
        });
    }, [transactions, filterType, startDate, endDate, searchQuery]);

    // Calcular totais
    const totals = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, t) => {
                if (t.type === 'deposit') acc.deposits += t.amount;
                else acc.withdrawals += Math.abs(t.amount);
                return acc;
            },
            { deposits: 0, withdrawals: 0 }
        );
    }, [filteredTransactions]);

    const resetFilters = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        setSearchQuery('');
        setFilterType('all');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-card border-border shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        📊 Histórico de Transações
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Conta: <span className="font-semibold text-foreground">{account.name}</span>
                    </p>
                </DialogHeader>

                {/* Filtros */}
                <div className="space-y-4 pb-4 border-b border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Campo de pesquisa */}
                        <div className="space-y-1">
                            <Label htmlFor="search" className="text-xs text-muted-foreground">
                                🔍 Pesquisar
                            </Label>
                            <Input
                                id="search"
                                type="text"
                                placeholder="Descrição..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-9 bg-background border-border text-foreground text-sm"
                            />
                        </div>

                        {/* Filtro de tipo */}
                        <div className="space-y-1">
                            <Label htmlFor="type" className="text-xs text-muted-foreground">
                                📌 Tipo
                            </Label>
                            <select
                                id="type"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value as 'all' | 'deposit' | 'withdrawal')}
                                className="w-full h-9 border border-border rounded-lg px-3 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">Todos</option>
                                <option value="deposit">💰 Aportes</option>
                                <option value="withdrawal">💸 Retiradas</option>
                            </select>
                        </div>

                        {/* Data inicial */}
                        <div className="space-y-1">
                            <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                                📅 Data Inicial
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="h-9 bg-background border-border text-foreground text-sm"
                            />
                        </div>

                        {/* Data final */}
                        <div className="space-y-1">
                            <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                                📅 Data Final
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="h-9 bg-background border-border text-foreground text-sm"
                            />
                        </div>
                    </div>

                    {/* Botão de limpar filtros e resumo */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            🔄 Resetar Filtros
                        </Button>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                                {filteredTransactions.length} transaç{filteredTransactions.length === 1 ? 'ão' : 'ões'}
                            </span>
                            {filteredTransactions.length > 0 && (
                                <>
                                    <span className="text-primary font-medium">
                                        <CurrencyDisplay amount={totals.deposits} size="sm" variant="positive" />
                                    </span>
                                    <span className="text-destructive font-medium">
                                        <CurrencyDisplay amount={totals.withdrawals} size="sm" variant="negative" showSign />
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de transações com scroll */}
                <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 320px)' }}>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📝</div>
                            <p className="text-muted-foreground">
                                {transactions.length === 0
                                    ? 'Nenhuma transação registrada ainda.'
                                    : 'Nenhuma transação encontrada com os filtros aplicados.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/30 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        <span className="text-xl">{getTypeIcon(transaction.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">
                                                {transaction.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${transaction.type === 'deposit'
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'bg-destructive/20 text-destructive'
                                                        }`}
                                                >
                                                    {getTypeLabel(transaction.type)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <CurrencyDisplay
                                            amount={Math.abs(transaction.amount)}
                                            variant={transaction.amount >= 0 ? 'positive' : 'negative'}
                                            size="md"
                                            showSign={transaction.amount < 0}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-border mt-2">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-border text-foreground hover:bg-muted"
                    >
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
