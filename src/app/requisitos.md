# Visão geral

O **Salem** é um sistema pessoal de controle financeiro com foco em três tipos de compromissos: **recorrentes**, **parcelados** e **futuros/assinaturas**, além de um **módulo de rendimentos com capitalização diária**. O objetivo é prever e acompanhar o que **ainda vai ser registrado no cartão**, quando isso acontecerá, e mensurar **rendimentos diários** de aplicações.

> **Notas de escopo**
>
> - Usuária única (multi-conta bancária e multi-cartão).
> - Moeda padrão: BRL.
> - Fuso: **America/Rio_Branco (UTC−5)**.
> - Integrações com bancos/feeds são opcionais; o sistema deve funcionar 100% manualmente.

---

# Entidades e dados principais

## 1) Contas e cartões

- **Conta** {id, nome, tipo: \[corrente, poupança, carteira, corretora], saldo_atual, moeda}
- **Cartão** {id, apelido, bandeira, limite_total, fechamento_dia, vencimento_dia, fatura_atual_id}
- **Fatura** {id, cartao_id, competencia (AAAA-MM), status: \[prevista, fechada, paga], total_previsto, total_fechado, total_pago}

## 2) Categorias e tags

- **Categoria** {id, nome, tipo: \[despesa, receita]}
- **Tag** livre para filtros (ex.: "casa", "trabalho").

## 3) Lançamentos (base)

- **Transação** {id, data, conta_origem?, conta_destino?, cartao_id?, fatura_id?, tipo: \[despesa, receita, transferencia], valor, categoria_id, tags\[], descricao, conciliada: bool}

## 4) Regras de recorrência/parcelas/assinaturas

- **Recorrência** {id, tipo: \[fixa, assinatura], origem: \[conta, cartao], valor, indexacao?: \[fixo, reajuste%], rrule (RRULE iCal), proxima_data, fim_opcional, status: \[ativa, pausada, cancelada], fornecedor}
- **Assinatura** (especialização de recorrência) {id, cartao_id?, dia_cobranca, valor_atual, historico_precos\[], tentativa_na_fatura?: bool}
- **Compra parcelada** {id, cartao_id, data_compra, valor_total, n_parcelas, juros_ao_mes?, primeira_parcela_data, parcelas: \[ {n, competencia, valor, status: \[prevista, lançada, quitada]} ]}

## 5) Rendimentos

- **Ativo que rende diariamente** {id, conta_id, tipo: \[poupanca, cdb, tesouro, saldo_corrente_rendido, outro], principal, metodo_taxa: \[fixa_anual, fixa_diaria, percentual_de_indice], indice?: \[CDI, Selic, outro], percentual_do_indice?, taxa_anual?, taxa_diaria?, data_inicio, eventos:\[aportes/resgates/troca_taxa]}
- **Provisão de rendimento diário** {id, ativo_id, data, rendimento_calculado, saldo_final}

---

# Requisitos funcionais

## RF1 — Cadastro de contas e cartões

1. Criar/editar/excluir contas com saldos iniciais.
2. Criar cartões com **dia de fechamento** e **vencimento** da fatura.
3. Exibir **limite disponível previsto** = limite_total − (lançado na fatura aberta + **previsto** das parcelas e assinaturas futuras até o fechamento vigente).

## RF2 — Lançamentos manuais e conciliação

1. Registrar despesas/receitas/transferências manuais.
2. Importar extratos CSV/OFX (opcional) e **conciliar** com lançamentos previstos (assinaturas/parcelas/recorrências).
3. Regra de conciliação: match por (valor ± tolerância, data ± janela, fornecedor/descrição semelhante). Aprovação manual quando não houver match único.

## RF3 — Recorrentes (fixas)

1. Criar uma **regra de recorrência** (ex.: água, aluguel) com RRULE (mensal, semanal, dia fixo, dia útil n, etc.).
2. Gerar **lançamentos previstos** no calendário e, na data, movê-los para **lançado** (conta ou cartão) aguardando conciliação.
3. Permitir **pausar**, **pular uma ocorrência** ou **reajustar valor** (reajuste global ou a partir de uma data).

## RF4 — Parceladas

1. Registrar **compra parcelada** em um cartão informando valor_total, n_parcelas, juros (opcional) e primeira_data.
2. O sistema gera **todas as parcelas previstas** com competências e valores (com arredondamento para que a soma feche o total).
3. Cada parcela migra para **fatura prevista** correta conforme a data/competência e, quando a fatura fechar, vira **lançada**.
4. Suportar **antecipação** (quitar parcelas futuras com ajuste de juros) e **estorno parcial/total**.

## RF5 — Assinaturas (futuras que caem no cartão)

