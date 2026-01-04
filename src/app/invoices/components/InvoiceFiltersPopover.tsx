'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import type { Transaction } from '@/types';
import { MoneyInput } from '@/components/ui/MoneyInput';

export interface FilterState {
    searchQuery: string;
    startDate: string;
    endDate: string;
    minAmount: string;
    maxAmount: string;
    selectedTags: string[];
    selectedCategories: string[];
    minInstallments: string;
    maxInstallments: string;
}

interface InvoiceFiltersPopoverProps {
    onFilterChange: (filters: FilterState) => void;
    activeFilterCount: number;
    transactions: Transaction[];
    showInstallmentFilter?: boolean;
}

export const InvoiceFiltersPopover: React.FC<InvoiceFiltersPopoverProps> = ({
    onFilterChange,
    activeFilterCount,
    transactions,
    showInstallmentFilter = false,
}) => {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        searchQuery: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        selectedTags: [],
        selectedCategories: [],
        minInstallments: '',
        maxInstallments: '',
    });

    // Extract unique tags from all transactions
    const availableTags = React.useMemo(() => {
        const tagsSet = new Set<string>();
        transactions.forEach(t => {
            if (t.tags && Array.isArray(t.tags)) {
                t.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet).sort();
    }, [transactions]);

    // Extract unique categories from all transactions
    const availableCategories = React.useMemo(() => {
        const categoriesSet = new Set<string>();
        transactions.forEach(t => {
            if (t.category) {
                categoriesSet.add(t.category);
            }
        });
        return Array.from(categoriesSet).sort();
    }, [transactions]);

    const handleFilterUpdate = (key: keyof FilterState, value: string | string[]) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleTagToggle = (tag: string) => {
        const newTags = filters.selectedTags.includes(tag)
            ? filters.selectedTags.filter(t => t !== tag)
            : [...filters.selectedTags, tag];
        handleFilterUpdate('selectedTags', newTags);
    };

    const handleCategoryToggle = (category: string) => {
        const newCategories = filters.selectedCategories.includes(category)
            ? filters.selectedCategories.filter(c => c !== category)
            : [...filters.selectedCategories, category];
        handleFilterUpdate('selectedCategories', newCategories);
    };

    const resetFilters = () => {
        const emptyFilters: FilterState = {
            searchQuery: '',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            selectedTags: [],
            selectedCategories: [],
            minInstallments: '',
            maxInstallments: '',
        };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="relative border-border text-foreground hover:bg-muted shadow-sm"
                >
                    🔍 Filtrar
                    {activeFilterCount > 0 && (
                        <Badge 
                            variant="default" 
                            className="ml-2 px-1.5 py-0 text-xs h-5 min-w-5 flex items-center justify-center bg-primary text-primary-foreground"
                        >
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] bg-card border-border shadow-xl" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h4 className="font-semibold text-foreground">🔍 Filtros</h4>
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                🔄 Resetar
                            </Button>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="space-y-2">
                        <Label htmlFor="search" className="text-sm font-medium text-foreground">
                            🔎 Pesquisar
                        </Label>
                        <Input
                            id="search"
                            placeholder="Digite a descrição..."
                            value={filters.searchQuery}
                            onChange={(e) => handleFilterUpdate('searchQuery', e.target.value)}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-sm font-medium text-foreground">
                                📅 Data Inicial
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterUpdate('startDate', e.target.value)}
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-sm font-medium text-foreground">
                                📅 Data Final
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterUpdate('endDate', e.target.value)}
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                    </div>

                    {/* Amount Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="minAmount" className="text-sm font-medium text-foreground">
                                💰 Valor Mínimo
                            </Label>
                            <MoneyInput
                                id="minAmount"
                                placeholder="0,00"
                                value={filters.minAmount}
                                onChange={(value) => handleFilterUpdate('minAmount', value)}
                                className="bg-background border-border text-foreground"
                                currency="R$"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxAmount" className="text-sm font-medium text-foreground">
                                💰 Valor Máximo
                            </Label>
                            <MoneyInput
                                id="maxAmount"
                                placeholder="0,00"
                                value={filters.maxAmount}
                                onChange={(value) => handleFilterUpdate('maxAmount', value)}
                                className="bg-background border-border text-foreground"
                                currency="R$"
                            />
                        </div>
                    </div>

                    {/* Installments Range - Only show if enabled */}
                    {showInstallmentFilter && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="minInstallments" className="text-sm font-medium text-foreground">
                                    📊 Mín. Parcelas
                                </Label>
                                <Input
                                    id="minInstallments"
                                    type="number"
                                    placeholder="1"
                                    value={filters.minInstallments}
                                    onChange={(e) => handleFilterUpdate('minInstallments', e.target.value)}
                                    className="bg-background border-border text-foreground"
                                    min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxInstallments" className="text-sm font-medium text-foreground">
                                    📊 Máx. Parcelas
                                </Label>
                                <Input
                                    id="maxInstallments"
                                    type="number"
                                    placeholder="12"
                                    value={filters.maxInstallments}
                                    onChange={(e) => handleFilterUpdate('maxInstallments', e.target.value)}
                                    className="bg-background border-border text-foreground"
                                    min="1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Categories Multi-select */}
                    {availableCategories.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                📁 Categorias
                            </Label>
                            <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-3 bg-background space-y-2">
                                {availableCategories.map(category => (
                                    <div key={category} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`category-${category}`}
                                            checked={filters.selectedCategories.includes(category)}
                                            onCheckedChange={() => handleCategoryToggle(category)}
                                        />
                                        <Label
                                            htmlFor={`category-${category}`}
                                            className="text-sm font-normal cursor-pointer text-foreground"
                                        >
                                            {category}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags Multi-select */}
                    {availableTags.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                🏷️ Tags
                            </Label>
                            <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-3 bg-background space-y-2">
                                {availableTags.map(tag => (
                                    <div key={tag} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`tag-${tag}`}
                                            checked={filters.selectedTags.includes(tag)}
                                            onCheckedChange={() => handleTagToggle(tag)}
                                        />
                                        <Label
                                            htmlFor={`tag-${tag}`}
                                            className="text-sm font-normal cursor-pointer text-foreground"
                                        >
                                            {tag}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
