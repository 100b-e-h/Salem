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
import { Plus, Trash2, Users } from 'lucide-react';

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

function SharedUsersDialog({ open, onClose, sharedUsers, onUpdate, currentUserId }: {
    open: boolean;
    onClose: () => void;
    sharedUsers: SharedUser[];
    onUpdate: (users: SharedUser[]) => void;
    currentUserId?: string;
}) {
    const [emailSearch, setEmailSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; name?: string }>>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchUsers = async (email: string) => {
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
                    u.id !== currentUserId && !sharedUsers.find(su => su.id === u.id)
                );
                setSearchResults(filtered);
            }
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const addSharedUser = (userToAdd: { id: string; email: string; name?: string }) => {
        onUpdate([...sharedUsers, { id: userToAdd.id, email: userToAdd.email, paid: false }]);
        setEmailSearch('');
        setSearchResults([]);
    };

    const removeSharedUser = (userId: string) => {
        onUpdate(sharedUsers.filter(u => u.id !== userId));
    };

    const toggleUserPaid = (userId: string) => {
        onUpdate(sharedUsers.map(u =>
            u.id === userId ? { ...u, paid: !u.paid } : u
        ));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border shadow-lg z-[60]">
                <DialogHeader>
                    <DialogTitle>👥 Compartilhar Lançamento</DialogTitle>
                    <DialogDescription>
                        Adicione pessoas para dividir este gasto.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Input
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

                    {sharedUsers.length > 0 ? (
                        <div className="space-y-2">
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
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Ninguém adicionado ainda.
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={onClose}>Concluído</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
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
    const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');
    const [installments, setInstallments] = useState(1);
    const [mode, setMode] = useState<'single' | 'multiple' | 'csv'>('single');
    const [targetMonth, setTargetMonth] = useState(selectedMonth);
    const [sharingRowId, setSharingRowId] = useState<string | null>(null);
    const [multipleTransactions, setMultipleTransactions] = useState<Array<{
        id: string;
        description: string;
        amount: number;
        date: string;
        category: string;
        targetMonth: string;
        installments: number;
        sharedWith: SharedUser[];
    }>>([]);

    React.useEffect(() => {
        if (open) {
            setTargetMonth(selectedMonth);
            if (mode === 'multiple' && multipleTransactions.length === 0) {
                handleAddRow();
            }
        }
    }, [open, selectedMonth, mode]);

    const handleAddRow = () => {
        setMultipleTransactions(prev => [...prev, {
            id: crypto.randomUUID(),
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            targetMonth: selectedMonth,
            installments: 1,
            sharedWith: []
        }]);
    };

    const handleRemoveRow = (id: string) => {
        setMultipleTransactions(prev => prev.filter(t => t.id !== id));
    };

    const handleRowChange = (id: string, field: string, value: any) => {
        setMultipleTransactions(prev => prev.map(t => 
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const handleSaveMultiple = async () => {
        if (!user || isSubmitting) return;
        
        const invalid = multipleTransactions.find(t => !t.description || t.amount <= 0 || !t.category);
        if (invalid) {
            alert('Preencha todos os campos obrigatórios (Descrição, Valor, Categoria) em todas as linhas.');
            return;
        }

        setIsSubmitting(true);
        try {
            for (const t of multipleTransactions) {
                const [year, month] = t.targetMonth.split('-').map(Number);
                const response = await fetch(`/api/cards/${card.cardId}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        description: t.description,
                        amount: Math.abs(t.amount),
                        date: t.date,
                        category: t.category,
                        installments: t.installments,
                        invoiceMonth: month,
                        invoiceYear: year,
                        sharedWith: t.sharedWith.length > 0 ? t.sharedWith : null,
                    }),
                });
                if (!response.ok) throw new Error('Failed to create transaction');
            }
            
            setMultipleTransactions([]);
            setMode('single');
            onClose();
            onTransactionCreated();
        } catch (e) {
            alert('Erro ao salvar lançamentos. Alguns podem ter sido salvos.');
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMonthOptions = React.useMemo(() => {
        const options = [];
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        
        for (let i = 0; i < 15; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            options.push({ value, label: formattedLabel });
        }
        return options;
    }, []);

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
        } catch {
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

        // Validação obrigatória da categoria
        if (!category) {
            alert('Por favor, selecione uma categoria para o lançamento.');
            return;
        }

        setIsSubmitting(true);
        try {
            const [year, month] = targetMonth.split('-').map(Number);
            const response = await fetch(`/api/cards/${card.cardId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    amount: Math.abs(amount),
                    date,
                    category,
                    installments: paymentType === 'installment' ? installments : 1,
                    sharedWith: sharedUsers.length > 0 ? sharedUsers : null,
                    invoiceMonth: month,
                    invoiceYear: year,
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
            setPaymentType('cash');
            setInstallments(1);

            onClose();
            onTransactionCreated();
        } catch (e) {
            alert('Erro ao criar lançamento. Tente novamente.');
            console.error(e);
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
            formData.append('cardId', card.cardId);

            const response = await fetch(`/api/cards/${card.cardId}/transactions/import`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to import CSV');
            }

            setCsvFile(null);
            onClose();
            onTransactionCreated();
        } catch {
            alert('Erro ao importar CSV. Verifique o formato do arquivo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={`bg-card border-border shadow-lg transition-all duration-300 ${mode === 'multiple' ? 'sm:max-w-6xl' : 'sm:max-w-2xl'}`}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        💳 Novo Lançamento
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-2">
                        Cartão: <span className="font-semibold text-foreground">{card.alias}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 mb-4">
                    <Button
                        type="button"
                        variant={mode === 'single' ? 'default' : 'outline'}
                        onClick={() => setMode('single')}
                        className="flex-1"
                    >
                        ✏️ Individual
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'multiple' ? 'default' : 'outline'}
                        onClick={() => setMode('multiple')}
                        className="flex-1"
                    >
                        📚 Múltiplos
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'csv' ? 'default' : 'outline'}
                        onClick={() => setMode('csv')}
                        className="flex-1"
                    >
                        📄 Importar CSV
                    </Button>
                </div>

                {mode === 'single' && (
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
                            <Label htmlFor="targetMonth" className="text-foreground font-medium">
                                Competência da Fatura
                            </Label>
                            <select
                                id="targetMonth"
                                value={targetMonth}
                                onChange={(e) => setTargetMonth(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {getMonthOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-foreground font-medium">
                                💳 Forma de Pagamento
                            </Label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentType('cash')}
                                    className={`flex-1 py-2 px-4 rounded-lg border font-medium transition-colors ${paymentType === 'cash'
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:bg-muted'
                                        }`}
                                >
                                    💵 À Vista
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentType('installment')}
                                    className={`flex-1 py-2 px-4 rounded-lg border font-medium transition-colors ${paymentType === 'installment'
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:bg-muted'
                                        }`}
                                >
                                    📅 Parcelado
                                </button>
                            </div>

                            {paymentType === 'installment' && (
                                <div className="space-y-2">
                                    <Label htmlFor="installments" className="text-foreground font-medium">
                                        Número de Parcelas
                                    </Label>
                                    <select
                                        id="installments"
                                        value={installments}
                                        onChange={(e) => setInstallments(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>
                                                {num}x {paymentType === 'installment' && amount > 0 &&
                                                    `(R$ ${(amount / num / 100).toFixed(2)} por parcela)`
                                                }
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-foreground font-medium">
                                Categoria *
                            </Label>
                            <select
                                id="category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                required
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
                )}

                {mode === 'multiple' && (
                    <div className="space-y-4">
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-card z-10">
                                    <tr>
                                        <th className="text-left p-2 text-sm font-medium text-muted-foreground w-[25%]">Descrição</th>
                                        <th className="text-left p-2 text-sm font-medium text-muted-foreground w-[15%]">Valor</th>
                                        <th className="text-left p-2 text-sm font-medium text-muted-foreground w-[15%]">Data</th>
                                        <th className="text-left p-2 text-sm font-medium text-muted-foreground w-[20%]">Categoria</th>
                                        <th className="text-left p-2 text-sm font-medium text-muted-foreground w-[15%]">Competência</th>
                                        <th className="text-center p-2 text-sm font-medium text-muted-foreground w-[5%]">👥</th>
                                        <th className="w-[5%]"></th>
                                    </tr>
                                </thead>
                                <tbody className="space-y-2">
                                    {multipleTransactions.map((row) => (
                                        <tr key={row.id} className="group hover:bg-muted/30">
                                            <td className="p-1">
                                                <Input
                                                    value={row.description}
                                                    onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                                                    placeholder="Descrição"
                                                    className="h-9"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <MoneyInput
                                                    value={row.amount === 0 ? '' : (row.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    onValueChange={(val) => handleRowChange(row.id, 'amount', Math.abs(val))}
                                                    allowNegative={false}
                                                    className="h-9"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <Input
                                                    type="date"
                                                    value={row.date}
                                                    onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                                                    className="h-9"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <select
                                                    value={row.category}
                                                    onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                                                    className="w-full h-9 px-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {CATEGORIES.map(cat => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-1">
                                                <select
                                                    value={row.targetMonth}
                                                    onChange={(e) => handleRowChange(row.id, 'targetMonth', e.target.value)}
                                                    className="w-full h-9 px-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    {getMonthOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-1 text-center">
                                                <Button
                                                    type="button"
                                                    variant={row.sharedWith.length > 0 ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setSharingRowId(row.id)}
                                                    className={`h-9 w-9 p-0 ${row.sharedWith.length > 0 ? '' : 'text-muted-foreground hover:text-foreground'}`}
                                                    title={row.sharedWith.length > 0 ? `${row.sharedWith.length} pessoa(s)` : "Compartilhar"}
                                                >
                                                    <Users className="h-4 w-4" />
                                                    {row.sharedWith.length > 0 && (
                                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                                            {row.sharedWith.length}
                                                        </span>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="p-1 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveRow(row.id)}
                                                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddRow}
                                className="border-dashed border-2"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Linha
                            </Button>

                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveMultiple}
                                    disabled={isSubmitting || multipleTransactions.length === 0}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {isSubmitting ? 'Salvando...' : `Salvar ${multipleTransactions.length} Lançamentos`}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {sharingRowId && (
                    <SharedUsersDialog
                        open={!!sharingRowId}
                        onClose={() => setSharingRowId(null)}
                        sharedUsers={multipleTransactions.find(t => t.id === sharingRowId)?.sharedWith || []}
                        onUpdate={(users) => handleRowChange(sharingRowId, 'sharedWith', users)}
                        currentUserId={user?.id}
                    />
                )}

                {mode === 'csv' && (
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
