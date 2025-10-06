import React from "react";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Button } from '@/components/ui/Button';
import type { Transaction as TxType } from '@/types';

type TxWithCategory = TxType & { category?: string; categoryId?: string };

interface TransactionsTableProps {
    transactions: TxType[];
    onEdit: (transaction: TxType) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, onEdit }) => {
    const getCategoryLabel = (tx: TxWithCategory) => {
        if (tx.category && typeof tx.category === 'string') return tx.category;
        if (tx.categoryId && typeof tx.categoryId === 'string') return tx.categoryId;
        return '-';
    };
    return (
        <div className="overflow-x-auto max-h-96 min-h-[200px]">
            <table className="min-w-full text-sm border border-border rounded-lg bg-background">
                <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Data</th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Descrição</th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">Categoria</th>
                        <th className="px-3 py-2 text-right font-semibold text-foreground">Valor</th>
                        <th className="px-3 py-2 text-center font-semibold text-foreground">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nenhum lançamento encontrado para esta fatura.
                            </td>
                        </tr>
                    ) : (
                        transactions.map((tx) => (
                            <tr key={tx.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                                <td className="px-3 py-2 max-w-xs truncate">{tx.description}</td>
                                <td className="px-3 py-2">{getCategoryLabel(tx)}</td>
                                <td className="px-3 py-2 text-right">
                                    <CurrencyDisplay amount={tx.amount} />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <Button size="sm" variant="outline" onClick={() => onEdit(tx as TxType)}>
                                        ✏️ Editar
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
