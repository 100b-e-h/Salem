import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { useAuth } from '@/components/AuthProvider';

interface NewCardDialogProps {
    open: boolean;
    onClose: () => void;
    onCardCreated: () => void;
}

export function NewCardDialog({ open, onClose, onCardCreated }: NewCardDialogProps) {
    const { user } = useAuth();
    const [alias, setAlias] = useState('');
    const [brand, setBrand] = useState('');
    const [totalLimit, setTotalLimit] = useState<number>(0); // Valor em centavos
    const [closingDay, setClosingDay] = useState<number>(1);
    const [dueDay, setDueDay] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    alias,
                    brand,
                    totalLimit,
                    closingDay,
                    dueDay,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create card');
            }

            // Reset form
            setAlias('');
            setBrand('');
            setTotalLimit(0);
            setClosingDay(1);
            setDueDay(1);

            // Close dialog and refresh data
            onClose();
            onCardCreated();
        } catch (error) {
            console.error('Erro ao criar cartão:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Novo Cartão</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="alias">Apelido</Label>
                        <Input
                            id="alias"
                            type="text"
                            value={alias}
                            onChange={e => setAlias(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brand">Bandeira</Label>
                        <Input
                            id="brand"
                            type="text"
                            value={brand}
                            onChange={e => setBrand(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="totalLimit">Limite Total</Label>
                        <MoneyInput
                            id="totalLimit"
                            onValueChange={setTotalLimit}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="closingDay">Dia de Fechamento</Label>
                        <Input
                            id="closingDay"
                            type="number"
                            value={closingDay}
                            onChange={e => setClosingDay(Number(e.target.value))}
                            min={1}
                            max={31}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dueDay">Dia de Vencimento</Label>
                        <Input
                            id="dueDay"
                            type="number"
                            value={dueDay}
                            onChange={e => setDueDay(Number(e.target.value))}
                            min={1}
                            max={31}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}