1. Cadastrar assinatura com: fornecedor, valor, dia de cobrança, cartão, política de tentativa (se cair após o fechamento, empurra para a fatura seguinte).
2. Exibir **linha do tempo** por assinatura: últimas cobranças, **próxima cobrança** e faturas alvo até **cancelar**.
3. Permitir **cancelar a partir de uma data**; o sistema interrompe as futuras cobranças previstas e sinaliza se ainda existe uma cobrança pendente na janela pós-cancelamento (ex.: já enviada pelo fornecedor).
4. Detectar **variação de preço** (valor diferente do previsto) e gerar alerta para confirmação.

## RF6 — Faturas e previsões

1. Tela de **Fatura** mostra: lançado, previsto até o fechamento, assinaturas e parcelas que **ainda vão ser registradas**, com datas.
2. Indicadores por cartão: **Total previsto da fatura atual**, **da próxima**, **limite comprometido futuro** (30/60/90 dias).
3. Fechamento de fatura: trava edição das previsões daquela competência e consolida o **total fechado**.
4. Pagamento de fatura: registra quitação e impacto no caixa.

## RF7 — Rendimentos diários

1. Cadastrar ativos que rendem diariamente com um dos métodos:

   - **Taxa fixa anual**: aplicar taxa/365 ao dia com **capitalização composta**.
   - **Taxa fixa diária**: aplicar a taxa direta por dia (composta).
   - **% de índice diário** (ex.: % do CDI): armazenar taxa do dia (input manual ou importação) e calcular rendimento.

2. Registrar **eventos** (aportes, resgates, mudança de taxa) e recalcular a partir do evento.
3. Exibir **extrato de rendimentos** por dia e **saldo projetado** para n dias.
4. Permitir **lançar rendimento como receita** na conta quando houver crédito real (ex.: D+1).

## RF8 — Relatórios e dashboards

1. **Fluxo de caixa** (real vs previsto) por mês.
2. **Mapa de compromissos futuros** (assinaturas/parcelas) por dia/mês.
3. **Gastos por categoria** e **top fornecedores**.
4. **Evolução de patrimônio** e **rentabilidade** dos ativos.

## RF9 — Alertas e notificações

- Próximas cobranças de assinatura (x dias antes).
- Fechamento de fatura hoje/amanhã.
- Variação de preço de assinatura.
- Parcela vencendo sem lançamento conciliado.
- Rendimento negativo/anômalo (taxa ausente ou fora de faixa).
- Limite projetado < limiar definido.

## RF10 — Calendário e timeline

- **Visões**: mensal, semanal e lista.
- Filtros por conta/cartão/categoria/tipo (recorrente, parcela, assinatura).
- Ações rápidas: pular ocorrência, editar valor desta ocorrência, antecipar parcela.

## RF11 — Controle de orçamento (opcional)

- Definir orçamento por categoria e mês.
- Alertar estouro previsto antes do fechamento.

## RF12 — Multi-usuário (futuro)

- Compartilhar leitura com outra pessoa (somente leitura) e, opcionalmente, permissões de edição por área.

---

# Regras de negócio

1. **Calendário de fatura**

   - Uma compra/assinatura pertence à fatura cuja **data de lançamento** está entre **(fechamento anterior + 1)** e **fechamento atual**.
   - Se o dia de cobrança da assinatura ≥ dia de fechamento e ocorrer **após o fechamento**, mover para a **próxima fatura**.

2. **Arredondamento de parcelas**: distribuir centavos para as primeiras parcelas até fechar o total.
3. **Recorrências com meses curtos**: se o dia não existir (ex.: dia 31), regra: **ajustar para o último dia do mês**.
4. **Fuso horário**: todos os cálculos em **America/Rio_Branco** para evitar deslizes de data.
5. **Rendimentos**

   - Juros compostos: $Saldo_{t} = Saldo_{t-1} \times (1 + r_{dia})$.
   - Para taxa anual fixa: $r_{dia} = (1 + r_{anual})^{1/365} - 1$.
   - Para % de índice: $r_{dia} = CDI_{dia} \times percentual$. (entrada diária obrigatória quando usado).

6. **Conciliação automática**: só confirma se confiança ≥ limiar (ex.: 0,8); senão, fica como sugestão.

---

# Requisitos não funcionais

- **Usabilidade**: interface minimalista, foco em previsões claras e ações rápidas.
- **Confiabilidade**: logs de auditoria para mudanças em regras e lançamentos.
- **Segurança**: criptografia em repouso e em trânsito; senhas nunca armazenadas em claro.
- **Desempenho**: telas de fatura/calendário devem carregar em < 1s com até 5.000 lançamentos/ano.
- **Portabilidade**: PWA (funcionar offline com fila de sincronização — opcional).

