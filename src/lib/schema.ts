import {
  pgTable,
  pgSchema,
  pgEnum,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
  customType,
  integer,
  date,
  bigint,
  jsonb,
  interval,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { relations } from "drizzle-orm/relations";

export const labels = pgSchema("labels");
export const salem = pgSchema("salem");
export const transactions = pgSchema("transactions");

export const accountTypeInSalem = salem.enum("account_type", [
  "corrente",
  "poupanca",
  "carteira",
  "corretora",
]);
export const invoiceStatusInSalem = salem.enum("invoice_status", [
  "open",
  "paid",
  "overdue",
]);
export const financeTypeInSalem = salem.enum("finance_type", [
  "installment",
  "upfront",
  "subscription",
]);
export const accountTypeInTransactions = transactions.enum("account_type", [
  "corrente",
  "poupanca",
  "carteira",
  "corretora",
]);
export const invoiceStatusInTransactions = transactions.enum("invoice_status", [
  "open",
  "paid",
  "overdue",
]);
export const scheduleTypeInTransactions = transactions.enum("schedule_type", [
  "installment",
  "subscription",
]);
export const paymentTypeInTransactions = transactions.enum("payment_type", [
  "SINGLE_PURCHASE",
  "INSTALLMENT",
  "SUBSCRIPTION",
  "RECURRING_BILL",
]);

export const categoriesInLabels = labels.table("categories", {
  id: uuid("id"),
  userId: uuid("user_id"),
  name: text("name"),
  type: text("type"),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
});

export const accountsInSalem = salem.table(
  "accounts",
  {
    accountId: uuid("account_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: customType({ dataType: () => "salem.account_type" })(
      "type"
    ).notNull(),
    balance: integer("balance")
      .default(sql`0`)
      .notNull(),
    currency: text("currency")
      .default(sql`'BRL'`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("accounts_pkey").on(table.accountId),
      idxAccountsUserId: index("idx_accounts_user_id").on(table.userId),
    };
  }
);

export const cardsInSalem = salem.table(
  "cards",
  {
    cardId: uuid("card_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    alias: text("alias").notNull(),
    brand: text("brand").notNull(),
    totalLimit: integer("total_limit").notNull(),
    closingDay: integer("closing_day").notNull(),
    dueDay: integer("due_day").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("cards_pkey").on(table.cardId),
      idxCardsUserId: index("idx_cards_user_id").on(table.userId),
    };
  }
);

export const categoriesInSalem = salem.table(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    color: text("color")
      .default(sql`'#6b7280'`)
      .notNull(),
    icon: text("icon")
      .default(sql`'📦'`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("categories_pkey").on(table.id),
      idxCategoriesUserId: index("idx_categories_user_id").on(table.userId),
    };
  }
);

export const expensesInSalem = salem.table(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    item: text("item").notNull(),
    amount: integer("amount").notNull(),
    purchaseDate: timestamp("purchase_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    responsibleParty: text("responsible_party"),
    currentInstallment: integer("current_installment").notNull(),
    totalInstallments: integer("total_installments").notNull(),
    isFixed: text("is_fixed")
      .default(sql`'false'`)
      .notNull(),
    bank: text("bank").notNull(),
    billDate: date("bill_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    cardId: uuid("card_id").notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("expenses_pkey").on(table.id),
      idxExpensesBank: index("idx_expenses_bank").on(table.bank),
      idxExpensesBillDate: index("idx_expenses_bill_date").on(table.billDate),
      idxExpensesCardId: index("idx_expenses_card_id").on(table.cardId),
      idxExpensesPurchaseDate: index("idx_expenses_purchase_date").on(
        table.purchaseDate
      ),
      idxExpensesUserCard: index("idx_expenses_user_card").on(
        table.userId,
        table.cardId
      ),
      idxExpensesUserId: index("idx_expenses_user_id").on(table.userId),
    };
  }
);

