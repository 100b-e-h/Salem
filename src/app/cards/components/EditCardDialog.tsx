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
import { Card as CardType } from '@/types';

interface EditCardDialogProps {
    open: boolean;
    onClose: () => void;
    card: CardType;
    onCardUpdated: () => void;
}

export function EditCardDialog({ open, onClose, card, onCardUpdated }: EditCardDialogProps) {
    const [alias, setAlias] = useState(card.alias);
    const [brand, setBrand] = useState(card.brand);
    const [totalLimit, setTotalLimit] = useState<number>(card.totalLimit);
    const [closingDay, setClosingDay] = useState<number>(card.closingDay);
    const [dueDay, setDueDay] = useState<number>(card.dueDay);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/cards/${card.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias, brand, totalLimit, closingDay, dueDay }),
            });
            if (!response.ok) throw new Error('Erro ao atualizar cartão');
            onClose();
            onCardUpdated();
        } catch {
            alert('Erro ao atualizar cartão');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Cartão</DialogTitle>
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
                            initialCentavos={totalLimit}
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
