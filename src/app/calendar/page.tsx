'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { formatDate, formatCurrency } from '@/utils/financial';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
    id: string;
    date: Date;
    type: 'recorrente' | 'assinatura' | 'parcela' | 'vencimento';
    description: string;
    amount: number;
    vendor?: string;
    status: 'previsto' | 'lancado' | 'pago';
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    const events: CalendarEvent[] = [];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = addDays(monthStart, -getDay(monthStart));
    const calendarEnd = addDays(monthEnd, 6 - getDay(monthEnd));

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const getEventsForDate = (date: Date) => {
        return events.filter(event =>
            format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
    };

    const getEventIcon = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'recorrente': return '⚙️';
            case 'assinatura': return '♻️';
            case 'parcela': return '#️⃣';
            case 'vencimento': return '📅';
            default: return '📝';
        }
    };

    const getEventColor = (type: CalendarEvent['type'], status: CalendarEvent['status']) => {
        if (status === 'pago') return 'bg-green-100 text-green-800';
        if (status === 'lancado') return 'bg-blue-100 text-blue-800';

        switch (type) {
            case 'recorrente': return 'bg-purple-100 text-purple-800';
            case 'assinatura': return 'bg-orange-100 text-orange-800';
            case 'parcela': return 'bg-indigo-100 text-indigo-800';
            case 'vencimento': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTotalForDate = (date: Date) => {
        const dayEvents = getEventsForDate(date);
        return dayEvents.reduce((total, event) => total + event.amount, 0);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    };

    const isToday = (date: Date) => {
        return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    };

    const isCurrentMonth = (date: Date) => {
        return format(date, 'MM-yyyy') === format(currentDate, 'MM-yyyy');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Calendário</h1>
                    <p className="text-gray-600 mt-2">
                        Visualize seus compromissos financeiros ao longo do tempo
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={viewMode === 'month' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('month')}
                        >
                            Mês
                        </Button>
                        <Button
                            variant={viewMode === 'week' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('week')}
                        >
                            Semana
                        </Button>
                    </div>
                    <Button>
                        <span className="mr-2">+</span>
                        Novo Evento
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendário */}
                <div className="lg:col-span-3">
                    <Card>
                        {/* Header do calendário */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                                    ←
                                </Button>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                                </h2>
                                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                                    →
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                                Hoje
                            </Button>
                        </div>

                        {/* Dias da semana */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grade do calendário */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((date, index) => {
                                const dayEvents = getEventsForDate(date);
                                const dailyTotal = getTotalForDate(date);

                                return (
                                    <div
                                        key={index}
                                        className={`
                      min-h-24 p-2 border border-gray-200 rounded-lg
                      ${isCurrentMonth(date) ? 'bg-white' : 'bg-gray-50'}
                      ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                      hover:bg-blue-50 cursor-pointer transition-colors
                    `}
                                    >
                                        <div className={`
                      text-sm font-medium mb-1
                      ${isCurrentMonth(date) ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday(date) ? 'text-blue-600' : ''}
                    `}>
                                            {format(date, 'd')}
                                        </div>

                                        {/* Eventos do dia */}
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 2).map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={`
                            text-xs px-1 py-0.5 rounded truncate
                            ${getEventColor(event.type, event.status)}
                          `}
                                                    title={`${event.description} - ${formatCurrency(event.amount)}`}
                                                >
                                                    <span className="mr-1">{getEventIcon(event.type)}</span>
                                                    {event.description}
                                                </div>
                                            ))}

                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-gray-500 px-1">
                                                    +{dayEvents.length - 2} mais
                                                </div>
                                            )}
                                        </div>

                                        {/* Total do dia */}
                                        {dailyTotal > 0 && (
                                            <div className="text-xs text-red-600 font-medium mt-1 truncate">
                                                <CurrencyDisplay amount={dailyTotal} size="sm" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Resumo do mês */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Resumo do Mês
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total de compromissos:</span>
                                <span className="font-medium">{events.length}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Valor total:</span>
                                <CurrencyDisplay
                                    amount={events.reduce((sum, event) => sum + event.amount, 0)}
                                    variant="negative"
                                />
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Pagos:</span>
                                <span className="text-green-600 font-medium">
                                    {events.filter(e => e.status === 'pago').length}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Pendentes:</span>
                                <span className="text-orange-600 font-medium">
                                    {events.filter(e => e.status === 'previsto').length}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Próximos eventos */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Próximos 7 dias
                        </h3>

                        <div className="space-y-3">
                            {events
                                .filter(event => event.date >= new Date() && event.date <= addDays(new Date(), 7))
                                .sort((a, b) => a.date.getTime() - b.date.getTime())
                                .map((event) => (
                                    <div key={event.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">{getEventIcon(event.type)}</span>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {event.description}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(event.date, 'dd/MM')}
                                                </p>
                                            </div>
                                        </div>
                                        <CurrencyDisplay amount={event.amount} size="sm" variant="negative" />
                                    </div>
                                ))}

                            {events.filter(event => event.date >= new Date() && event.date <= addDays(new Date(), 7)).length === 0 && (
                                <p className="text-gray-500 text-sm text-center py-4">
                                    Nenhum compromisso nos próximos 7 dias
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Legenda */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Legenda
                        </h3>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">⚙️</span>
                                <span className="text-sm text-gray-600">Recorrente</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">♻️</span>
                                <span className="text-sm text-gray-600">Assinatura</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">#️⃣</span>
                                <span className="text-sm text-gray-600">Parcela</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">📅</span>
                                <span className="text-sm text-gray-600">Vencimento</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
