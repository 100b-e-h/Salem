import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { useAuth } from '@/components/AuthProvider';
import { Card as CardType } from '@/types';

const CATEGORIES = [
    { value: 'alimentacao', label: '🍔 Alimentação' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'saude', label: '⚕️ Saúde' },
    { value: 'educacao', label: '📚 Educação' },
    { value: 'lazer', label: '🎮 Lazer' },
    { value: 'vestuario', label: '👕 Vestuário' },
    { value: 'moradia', label: '🏠 Moradia' },
    { value: 'servicos', label: '🔧 Serviços' },
    { value: 'compras', label: '🛒 Compras' },
    { value: 'outros', label: '📦 Outros' },
];

interface NewTransactionDialogProps {
    open: boolean;
    onClose: () => void;
    onTransactionCreated: () => void;
    card: CardType;
    selectedMonth: string;
}

interface SharedUser {
    id: string;
    email: string;
    paid: boolean;
}

export function NewTransactionDialog({
    open,
    onClose,
    onTransactionCreated,
    card,
    selectedMonth
}: NewTransactionDialogProps) {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
    const [emailSearch, setEmailSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; name?: string }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'manual' | 'csv'>('manual');

    // Debounced user search
    const searchUsers = useCallback(async (email: string) => {
        if (!email || email.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const data = await response.json();
                const filtered = data.filter((u: { id: string; email: string }) =>
                    u.id !== user?.id && !sharedUsers.find(su => su.id === u.id)
                );
                setSearchResults(filtered);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [user?.id, sharedUsers]);

    const addSharedUser = (userToAdd: { id: string; email: string; name?: string }) => {
        setSharedUsers([...sharedUsers, { id: userToAdd.id, email: userToAdd.email, paid: false }]);
        setEmailSearch('');
        setSearchResults([]);
    };

    const removeSharedUser = (userId: string) => {
        setSharedUsers(sharedUsers.filter(u => u.id !== userId));
    };

    const toggleUserPaid = (userId: string) => {
        setSharedUsers(sharedUsers.map(u =>
            u.id === userId ? { ...u, paid: !u.paid } : u
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/cards/${card.id}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    amount: Math.abs(amount),
                    date,
                    category: category || null,
                    month: parseInt(selectedMonth.split('-')[1]),
                    year: parseInt(selectedMonth.split('-')[0]),
                    sharedWith: sharedUsers.length > 0 ? sharedUsers : null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create transaction');
            }
            setDescription('');
            setAmount(0);
            setCategory('');
            setSharedUsers([]);
            setEmailSearch('');
            setSearchResults([]);
            setDate(new Date().toISOString().split('T')[0]);

            onClose();
            onTransactionCreated();
        } catch (error) {
            console.error('Erro ao criar lançamento:', error);
            alert('Erro ao criar lançamento. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCsvImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile || !user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('file', csvFile);
            formData.append('cardId', card.id);
            formData.append('month', selectedMonth.split('-')[1]);
            formData.append('year', selectedMonth.split('-')[0]);

            const response = await fetch(`/api/cards/${card.id}/transactions/import`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to import CSV');
            }

            setCsvFile(null);
            onClose();
            onTransactionCreated();
        } catch (error) {
            console.error('Erro ao importar CSV:', error);
            alert('Erro ao importar CSV. Verifique o formato do arquivo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-card border-border shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        💳 Novo Lançamento
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-2">
                        Cartão: <span className="font-semibold text-foreground">{card.alias}</span> •
                        Competência: <span className="font-semibold text-foreground">{selectedMonth}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 mb-4">
                    <Button
                        type="button"
                        variant={importMode === 'manual' ? 'default' : 'outline'}
                        onClick={() => setImportMode('manual')}
                        className="flex-1"
                    >
                        ✏️ Manual
                    </Button>
                    <Button
                        type="button"
                        variant={importMode === 'csv' ? 'default' : 'outline'}
                        onClick={() => setImportMode('csv')}
                        className="flex-1"
                    >
                        📄 Importar CSV
                    </Button>
                </div>

                {importMode === 'manual' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-foreground font-medium">
                                Descrição
                            </Label>
                            <Input
                                id="description"
                                type="text"
                                placeholder="Ex: Mercado, Restaurante, Combustível..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="bg-background border-border text-foreground"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-foreground font-medium">
                                    Valor
                                </Label>
                                <MoneyInput
                                    id="amount"
                                    onValueChange={centavos => setAmount(Math.abs(centavos))}
                                    allowNegative={false}
                                    required
                                    value={amount === 0 ? '' : (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    className="bg-background border-border text-foreground"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-foreground font-medium">
                                    Data
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="bg-background border-border text-foreground"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-foreground font-medium">
                                Categoria
                            </Label>
                            <select
                                id="category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Selecione uma categoria...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emailSearch" className="text-foreground font-medium">
                                👥 Compartilhar com (Opcional)
                            </Label>
                            <div className="relative">
                                <Input
                                    id="emailSearch"
                                    type="text"
                                    placeholder="Buscar por email..."
                                    value={emailSearch}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setEmailSearch(value);
                                        if (value.length >= 3) {
                                            searchUsers(value);
                                        } else {
                                            setSearchResults([]);
                                        }
                                    }}
                                    className="bg-background border-border text-foreground"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-3">
                                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {searchResults.map(result => (
                                            <button
                                                key={result.id}
                                                type="button"
                                                onClick={() => addSharedUser(result)}
                                                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-foreground"
                                            >
                                                <div className="font-medium">{result.email}</div>
                                                {result.name && (
                                                    <div className="text-xs text-muted-foreground">{result.name}</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Adicione pessoas que compartilham esse gasto (ex: dividir restaurante)
                            </p>

                            {sharedUsers.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {sharedUsers.map(sharedUser => (
                                        <div
                                            key={sharedUser.id}
                                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                        >
                                            <div className="flex items-center space-x-2 flex-1">
                                                <span className="text-sm text-foreground font-medium">
                                                    {sharedUser.email}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleUserPaid(sharedUser.id)}
                                                    className={`text-xs px-2 py-1 rounded transition-colors ${sharedUser.paid
                                                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                                                            : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                                        }`}
                                                >
                                                    {sharedUser.paid ? '✅ Pago' : '⏳ Pendente'}
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSharedUser(sharedUser.id)}
                                                className="text-red-500 hover:text-red-700 transition-colors ml-2"
                                                title="Remover"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="border-border text-foreground hover:bg-muted"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isSubmitting ? 'Salvando...' : '💾 Salvar Lançamento'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleCsvImport} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="csv" className="text-foreground font-medium">
                                Arquivo CSV
                            </Label>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                                <Input
                                    id="csv"
                                    type="file"
                                    accept=".csv"
                                    onChange={e => setCsvFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <label htmlFor="csv" className="cursor-pointer">
                                    <div className="text-4xl mb-2">📄</div>
                                    {csvFile ? (
                                        <p className="text-sm text-foreground font-medium">{csvFile.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm text-foreground font-medium mb-1">
                                                Clique para selecionar um arquivo CSV
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Formato: descrição, valor, data, categoria
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="bg-muted rounded-lg p-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">
                                📋 Formato esperado do CSV:
                            </h4>
                            <code className="text-xs text-muted-foreground block">
                                descrição,valor,data,categoria<br />
                                Mercado Extra,150.50,2025-10-05,Alimentação<br />
                                Posto Shell,200.00,2025-10-06,Combustível
                            </code>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="border-border text-foreground hover:bg-muted"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !csvFile}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isSubmitting ? 'Importando...' : '📥 Importar CSV'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
