import {
  uuid,
  text,
  integer,
  timestamp,
  pgSchema,
  date,
  pgEnum,
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
  balance: integer("balance").notNull().default(0), // Valor em centavos
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
  totalLimit: integer("total_limit").notNull(), // Valor em centavos
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
  totalAmount: integer("total_amount").notNull().default(0), // Valor em centavos
  paidAmount: integer("paid_amount").notNull().default(0), // Valor em centavos
  dueDate: date("due_date").notNull(),
  status: invoiceStatusEnum("status").notNull().default("open"),
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
