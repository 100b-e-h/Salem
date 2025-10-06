'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

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

  const reportData = {
    income: 0,
    expenses: 0,
    savings: 0,
    investments: 0,
    creditUsed: 0,
    creditLimit: 0
  };

  const categoryExpenses: Array<{
    name: string;
    amount: number;
    percentage: number;
    icon: string;
  }> = [];

  const monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }> = [];

  const upcomingCommitments: Array<{
    date: Date;
    description: string;
    amount: number;
    type: string;
  }> = [];

  const getPeriodOptions = () => [
    { value: 'current-month', label: 'Mês Atual' },
    { value: 'last-month', label: 'Mês Anterior' },
    { value: 'last-3-months', label: 'Últimos 3 Meses' },
    { value: 'current-year', label: 'Ano Atual' },
    { value: 'custom', label: 'Período Personalizado' }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assinatura': return '♻️';
      case 'parcela': return '#️⃣';
      case 'fatura': return '�';
      default: return '�';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Análise detalhada das suas finanças e tendências
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          >
            {getPeriodOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            📊 Exportar PDF
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="text-center bg-card shadow-md hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">💰</div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Receitas</h3>
          <CurrencyDisplay amount={reportData.income} size="lg" variant="positive" />
        </Card>

        <Card className="text-center bg-card shadow-md hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">💸</div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Despesas</h3>
          <CurrencyDisplay amount={reportData.expenses} size="lg" variant="negative" />
        </Card>

        <Card className="text-center bg-card shadow-md hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">📈</div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Economia</h3>
          <CurrencyDisplay
            amount={reportData.income - reportData.expenses}
            size="lg"
            variant="positive"
          />
        </Card>

        <Card className="text-center bg-card shadow-md hover:shadow-lg transition-shadow">
          <div className="text-2xl mb-2">💳</div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Crédito Usado</h3>
          <div className="space-y-1">
            <CurrencyDisplay amount={reportData.creditUsed} size="lg" variant="negative" />
            <div className="text-xs text-muted-foreground">
              {((reportData.creditUsed / reportData.creditLimit) * 100).toFixed(0)}% do limite
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gastos por Categoria */}
        <Card className="bg-card shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Gastos por Categoria
            </h2>
            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted">
              Ver Detalhes
            </Button>
          </div>

          <div className="space-y-4">
            {categoryExpenses.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {category.name}
                      </span>
                      <CurrencyDisplay amount={category.amount} size="sm" variant="negative" />
                    </div>
                    <div className="bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground min-w-12 text-right">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between text-sm font-medium text-foreground">
              <span>Total:</span>
              <CurrencyDisplay amount={reportData.expenses} variant="negative" />
            </div>
          </div>
        </Card>

        {/* Tendência Mensal */}
        <Card className="bg-card shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Tendência dos Últimos Meses
            </h2>
            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted">
              Gráfico
            </Button>
          </div>

          <div className="space-y-4">
            {monthlyTrend.map((month, index) => (
              <div key={index} className="border border-border rounded-lg p-4 bg-background">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-foreground">{month.month}/2025</h3>
                  <Badge variant={month.savings > 2000 ? 'default' : 'secondary'}>
                    {month.savings > 2000 ? 'Positivo' : 'Atenção'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Receitas</span>
                    <CurrencyDisplay amount={month.income} size="sm" variant="positive" />
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Despesas</span>
                    <CurrencyDisplay amount={month.expenses} size="sm" variant="negative" />
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Economia</span>
                    <CurrencyDisplay amount={month.savings} size="sm" variant="neutral" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Próximos Compromissos */}
        <Card className="bg-card shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Próximos Compromissos
            </h2>
            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted">
              Ver Calendário
            </Button>
          </div>

          <div className="space-y-3">
            {upcomingCommitments.map((commitment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getTypeIcon(commitment.type)}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {commitment.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat('pt-BR').format(commitment.date)}
                    </p>
                  </div>
                </div>
                <CurrencyDisplay amount={commitment.amount} size="sm" variant="negative" />
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-foreground">Total próximos 30 dias:</span>
              <CurrencyDisplay
                amount={upcomingCommitments.reduce((sum, c) => sum + c.amount, 0)}
                variant="negative"
              />
            </div>
          </div>
        </Card>

        {/* Metas e Objetivos */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Metas do Mês
            </h2>
            <Button variant="outline" size="sm">
              Configurar
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Meta de Economia</span>
                <span className="font-medium text-foreground">
                  <CurrencyDisplay amount={2249.25} size="sm" /> / <CurrencyDisplay amount={2500.00} size="sm" />
                </span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: '90%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">90% da meta alcançada</div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Limite de Gastos</span>
                <span className="font-medium text-foreground">
                  <CurrencyDisplay amount={3250.75} size="sm" /> / <CurrencyDisplay amount={3500.00} size="sm" />
                </span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: '93%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">93% do limite usado</div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Investimentos</span>
                <span className="font-medium text-foreground">
                  <CurrencyDisplay amount={850.00} size="sm" /> / <CurrencyDisplay amount={1000.00} size="sm" />
                </span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '85%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">85% da meta de investimento</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          💡 Insights e Recomendações
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <h3 className="font-medium text-green-900">Parabéns!</h3>
            </div>
            <p className="text-sm text-green-800">
              Você está 10% acima da sua meta de economia este mês.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <h3 className="font-medium text-yellow-900">Atenção</h3>
            </div>
            <p className="text-sm text-yellow-800">
              Gastos com alimentação aumentaram 15% comparado ao mês anterior.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600">💡</span>
              <h3 className="font-medium text-blue-900">Dica</h3>
            </div>
            <p className="text-sm text-blue-800">
              Considere antecipar algumas parcelas para reduzir juros futuros.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
