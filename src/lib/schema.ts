import {
  uuid,
  text,
  integer,
  timestamp,
  pgSchema,
  date,
  pgEnum,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const salemSchema = pgSchema("salem");

export const accountTypeEnum = pgEnum("account_type", [
  "corrente",
  "poupanca",
  "carteira",
  "corretora",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "open",
  "paid",
  "overdue",
]);

export const accounts = salemSchema.table("accounts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: integer("balance").notNull().default(0),
  currency: text("currency").notNull().default("BRL"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const cards = salemSchema.table("cards", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  alias: text("alias").notNull(),
  brand: text("brand").notNull(),
  totalLimit: integer("total_limit").notNull(),
  closingDay: integer("closing_day").notNull(),
  dueDay: integer("due_day").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const invoices = salemSchema.table("invoices", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalAmount: integer("total_amount").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  dueDate: date("due_date").notNull(),
  closingDate: date("closing_date"),
  status: invoiceStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const categories = salemSchema.table("categories", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  color: text("color").notNull().default("#6b7280"),
  icon: text("icon").notNull().default("📦"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const transactions = salemSchema.table("transactions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "cascade",
  }),
  cardId: uuid("card_id").references(() => cards.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  category: text("category"), // Categoria como texto (alimentacao, transporte, etc)
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  date: date("date").notNull(),
  sharedWith: jsonb("shared_with"), // Array de {id, email, paid} dos usuários compartilhados
  // Campos de parcelamento
  installments: integer("installments").default(1), // Número de parcelas (1 = à vista)
  currentInstallment: integer("current_installment").default(1), // Parcela atual
  parentTransactionId: uuid("parent_transaction_id"), // ID da transação pai (para parcelas)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const subscriptions = salemSchema.table("subscriptions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id").references(() => cards.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  vendor: text("vendor").notNull(),
  currentValue: integer("current_value").notNull(),
  chargeDay: integer("charge_day").notNull(),
  status: text("status").notNull().default("ativa"),
  startDate: date("start_date").notNull(),
  nextChargeDate: date("next_charge_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const installments = salemSchema.table("installments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  cardId: uuid("card_id").references(() => cards.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull(),
  vendor: text("vendor").notNull(),
  totalAmount: integer("total_amount").notNull(),
  installmentCount: integer("installment_count").notNull(),
  installmentValue: integer("installment_value").notNull(),
  currentInstallment: integer("current_installment").notNull().default(1),
  monthlyInterest: decimal("monthly_interest", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  purchaseDate: date("purchase_date").notNull(),
  firstDueDate: date("first_due_date").notNull(),
  status: text("status").notNull().default("ativa"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const assets = salemSchema.table("assets", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  principal: integer("principal").notNull(),
  currentBalance: integer("current_balance").notNull(),
  rateMethod: text("rate_method").notNull(),
  annualRate: decimal("annual_rate", { precision: 5, scale: 2 }),
  indexName: text("index_name"),
  indexPercent: integer("index_percent"),
  startDate: date("start_date").notNull(),
  totalReturn: integer("total_return").notNull().default(0),
  monthlyReturn: integer("monthly_return").notNull().default(0),
  projectedBalance: integer("projected_balance").notNull().default(0),
  status: text("status").notNull().default("ativo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Installment = typeof installments.$inferSelect;
export type NewInstallment = typeof installments.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
