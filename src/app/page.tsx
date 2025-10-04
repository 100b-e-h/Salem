'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();

  // If no user is authenticated, show welcome screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Salem</h1>
            <p className="text-muted-foreground">
              Sistema de controle financeiro pessoal
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça login para acessar suas finanças
            </p>
            <p className="text-xs text-muted-foreground">
              O sistema de autenticação será ativado automaticamente quando necessário.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const dashboardData = {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    creditCardDebt: 0,
    investments: 0,
    investmentGrowth: 0,
  };

  const upcomingBills: Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
    type: string;
  }> = [];

  const recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  }> = [];

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
        return <Badge>Assinatura</Badge>;
      case 'parcelada':
        return <Badge>Parcelada</Badge>;
      default:
        return <Badge>{type}</Badge>;
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
        <Card className="text-center h-50 md:grid-cols-3">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Saldo Total</h3>
          <div className="text-2xl mb-2">💰</div>
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
