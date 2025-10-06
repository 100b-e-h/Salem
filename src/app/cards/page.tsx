'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '../../components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';
import { Card as CardType, Invoice, Transaction } from '@/types';
import { NewCardDialog } from './components/NewCardDialog';
import { EditCardDialog } from './components/EditCardDialog';

export default function CardsPage() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CardType[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;

        try {
            const [cardsResponse, invoicesResponse] = await Promise.all([
                fetch('/api/cards'),
                fetch('/api/invoices')
            ]);

            if (!cardsResponse.ok || !invoicesResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const [cardsData, invoicesData] = await Promise.all([
                cardsResponse.json(),
                invoicesResponse.json()
            ]);

            setCards(cardsData);
            setInvoices(invoicesData);
        } catch (error) {
            console.error('Erro ao carregar dados dos cartões:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

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

        return invoices.find(invoice =>
            invoice.cardId === cardId &&
            invoice.month === targetMonth &&
            invoice.year === targetYear
        );
    };

    const calculateLimitUsage = (card: CardType) => {
        const currentInvoice = getCardInvoice(card.id);
        const usedAmount = currentInvoice?.totalAmount || 0;

        // Heuristic normalize: some older records were double-converted and are 100x too large.
        // Compute average limit to detect outliers, then divide by 100 when necessary.
        const allLimits = cards.map(c => c.totalLimit);
        const avgLimit = allLimits.length ? allLimits.reduce((a, b) => a + b, 0) / allLimits.length : 0;

        const normalize = (value: number) => {
            if (!avgLimit) {
                // if no baseline, only reduce extreme values
                return value > 1_000_000 ? Math.round(value / 100) : value;
            }
            // if value is an extreme outlier compared to average (e.g., 50x larger), divide by 100
            return value > avgLimit * 50 ? Math.round(value / 100) : value;
        };

        const normalizedLimit = normalize(card.totalLimit);
        const percentage = normalizedLimit > 0 ? (usedAmount / normalizedLimit) * 100 : 0;

        return {
            used: usedAmount,
            available: normalizedLimit - usedAmount,
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

    // Estado para dialogs/menus (um por cartão)
    const [openInvoiceDialogId, setOpenInvoiceDialogId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    // Estados para edição de cartão
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState<CardType | null>(null);

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
            {/* Dialog de novo cartão */}
            <NewCardDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCardCreated={loadData}
            />
            {/* Dialog de edição de cartão */}
            {cardToEdit && (
                <EditCardDialog
                    open={editDialogOpen}
                    onClose={() => { setEditDialogOpen(false); setCardToEdit(null); }}
                    card={cardToEdit}
                    onCardUpdated={loadData}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cartões</h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie seus cartões de crédito e faturas
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <span className="mr-2">+</span>
                    Novo Cartão
                </Button>
            </div>

            {/* Resumo - cards compactos e padronizados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-card border-border text-center px-3 py-2 min-h-0 h-auto flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center">
                        <div className="text-xl mb-1">💳</div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Total de Cartões</h3>
                        <div className="text-xl font-bold text-foreground">{cards.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border text-center px-3 py-2 min-h-0 h-auto flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center">
                        <div className="text-xl mb-1">💰</div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Limite Total</h3>
                        <CurrencyDisplay amount={getTotalLimit() / 100} size="md" variant="neutral" />
                    </CardContent>
                </Card>
                <Card className="bg-card border-border text-center px-3 py-2 min-h-0 h-auto flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center">
                        <div className="text-xl mb-1">📊</div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Usado</h3>
                        <CurrencyDisplay amount={getTotalUsed() / 100} size="md" variant="negative" />
                    </CardContent>
                </Card>
                <Card className="bg-card border-border text-center px-3 py-2 min-h-0 h-auto flex flex-col justify-center">
                    <CardContent className="p-0 flex flex-col items-center">
                        <div className="text-xl mb-1">✅</div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5">Disponível</h3>
                        <CurrencyDisplay
                            amount={(getTotalLimit() - getTotalUsed()) / 100}
                            size="md"
                            variant="positive"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Cartões */}
            {cards.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <div className="text-4xl mb-4">💳</div>
                        <h3 className="text-lg font-medium mb-2">
                            Nenhum cartão cadastrado
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Adicione seus cartões de crédito para controlar gastos e faturas.
                        </p>
                        <Button onClick={() => setDialogOpen(true)}>
                            <span className="mr-2">+</span>
                            Adicionar Primeiro Cartão
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cards.map((card) => {
                        const usage = calculateLimitUsage(card);
                        const currentInvoice = getCardInvoice(card.id);
                        const nextInvoice = getCardInvoice(card.id, 'next');

                        let transactions: Transaction[] = [];
                        if (currentInvoice && typeof currentInvoice === 'object') {
                            const maybe = (currentInvoice as unknown) as { transactions?: unknown };
                            if (Array.isArray(maybe.transactions)) {
                                transactions = maybe.transactions as Transaction[];
                            }
                        }

                        return (
                            <Card key={card.id} className="bg-card border-border">
                                <CardContent className="p-4">
                                    {/* Header do Cartão */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-xl">💳</div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{card.alias}</h3>
                                                <p className="text-xs text-muted-foreground">{card.brand}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Badge
                                                variant={usage.percentage > 80 ? 'destructive' :
                                                    usage.percentage > 60 ? 'secondary' : 'default'}
                                            >
                                                {usage.percentage.toFixed(0)}%
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="ml-2 px-2 py-1" onClick={() => setOpenMenuId(openMenuId === card.id ? null : card.id)}>
                                                ⋯
                                            </Button>
                                            {openMenuId === card.id && (
                                                <div className="absolute right-0 mt-2 w-32 bg-popover border border-border rounded shadow-lg z-10">
                                                    <button className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer" onClick={() => { setCardToEdit(card); setEditDialogOpen(true); setOpenMenuId(null); }}>Editar</button>
                                                    <button className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted cursor-pointer" onClick={async () => {
                                                        setOpenMenuId(null);
                                                        if (window.confirm('Tem certeza que deseja excluir este cartão?')) {
                                                            await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
                                                            loadData();
                                                        }
                                                    }}>Excluir</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Limite */}
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Limite:</span>
                                            <CurrencyDisplay amount={card.totalLimit / 100} size="sm" />
                                        </div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Usado:</span>
                                            <CurrencyDisplay amount={usage.used} size="sm" variant="negative" />
                                        </div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-muted-foreground">Disponível:</span>
                                            <CurrencyDisplay amount={usage.available / 100} size="sm" variant="positive" />
                                        </div>
                                        {/* Barra de progresso */}
                                        <div className="bg-secondary rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${usage.percentage > 80 ? 'bg-destructive' :
                                                    usage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${usage.percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Faturas */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Fatura Atual:</span>
                                            <div className="text-right">
                                                <CurrencyDisplay
                                                    amount={currentInvoice?.totalAmount || 0}
                                                    size="sm"
                                                    variant="negative"
                                                />
                                                <div className="text-[10px] text-muted-foreground">
                                                    Venc: {card.dueDay}/{String(new Date().getMonth() + 1).padStart(2, '0')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Próxima Fatura:</span>
                                            <div className="text-right">
                                                <CurrencyDisplay
                                                    amount={nextInvoice?.totalAmount || 0}
                                                    size="sm"
                                                    variant="neutral"
                                                />
                                                <div className="text-[10px] text-muted-foreground">
                                                    Venc: {card.dueDay}/{String(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2).padStart(2, '0')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Datas importantes */}
                                    <div className="bg-muted rounded-lg p-2 mb-3">
                                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                            <span>Fechamento:</span>
                                            <span>Dia {card.closingDay}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Vencimento:</span>
                                            <span>Dia {card.dueDay}</span>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpenInvoiceDialogId(card.id)}>
                                            Ver Fatura
                                        </Button>
                                    </div>

                                    {/* Dialog de lançamentos da fatura */}
                                    {openInvoiceDialogId === card.id && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                            <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg p-6 relative">
                                                <button className="absolute top-2 right-2 text-muted-foreground cursor-pointer" onClick={() => setOpenInvoiceDialogId(null)}>&times;</button>
                                                <h2 className="text-lg font-bold mb-4 text-foreground">Lançamentos da Fatura</h2>
                                                {transactions.length > 0 ? (
                                                    <ul className="divide-y divide-border mb-2">
                                                        {transactions.map((tx) => (
                                                            <li key={tx.id} className="py-2 flex justify-between text-sm">
                                                                <span className="text-foreground">{tx.description}</span>
                                                                <CurrencyDisplay amount={tx.amount} size="sm" variant={tx.amount < 0 ? 'negative' : 'positive'} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="text-muted-foreground text-sm">Nenhum lançamento nesta fatura.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
