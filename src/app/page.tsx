// Dashboard principal do Salem

'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  // Dados simulados para o dashboard
  const dashboardData = {
    totalBalance: 45230.75,
    monthlyIncome: 8500.00,
    monthlyExpenses: -6750.80,
    savings: 1749.20,
    creditCardDebt: -2340.50,
    investments: 25000.00,
    investmentGrowth: 450.30,
  };

  const upcomingBills = [
    { id: '1', name: 'Aluguel', amount: 1800.00, date: '2024-12-05', type: 'recorrente' },
    { id: '2', name: 'Netflix', amount: 45.90, date: '2024-12-07', type: 'assinatura' },
    { id: '3', name: 'Celular Samsung (6/12)', amount: 245.50, date: '2024-12-10', type: 'parcelada' },
    { id: '4', name: 'Energia Elétrica', amount: 320.75, date: '2024-12-15', type: 'recorrente' },
    { id: '5', name: 'Spotify', amount: 21.90, date: '2024-12-18', type: 'assinatura' },
  ];

  const recentTransactions = [
    { id: '1', description: 'Supermercado Extra', amount: -256.80, date: '2024-12-01', category: 'Alimentação' },
    { id: '2', description: 'Salário', amount: 8500.00, date: '2024-12-01', category: 'Renda' },
    { id: '3', description: 'Uber', amount: -28.50, date: '2024-11-30', category: 'Transporte' },
    { id: '4', description: 'Farmácia', amount: -85.60, date: '2024-11-29', category: 'Saúde' },
    { id: '5', description: 'Dividendos ITUB4', amount: 125.30, date: '2024-11-28', category: 'Investimentos' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recorrente': return '⚙️';
      case 'assinatura': return '♻️';
      case 'parcelada': return '#️⃣';
      default: return '📋';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'recorrente':
        return <Badge variant="default">Recorrente</Badge>;
      case 'assinatura':
        return <Badge variant="warning">Assinatura</Badge>;
      case 'parcelada':
        return <Badge variant="info">Parcelada</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Alimentação': return '🍽️';
      case 'Transporte': return '🚗';
      case 'Saúde': return '🏥';
      case 'Renda': return '💰';
      case 'Investimentos': return '📈';
      default: return '💳';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral das suas finanças - {new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(new Date())}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <div className="text-2xl mb-2">💰</div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo Total</h3>
          <CurrencyDisplay amount={dashboardData.totalBalance} size="lg" variant="positive" />
        </Card>

        <Card className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Resultado do Mês</h3>
          <CurrencyDisplay
            amount={dashboardData.monthlyIncome + dashboardData.monthlyExpenses}
            size="lg"
            variant={dashboardData.monthlyIncome + dashboardData.monthlyExpenses > 0 ? "positive" : "negative"}
            showSign
          />
        </Card>

        <Card className="text-center">
          <div className="text-2xl mb-2">💳</div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Dívida Cartão</h3>
          <CurrencyDisplay amount={Math.abs(dashboardData.creditCardDebt)} size="lg" variant="negative" />
        </Card>

        <Card className="text-center">
          <div className="text-2xl mb-2">📈</div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Investimentos</h3>
          <CurrencyDisplay amount={dashboardData.investments} size="lg" variant="positive" />
          <div className="text-sm text-green-600 mt-1">
            <CurrencyDisplay amount={dashboardData.investmentGrowth} size="sm" variant="positive" showSign />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos compromissos */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Próximos Compromissos
              </h2>
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getTypeIcon(bill.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{bill.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeBadge(bill.type)}
                        <span className="text-sm text-gray-500">
                          {new Intl.DateTimeFormat('pt-BR').format(new Date(bill.date))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CurrencyDisplay amount={bill.amount} variant="negative" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fluxo de caixa */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fluxo de Caixa
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">💰 Receitas</span>
                <CurrencyDisplay amount={dashboardData.monthlyIncome} variant="positive" />
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">💸 Despesas</span>
                <CurrencyDisplay amount={Math.abs(dashboardData.monthlyExpenses)} variant="negative" />
              </div>

              <hr className="my-3" />

              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">💎 Sobrou</span>
                <CurrencyDisplay
                  amount={dashboardData.monthlyIncome + dashboardData.monthlyExpenses}
                  variant={dashboardData.monthlyIncome + dashboardData.monthlyExpenses > 0 ? "positive" : "negative"}
                  showSign
                />
              </div>
            </div>
          </Card>

          {/* Transações recentes */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transações Recentes
            </h3>

            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{getCategoryIcon(transaction.category)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat('pt-BR').format(new Date(transaction.date))}
                      </div>
                    </div>
                  </div>
                  <CurrencyDisplay
                    amount={Math.abs(transaction.amount)}
                    variant={transaction.amount > 0 ? "positive" : "negative"}
                    size="sm"
                    showSign={transaction.amount < 0}
                  />
                </div>
              ))}
            </div>

            <Button variant="ghost" size="sm" className="w-full mt-4">
              Ver todas as transações
            </Button>
          </Card>

          {/* Ações rápidas */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h3>

            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                💳 Nova Transação
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                ♻️ Nova Assinatura
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                #️⃣ Nova Parcelada
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                📊 Relatório Mensal
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
