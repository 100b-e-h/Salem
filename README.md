# Salem - Sistema de Controle Financeiro Pessoal

🔮 **Salem** é um sistema pessoal de controle financeiro com foco em três tipos de compromissos: **recorrentes**, **parcelados** e **assinaturas**, além de um módulo de rendimentos com capitalização diária.

## 📋 Visão Geral

O Salem foi desenvolvido para prever e acompanhar compromissos financeiros que **ainda vão ser registrados no cartão**, permitindo um controle detalhado de:

- ✅ **Recorrentes** (aluguel, contas fixas)
- ♻️ **Assinaturas** (Netflix, Spotify, etc.)
- #️⃣ **Parceladas** (compras divididas em várias vezes)
- 📈 **Rendimentos** com capitalização diária
- 💳 **Faturas** e limites de cartão
- 📅 **Calendário** de compromissos futuros

## 🚀 Tecnologias Utilizadas

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Data:** Sistema mock em memória (para desenvolvimento)
- **Date Manipulation:** date-fns
- **Icons:** Lucide React
- **Dev Tools:** ESLint, Turbopack

## 📦 Instalação

1. **Clone o repositório:**

   ```bash
   git clone <url-do-repositorio>
   cd salem
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
   ```
   http://localhost:3000
   ```

## 🏗️ Estrutura do Projeto

```
salem/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── accounts/          # Página de contas
│   │   ├── calendar/          # Calendário financeiro
│   │   ├── cards/             # Gerenciamento de cartões
│   │   ├── installments/      # Compras parceladas
│   │   ├── invoices/          # Faturas de cartão
│   │   ├── subscriptions/     # Assinaturas e recorrentes
│   │   ├── globals.css        # Estilos globais
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página inicial (Dashboard)
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes de UI reutilizáveis
│   │   ├── Dashboard.tsx      # Dashboard principal
│   │   └── Header.tsx         # Navegação principal
│   ├── lib/                   # Bibliotecas e configurações
│   │   └── database.ts        # Sistema de dados mock
│   ├── types/                 # Definições TypeScript
│   │   └── index.ts           # Tipos principais
│   └── utils/                 # Utilitários
│       └── financial.ts      # Funções de cálculo financeiro
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🎯 Funcionalidades Implementadas

### 📊 Dashboard

- Visão geral do saldo total
- Fatura atual e próxima fatura
- Rendimento mensal
- Próximos compromissos (7 dias)
- Ações rápidas para criar novos itens

### 🏦 Contas

- Listagem de todas as contas
- Saldos atualizados
- Categorização por tipo (corrente, poupança, carteira, corretora)
- Resumo financeiro

### 💳 Cartões

- Gerenciamento de cartões de crédito
- Visualização de limite usado/disponível
- Faturas atuais e futuras
- Indicadores visuais de uso do limite

### 📄 Faturas

- Detalhamento por cartão e competência
- Status: prevista, fechada, paga
- Informações de vencimento
- Histórico mensal

### #️⃣ Parceladas

- Acompanhamento de compras parceladas
- Barra de progresso visual
- Cálculo de valores restantes
- Opção de antecipação (futura)

### ♻️ Assinaturas

- Gerenciamento de assinaturas ativas
- Histórico de mudanças de preço
- Próximas cobranças
- Status: ativa, pausada, cancelada

### 📅 Calendário

- Visão mensal dos compromissos
- Diferentes tipos de eventos (recorrente, assinatura, parcela)
- Totais por dia
- Navegação entre meses

## 🔧 Funcionalidades Técnicas

### 💰 Cálculos Financeiros

- Capitalização composta para rendimentos
- Conversão de taxa anual para diária
- Cálculo de parcelas com/sem juros
- Distribuição de centavos nas parcelas
- Competência de faturas baseada em fechamento

### 📊 Utilitários

- Formatação de moeda (BRL)
- Formatação de datas (pt-BR)
- Formatação de porcentagens
- Agrupamento de transações por período

### 🎨 Componentes UI

- **Card:** Container reutilizável
- **Button:** Botão com variantes
- **Badge:** Indicadores de status
- **CurrencyDisplay:** Formatação de valores monetários

## 🗃️ Modelo de Dados

### Entidades Principais:

- **Account:** Contas bancárias e carteiras
- **Card:** Cartões de crédito
- **Invoice:** Faturas de cartão
- **Transaction:** Transações financeiras
- **Recurrence:** Compromissos recorrentes
- **Subscription:** Assinaturas (especialização de recorrência)
- **Installment:** Compras parceladas
- **Asset:** Ativos que rendem
- **Category:** Categorias de transações

## 🎯 Próximos Passos (Roadmap)

### MVP Concluído ✅

- [x] Dashboard principal
- [x] Gerenciamento de contas e cartões
- [x] Faturas com previsões
- [x] Compras parceladas
- [x] Assinaturas
- [x] Calendário de compromissos
- [x] Interface responsiva

### V1 (Próximas Features)

- [ ] Sistema de rendimentos com capitalização diária
- [ ] Transações manuais e conciliação
- [ ] Recorrências com RRULE
- [ ] Importação de extratos CSV
- [ ] Antecipação de parcelas
- [ ] Alertas e notificações
- [ ] Relatórios avançados

### V2 (Futuro)

- [ ] Banco de dados real (PostgreSQL)
- [ ] PWA com funcionamento offline
- [ ] Integrações bancárias
- [ ] Multi-usuário
- [ ] Metas e objetivos financeiros

## 🤝 Contribuição

Este é um projeto pessoal desenvolvido para atender necessidades específicas de controle financeiro. Sugestões e melhorias são bem-vindas!

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para controle financeiro pessoal inteligente**