export const installmentsInSalem = salem.table(
  "installments",
  {
    installmentId: uuid("installment_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: uuid("user_id"),
    accountId: uuid("account_id"),
    cardId: uuid("card_id"),
    categoryId: uuid("category_id"),
    installmentBaseDescription: text("installment_base_description"),
    installmentAmount: bigint("installment_amount", { mode: "number" }),
    type: text("type"),
    date: date("date"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
    tags: jsonb("tags"),
    category: text("category"),
    installments: integer("installments"),
    parentTransactionId: uuid("parent_transaction_id"),
    financeType: customType({ dataType: () => "salem.finance_type" })(
      "finance_type"
    ),
    invoiceId: uuid("invoice_id"),
  },
  (table) => {
    return {
      pkey: uniqueIndex("installments_pkey").on(table.installmentId),
    };
  }
);

export const invoicesInSalem = salem.table(
  "invoices",
  {
    invoiceId: uuid("invoice_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    dueDate: date("due_date").notNull(),
    paidAmount: integer("paid_amount")
      .default(sql`0`)
      .notNull(),
    status: customType({ dataType: () => "salem.invoice_status" })(
      "status"
    ).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    closingDate: date("closing_date").notNull(),
  },
  (table) => {
    return {
      idxInvoicesCardId: index("idx_invoices_card_id").on(table.cardId),
      idxInvoicesUserId: index("idx_invoices_user_id").on(table.userId),
      pkey: uniqueIndex("invoices_pkey").on(table.invoiceId),
    };
  }
);

export const profilesInSalem = salem.table(
  "profiles",
  {
    id: uuid("id").primaryKey().notNull(),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => {
    return {
      idxProfilesEmail: index("idx_profiles_email").on(table.email),
      emailKey: uniqueIndex("profiles_email_key").on(table.email),
      pkey: uniqueIndex("profiles_pkey").on(table.id),
    };
  }
);

export const subscriptionsInSalem = salem.table(
  "subscriptions",
  {
    subscriptionId: uuid("subscription_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id"),
    categoryId: uuid("category_id"),
    name: text("name").notNull(),
    vendor: text("vendor").notNull(),
    currentValue: integer("current_value").notNull(),
    chargeDay: integer("charge_day").notNull(),
    status: text("status")
      .default(sql`'ativa'`)
      .notNull(),
    startDate: date("start_date").notNull(),
    nextChargeDate: date("next_charge_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      idxSubscriptionsUserId: index("idx_subscriptions_user_id").on(
        table.userId
      ),
      pkey: uniqueIndex("subscriptions_pkey").on(table.subscriptionId),
    };
  }
);

export const transactionsInSalem = salem.table(
  "transactions",
  {
    transactionId: uuid("transaction_id")
      .defaultRandom()
      .primaryKey()
      .notNull(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id"),
    cardId: uuid("card_id"),
    categoryId: uuid("category_id"),
    description: text("description").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    type: text("type").notNull(),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    tags: jsonb("tags"),
    category: text("category"),
    installments: integer("installments").default(sql`1`),
    currentInstallment: integer("current_installment").default(sql`1`),
    parentTransactionId: uuid("parent_transaction_id"),
    financeType: customType({ dataType: () => "salem.finance_type" })(
      "finance_type"
    ),
    invoiceId: uuid("invoice_id"),
    installmentsId: uuid("installments_id"),
  },
  (table) => {
    return {
      idxTransactionsAccountId: index("idx_transactions_account_id").on(
        table.accountId
      ),
      idxTransactionsCardDate: index("idx_transactions_card_date").on(
        table.cardId,
        table.date
      ),
      idxTransactionsCardId: index("idx_transactions_card_id").on(table.cardId),
      idxTransactionsTags: index("idx_transactions_tags").on(
        table.tags
      ),
      idxTransactionsUserId: index("idx_transactions_user_id").on(table.userId),
      pkey: uniqueIndex("transactions_pkey").on(table.transactionId),
    };
  }
);

export const accountsInTransactions = transactions.table(
  "accounts",
  {
    accountId: uuid("account_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: customType({ dataType: () => "transactions.account_type" })(
      "type"
    ).notNull(),
    balance: bigint("balance", { mode: "number" })
      .default(sql`0`)
      .notNull(),
    currency: text("currency")
      .default(sql`'BRL'`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("accounts_pkey").on(table.accountId),
      idxAccountsUserId: index("idx_accounts_user_id").on(table.userId),
    };
  }
);

export const cardsInTransactions = transactions.table(
  "cards",
  {
    cardId: uuid("card_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    alias: text("alias").notNull(),
    brand: text("brand").notNull(),
    totalLimit: bigint("total_limit", { mode: "number" }).notNull(),
    closingDay: integer("closing_day").notNull(),
    dueDay: integer("due_day").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pkey: uniqueIndex("cards_pkey").on(table.cardId),
      idxCardsUserId: index("idx_cards_user_id").on(table.userId),
    };
  }
);

export const expensesInTransactions = transactions.table(
  "expenses",
  {
    expenseId: bigint("expense_id", { mode: "number" })
      .primaryKey()
      .notNull()
      .generatedByDefaultAsIdentity({
        name: "expenses_expense_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    description: text("description"),
    value: bigint("value", { mode: "number" }),
    date: date("date"),
    paymentType: customType({ dataType: () => "transactions.payment_type" })(
      "payment_type"
    ),
    expenseCategory: text("expense_category"),
    responsibleParties: jsonb("responsible_parties"),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updateAt: timestamp("update_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    scheduleId: uuid("schedule_id"),
    accountId: uuid("account_id"),
    cardId: uuid("card_id"),
  },
  (table) => {
    return {
      pkey: uniqueIndex("expenses_pkey").on(table.expenseId),
      idxExpensesUserId: index("idx_expenses_user_id").on(table.userId),
    };
  }
);

export const paymentSchedulesInTransactions = transactions.table(
  "payment_schedules",
  {
    scheduleId: uuid("schedule_id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    description: text("description").notNull(),
    value: bigint("value", { mode: "number" }).notNull(),
    scheduleType: customType({ dataType: () => "transactions.schedule_type" })(
      "schedule_type"
    ).notNull(),
    startDate: date("start_date").notNull(),
    frequency: interval("frequency").notNull(),
    totalInstallments: integer("total_installments"),
    isActive: boolean("is_active")
      .default(sql`true`)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      idxPaymentSchedulesUserId: index("idx_payment_schedules_user_id").on(
        table.userId
      ),
      pkey: uniqueIndex("payment_schedules_pkey").on(table.scheduleId),
    };
  }
);

export const profilesInTransactions = transactions.table(
  "profiles",
  {
    userId: uuid("user_id").primaryKey().notNull(),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => {
    return {
      idxProfilesEmail: index("idx_profiles_email").on(table.email),
      emailKey: uniqueIndex("profiles_email_key").on(table.email),
      pkey: uniqueIndex("profiles_pkey").on(table.userId),
    };
  }
);
export const expensesInSalemRelations = relations(
  expensesInSalem,
  ({ one }) => ({
    cardsInSalem: one(cardsInSalem, {
      fields: [expensesInSalem.cardId],
      references: [cardsInSalem.cardId],
    }),
  })
);

export const cardsInSalemRelations = relations(cardsInSalem, ({ many }) => ({
  expensesInSalems: many(expensesInSalem),
  invoicesInSalems: many(invoicesInSalem),
  subscriptionsInSalems: many(subscriptionsInSalem),
  transactionsInSalems: many(transactionsInSalem),
}));

export const invoicesInSalemRelations = relations(
  invoicesInSalem,
  ({ one, many }) => ({
    cardsInSalem: one(cardsInSalem, {
      fields: [invoicesInSalem.cardId],
      references: [cardsInSalem.cardId],
    }),
    transactionsInSalems: many(transactionsInSalem),
  })
);

export const subscriptionsInSalemRelations = relations(
  subscriptionsInSalem,
  ({ one }) => ({
    cardsInSalem: one(cardsInSalem, {
      fields: [subscriptionsInSalem.cardId],
      references: [cardsInSalem.cardId],
    }),
    categoriesInSalem: one(categoriesInSalem, {
      fields: [subscriptionsInSalem.categoryId],
      references: [categoriesInSalem.id],
    }),
  })
);

export const categoriesInSalemRelations = relations(
  categoriesInSalem,
  ({ many }) => ({
    subscriptionsInSalems: many(subscriptionsInSalem),
    transactionsInSalems: many(transactionsInSalem),
  })
);

export const transactionsInSalemRelations = relations(
  transactionsInSalem,
  ({ one }) => ({
    installmentsInSalem: one(installmentsInSalem, {
      fields: [transactionsInSalem.installmentsId],
      references: [installmentsInSalem.installmentId],
    }),
    invoicesInSalem: one(invoicesInSalem, {
      fields: [transactionsInSalem.invoiceId],
      references: [invoicesInSalem.invoiceId],
    }),
    accountsInSalem: one(accountsInSalem, {
      fields: [transactionsInSalem.accountId],
      references: [accountsInSalem.accountId],
    }),
    cardsInSalem: one(cardsInSalem, {
      fields: [transactionsInSalem.cardId],
      references: [cardsInSalem.cardId],
    }),
    categoriesInSalem: one(categoriesInSalem, {
      fields: [transactionsInSalem.categoryId],
      references: [categoriesInSalem.id],
    }),
  })
);

export const installmentsInSalemRelations = relations(
  installmentsInSalem,
  ({ many }) => ({
    transactionsInSalems: many(transactionsInSalem),
  })
);

export const accountsInSalemRelations = relations(
  accountsInSalem,
  ({ many }) => ({
    transactionsInSalems: many(transactionsInSalem),
  })
);

export const accountsInTransactionsRelations = relations(
  accountsInTransactions,
  ({ one, many }) => ({
    profilesInTransaction: one(profilesInTransactions, {
      fields: [accountsInTransactions.userId],
      references: [profilesInTransactions.userId],
    }),
    expensesInTransactions: many(expensesInTransactions),
  })
);

export const profilesInTransactionsRelations = relations(
  profilesInTransactions,
  ({ many }) => ({
    accountsInTransactions: many(accountsInTransactions),
    cardsInTransactions: many(cardsInTransactions),
    expensesInTransactions: many(expensesInTransactions),
    paymentSchedulesInTransactions: many(paymentSchedulesInTransactions),
  })
);

export const cardsInTransactionsRelations = relations(
  cardsInTransactions,
  ({ one, many }) => ({
    profilesInTransaction: one(profilesInTransactions, {
      fields: [cardsInTransactions.userId],
      references: [profilesInTransactions.userId],
    }),
    expensesInTransactions: many(expensesInTransactions),
  })
);

export const expensesInTransactionsRelations = relations(
  expensesInTransactions,
  ({ one }) => ({
    accountsInTransaction: one(accountsInTransactions, {
      fields: [expensesInTransactions.accountId],
      references: [accountsInTransactions.accountId],
    }),
    cardsInTransaction: one(cardsInTransactions, {
      fields: [expensesInTransactions.cardId],
      references: [cardsInTransactions.cardId],
    }),
    paymentSchedulesInTransaction: one(paymentSchedulesInTransactions, {
      fields: [expensesInTransactions.scheduleId],
      references: [paymentSchedulesInTransactions.scheduleId],
    }),
    profilesInTransaction: one(profilesInTransactions, {
      fields: [expensesInTransactions.userId],
      references: [profilesInTransactions.userId],
    }),
  })
);

export const paymentSchedulesInTransactionsRelations = relations(
  paymentSchedulesInTransactions,
  ({ one, many }) => ({
    expensesInTransactions: many(expensesInTransactions),
    profilesInTransaction: one(profilesInTransactions, {
      fields: [paymentSchedulesInTransactions.userId],
      references: [profilesInTransactions.userId],
    }),
  })
);
