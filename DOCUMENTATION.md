# Salem - Sistema de Controle Financeiro

![Status](https://img.shields.io/badge/Status-MVP_Completo-green)
![Framework](https://img.shields.io/badge/Framework-Next.js_15-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)

Sistema de controle financeiro pessoal desenvolvido em **Next.js 15** com **React 19** e **TypeScript**, com foco em gerenciamento de assinaturas, parcelados e recorrências.

## 📋 Visão Geral

**Salem** é um sistema completo de controle financeiro que permite:

- 📊 **Dashboard** - Visão geral dos gastos e receitas
- 🏦 **Contas Bancárias** - Gerenciamento de contas e saldos
- 💳 **Cartões de Crédito** - Controle de cartões e limites
- 📄 **Faturas** - Acompanhamento de faturas de cartão
- #️⃣ **Parceladas** - Controle de compras parceladas
- ♻️ **Assinaturas** - Gestão de serviços recorrentes
- ⚙️ **Recorrências** - Operações financeiras automáticas
- 📈 **Rendimentos** - Acompanhamento de investimentos
- 📅 **Calendário** - Visualização temporal dos eventos financeiros
- 📋 **Relatórios** - Análises e extratos detalhados

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Clone ou acesse o projeto:**

   ```bash
   cd "c:\Users\SEJUSP\Desktop\Projetos\salem"
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   - URL: http://localhost:3001
   - Porta alternativa será usada se 3000 estiver ocupada

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend:** Next.js 15 (App Router) + React 19
- **Tipagem:** TypeScript 5+
- **Estilização:** Tailwind CSS 4
- **Ícones:** Lucide React
- **Datas:** date-fns
- **Build:** Turbopack (desenvolvimento)

### Estrutura do Projeto

```
salem/
├── src/
│   ├── app/                    # Páginas (App Router)
│   │   ├── page.tsx           # Dashboard
│   │   ├── accounts/          # Contas bancárias
│   │   ├── cards/             # Cartões de crédito
│   │   ├── invoices/          # Faturas
│   │   ├── installments/      # Parceladas
│   │   ├── subscriptions/     # Assinaturas
│   │   ├── recurrences/       # Recorrências
│   │   ├── assets/            # Rendimentos
│   │   ├── calendar/          # Calendário
│   │   └── reports/           # Relatórios
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # Componentes base (Card, Button, etc.)
│   │   └── Header.tsx        # Navegação principal
│   ├── lib/                   # Utilitários e configurações
│   │   └── database.ts       # Sistema de dados mock
│   ├── types/                 # Definições TypeScript
│   │   └── index.ts          # Tipos principais
│   └── utils/                 # Funções auxiliares
│       └── financial.ts      # Cálculos financeiros
├── public/                    # Arquivos estáticos
└── package.json              # Dependências e scripts
```

## 📦 Componentes Principais

### Sistema de Tipos (`types/index.ts`)

Define interfaces TypeScript para todas as entidades:

- `Account` - Contas bancárias
- `Card` - Cartões de crédito
- `Invoice` - Faturas
- `Transaction` - Transações
- `Installment` - Parcelamentos
- `Subscription` - Assinaturas
- `Recurrence` - Recorrências
- `Asset` - Investimentos/rendimentos

### Sistema de Dados (`lib/database.ts`)

Mock database com operações CRUD:

```typescript
// Exemplos de uso
const accounts = await database.getAccounts();
await database.createTransaction(newTransaction);
const cards = await database.getCards();
```

### Utilitários Financeiros (`utils/financial.ts`)

Funções para cálculos financeiros:

```typescript
// Formatação de moeda
formatCurrency(1500.5); // "R$ 1.500,50"

// Cálculo de juros compostos
calculateCompoundReturn(1000, 0.12, 12); // Rendimento anual

// Parcelamento
calculateInstallments(5000, 12, 2.5); // 12x com juros
```

### Componentes UI (`components/ui/`)

Sistema de design personalizado:

- **Card** - Container base com variações
- **Button** - Botões com diferentes estilos
- **Badge** - Labels coloridos para status
- **CurrencyDisplay** - Formatação consistente de valores

## 🎨 Design System

### Cores Principais

- **Primária:** Blue (600-700) - Ações principais
- **Sucesso:** Green (600) - Valores positivos/ativos
- **Alerta:** Yellow (600) - Avisos importantes
- **Perigo:** Red (600) - Valores negativos/críticos
- **Neutra:** Gray (50-900) - Textos e fundos

### Tipografia

- **Fonte Principal:** Geist Sans (variável)
- **Fonte Código:** Geist Mono (variável)
- **Escalas:** text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

## 📊 Funcionalidades

### Dashboard

- Resumo financeiro consolidado
- Gastos por categoria
- Próximos vencimentos
- Gráficos de evolução

### Gestão de Contas

- CRUD completo de contas bancárias
- Controle de saldos
- Histórico de movimentações
- Reconciliação

### Cartões de Crédito

- Gestão de múltiplos cartões
- Controle de limites
- Fechamento automático de faturas
- Alertas de vencimento

### Parcelamentos

- Acompanhamento de compras parceladas
- Cálculo automático de juros
- Projeção de pagamentos
- Quitação antecipada

### Assinaturas

- Controle de serviços recorrentes
- Alertas de renovação
- Análise de custos
- Cancelamento/pausa

### Investimentos

- Acompanhamento de rendimentos
- Diferentes tipos de ativos
- Cálculo de rentabilidade
- Projeções futuras

## 🔧 Personalização

### Adicionando Nova Funcionalidade

1. **Definir tipos** em `src/types/index.ts`
2. **Criar página** em `src/app/nova-funcionalidade/`
3. **Adicionar ao banco** em `src/lib/database.ts`
4. **Incluir na navegação** em `src/components/Header.tsx`

### Customizando Estilos

O projeto usa **Tailwind CSS**. Para personalizar:

1. Edite `tailwind.config.ts`
2. Modifique `src/app/globals.css`
3. Atualize componentes em `src/components/ui/`

## 📝 Dados de Demonstração

O sistema inclui dados fictícios para demonstração:

- 4 contas bancárias de exemplo
- 3 cartões de crédito
- 15+ transações diversas
- 8 assinaturas ativas
- 5 parcelamentos em andamento
- Múltiplos investimentos

## 🔮 Roadmap

### Versão Atual (MVP)

- ✅ Interface completa
- ✅ Navegação funcional
- ✅ Dados mock
- ✅ Cálculos financeiros
- ✅ Design responsivo

### Próximas Versões

**V1.0 - Banco de Dados Real**

- Integração com PostgreSQL/SQLite
- Sistema de autenticação
- Backup e sincronização

**V2.0 - Funcionalidades Avançadas**

- Integração bancária (Open Banking)
- Importação de extratos
- Inteligência artificial para categorização
- Relatórios avançados
- App mobile

**V3.0 - Recursos Premium**

- Planejamento financeiro
- Metas e objetivos
- Análise preditiva
- Consultoria automatizada

## 🤝 Contribuição

Para contribuir com o projeto:

1. **Reporte bugs** através de issues
2. **Sugira melhorias** com detalhamento
3. **Submeta PRs** seguindo os padrões
4. **Documente** novas funcionalidades

## 📄 Licença

Este projeto está em desenvolvimento para uso pessoal.

---

**Salem** © 2024 - Sistema de Controle Financeiro Pessoal

_"Organize suas finanças com a precisão de um feitiço bem executado"_ 🔮
