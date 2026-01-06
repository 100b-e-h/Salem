import React from "react";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateOnly } from '@/utils/invoice';
import type { Transaction as TxType } from '@/types';

type TxWithCategory = TxType & { category?: string; categoryId?: string };

interface TransactionsTableProps {
    transactions: TxType[];
    onEdit: (transaction: TxType) => void;
    onDelete: (transaction: TxType) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onEdit, onDelete }) => {
    const getCategoryLabel = (tx: TxWithCategory) => {
        if (tx.category && typeof tx.category === 'string') return tx.category;
        if (tx.categoryId && typeof tx.categoryId === 'string') return tx.categoryId;
        return '-';
    };
    
    const getFinanceTypeLabel = (tx: TxType) => {
        switch (tx.financeType) {
            case 'upfront':
                return '💵 À Vista';
            case 'installment':
                return '📅 Parcelado';
            case 'subscription':
                return '🔄 Assinatura';
            default:
                return '-';
        }
    };
    
    return (
        <div className="overflow-x-auto max-h-96 min-h-[200px]">
            <table className="min-w-full text-sm border border-border rounded-lg bg-background">
                <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Data</th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Descrição</th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Categoria</th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">🏷️ Tags</th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Tipo de Pagamento</th>
                        <th className="px-3 py-2 text-right font-semibold text-foreground">Valor</th>
                        <th className="px-3 py-2 text-center font-semibold text-foreground">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                Nenhum lançamento encontrado para esta fatura.
                            </td>
                        </tr>
                    ) : (
                        transactions.map((tx) => (
                            <tr key={tx.transactionId} className="border-t border-border hover:bg-muted/40 transition-colors">
                                {/* Display UTC date without timezone conversion */}
                                <td className="px-3 py-2 whitespace-nowrap">{formatDateOnly(tx.date)}</td>
                                <td className="px-3 py-2 max-w-xs truncate">{tx.description}</td>
                                <td className="px-3 py-2">{getCategoryLabel(tx)}</td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                        {tx.tags && tx.tags.length > 0 ? (
                                            tx.tags.slice(0, 3).map((tag, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                        {tx.tags && tx.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                +{tx.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2">{getFinanceTypeLabel(tx)}</td>
                                <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {tx.type === 'income' && (
                                            <Badge variant="default" className="bg-green-600 text-white text-xs">
                                                💰 Reembolso
                                            </Badge>
                                        )}
                                        <CurrencyDisplay 
                                            amount={tx.amount} 
                                            className={tx.type === 'income' ? 'text-green-600 dark:text-green-400 font-semibold' : ''}
                                        />
                                    </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <div className="flex gap-1 justify-center">
                                        <Button size="sm" variant="outline" onClick={() => onEdit(tx as TxType)}>
                                            ✏️ Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onDelete(tx as TxType)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            🗑️ Deletar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
