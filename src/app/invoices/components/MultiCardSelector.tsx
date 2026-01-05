'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card as CardType } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface MultiCardSelectorProps {
    cards: CardType[];
    selectedCardIds: string[];
    onSelectionChange: (cardIds: string[]) => void;
}

export function MultiCardSelector({ cards, selectedCardIds, onSelectionChange }: MultiCardSelectorProps) {
    const [open, setOpen] = useState(false);

    const handleToggleCard = (cardId: string) => {
        if (selectedCardIds.includes(cardId)) {
            onSelectionChange(selectedCardIds.filter(id => id !== cardId));
        } else {
            onSelectionChange([...selectedCardIds, cardId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedCardIds.length === cards.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(cards.map(c => c.cardId));
        }
    };

    const getDisplayText = () => {
        if (selectedCardIds.length === 0) {
            return 'Selecione os cartões...';
        }
        if (selectedCardIds.length === cards.length) {
            return '🌐 Todos os Cartões';
        }
        if (selectedCardIds.length === 1) {
            const card = cards.find(c => c.cardId === selectedCardIds[0]);
            return card ? `${card.alias}` : 'Selecione os cartões...';
        }
        return `${selectedCardIds.length} cartões selecionados`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-between px-4 py-3 h-auto border-border bg-background text-foreground hover:bg-muted/50 shadow-sm"
                >
                    <span className="flex items-center gap-2">
                        💳 {getDisplayText()}
                    </span>
                    <span className="ml-2">▼</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-card border-border shadow-lg" align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                        <h4 className="font-semibold text-foreground">Selecionar Cartões</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-8 px-2 text-xs"
                        >
                            {selectedCardIds.length === cards.length ? '🔲 Limpar' : '☑️ Todos'}
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {cards.map((card) => {
                            const isSelected = selectedCardIds.includes(card.cardId);
                            return (
                                <label
                                    key={card.cardId}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleCard(card.cardId)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-foreground">{card.alias}</div>
                                        <div className="text-xs text-muted-foreground">{card.brand}</div>
                                    </div>
                                    {isSelected && (
                                        <Badge variant="default" className="bg-primary text-primary-foreground">
                                            ✓
                                        </Badge>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                            {selectedCardIds.length === 0
                                ? 'Nenhum cartão selecionado'
                                : `${selectedCardIds.length} de ${cards.length} selecionado${selectedCardIds.length > 1 ? 's' : ''}`}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