---

# UX — telas e componentes

- **Dashboard**: cartões com _Fatura atual prevista_, _Próxima fatura prevista_, _Compromissos dos próximos 7/30 dias_, _Rendimento acumulado no mês_.
- **Faturas (por cartão)**: abas _Atual_, _Próxima_, _Histórico_ com lista separando **Lançado** e **Previsto**.
- **Assinaturas**: tabela (fornecedor, valor atual, próxima cobrança, cartão, status) + detalhe com timeline e botões _Pausar/Cancelar_.
- **Parceladas**: grade com barras de progresso por compra (n/total) e simulação de **antecipar**.
- **Rendimentos**: carteira de ativos, extrato diário, gráfico de saldo e de taxa do dia.
- **Calendário**: visão mensal com ícones (⚙️ recorrente, ♻️ assinatura, #️ parcela) e totais por dia.

---

# Modelo de dados (sugestão Postgres)

> Campos essenciais (tipos indicativos)

- `accounts(id uuid, name text, kind text, currency text default 'BRL', balance numeric)`
- `cards(id uuid, alias text, brand text, limit_total numeric, closing_day int, due_day int)`
- `invoices(id uuid, card_id uuid, year_month text, status text, total_forecast numeric, total_closed numeric, total_paid numeric)`
- `transactions(id uuid, date date, amount numeric, type text, account_id uuid, card_id uuid, invoice_id uuid, category_id uuid, description text, tags text[], reconciled boolean)`
- `recurrences(id uuid, kind text, source text, value numeric, indexation text, rrule text, next_date date, end_date date, status text, vendor text, card_id uuid)`
- `subscriptions(id uuid, recurrence_id uuid, card_id uuid, charge_day int, current_value numeric, price_history jsonb)`
- `installments(id uuid, card_id uuid, purchase_date date, total numeric, n int, monthly_interest numeric, first_due date)`
- `installment_items(id uuid, installment_id uuid, n int, year_month text, value numeric, status text)`
- `assets(id uuid, account_id uuid, kind text, principal numeric, rate_mode text, index_name text, index_percent numeric, annual_rate numeric, daily_rate numeric, start_date date)`
- `asset_events(id uuid, asset_id uuid, date date, type text, amount numeric, notes text)`
- `asset_daily(id uuid, asset_id uuid, date date, daily_return numeric, end_balance numeric)`

**Índices**: por `year_month`, `card_id+year_month`, `date`, `vendor`.

---

# Fluxos principais (critérios de aceite)

1. **Cadastrar assinatura** → selecionar cartão → definir dia 12 → sistema mostra **próximas 6 cobranças com faturas alvo**; ao passar do fechamento, a cobrança muda para a próxima fatura. ✅
2. **Compra parcelada** R\$ 1.200 em 10× no dia 05, fechamento dia 07 → parcelas de 05/MM entram nas faturas **com competência do mês**; antecipar 3 parcelas recalcula saldo e marca itens como quitados. ✅
3. **Recorrente de aluguel** dia 01 mensal → mês com 28/30/31 ajusta para **último dia do mês** quando necessário; usuário pode pular a ocorrência de um mês. ✅
4. **Rendimentos** com taxa anual 12% → sistema calcula **rendimento diário composto** e atualiza extrato; aporte em D+10 refaz o saldo a partir do evento. ✅
5. **Fatura** mostra **Previsto vs Lançado** e o **limite comprometido futuro** (30/60/90 dias). ✅

---

# Regras de cálculo — exemplos

- **Limite comprometido futuro (horizonte N dias)** = soma das parcelas e assinaturas com data ≤ hoje+N que ainda não foram lançadas.
- **Projeção da fatura** = lançado + previsto entre (fechamento_anterior+1, fechamento_atual).
- **Rendimento com taxa anual fixa**: `r_dia = (1+taxa_anual)^(1/365)-1`; `saldo_dia = saldo_ant*(1+r_dia) + aportes - resgates`.

---

# Segurança e auditoria

- Histórico de alterações em regras (assinaturas/recorrências/parcelas) com {quem, quando, antes/depois}.
- Backups automáticos e exportação para CSV/JSON.

---

# Roadmap sugerido (MVP → ++)

**MVP**: contas/cartões, faturas previstas, parceladas, assinaturas, recorrentes, calendário, rendimentos com taxa fixa anual, alerts básicos.
**V1**: conciliação por importação CSV, % do CDI com input diário, antecipação de parcelas, orçamento por categoria.
**V2**: PWA/offline, integrações bancárias, compartilhamento, metas e objetivos.
