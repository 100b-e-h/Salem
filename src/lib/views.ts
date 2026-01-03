import { bigint, timestamp, varchar, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { salem } from "./schema"

export const invoicesSummary = salem.materializedView("invoices_summary", {
  invoiceId: uuid("invoice_id").notNull(),
  dueDate: timestamp("due_date"),
  paidAmount: bigint("paid_amount", { mode: "number" }),
  status: varchar("status", { length: 50 }),
  closingDate: timestamp("closing_date"),
  totalItems: bigint("total_items", { mode: "number" }),
  totalAmount: bigint("total_amount", { mode: "number" }),
  invoiceDate: timestamp("invoice_date"),
}).as(sql`
  SELECT
    t.invoice_id,
    i.due_date,
    i.paid_amount,
    i.status,
    i.closing_date,
    count(t.transaction_id) AS total_items,
    sum(t.amount)::bigint AS total_amount,
    max(t.date) AS invoice_date
  FROM
    salem.transactions t
    LEFT JOIN salem.invoices i ON i.invoice_id = t.invoice_id
  WHERE
    t.invoice_id IS NOT NULL
  GROUP BY
    t.invoice_id,
    i.due_date,
    i.paid_amount,
    i.status,
    i.closing_date
  ORDER BY
    t.invoice_id
`)

export const installmentsSummary = salem.materializedView("installments_summary", {
  invoiceId: uuid("invoice_id").notNull(),
  dueDate: timestamp("due_date"),
  paidAmount: bigint("paid_amount", { mode: "number" }),
  status: varchar("status", { length: 50 }),
  closingDate: timestamp("closing_date"),
  totalItems: bigint("total_items", { mode: "number" }),
  totalAmount: bigint("total_amount", { mode: "number" }),
  invoiceDate: timestamp("invoice_date"),
}).as(sql`
SELECT
  t.invoice_id,
  i.due_date,
  i.paid_amount,
  i.status,
  i.closing_date,
  count(t.transaction_id) AS total_items,
  sum(t.amount)::bigint AS total_amount,
  max(t.date) AS invoice_date
FROM
  salem.transactions t
  LEFT JOIN salem.invoices i ON i.invoice_id = t.invoice_id
WHERE
  t.invoice_id IS NOT NULL
  AND t.finance_type = 'installment'
GROUP BY
  t.invoice_id,
  i.due_date,
  i.paid_amount,
  i.status,
  i.closing_date
ORDER BY
  t.invoice_id
`)

export const subscriptionSummary = salem.materializedView("subscriptions_summary", {
  invoiceId: uuid("invoice_id").notNull(),
  dueDate: timestamp("due_date"),
  paidAmount: bigint("paid_amount", { mode: "number" }),
  status: varchar("status", { length: 50 }),
  closingDate: timestamp("closing_date"),
  totalItems: bigint("total_items", { mode: "number" }),
  totalAmount: bigint("total_amount", { mode: "number" }),
  invoiceDate: timestamp("invoice_date"),
}).as(sql`
SELECT
  t.invoice_id,
  i.due_date,
  i.paid_amount,
  i.status,
  i.closing_date,
  count(t.transaction_id) AS total_items,
  sum(t.amount)::bigint AS total_amount,
  max(t.date) AS invoice_date
FROM
  salem.transactions t
  LEFT JOIN salem.invoices i ON i.invoice_id = t.invoice_id
WHERE
  t.invoice_id IS NOT NULL
  AND t.finance_type = 'subscription'
GROUP BY
  t.invoice_id,
  i.due_date,
  i.paid_amount,
  i.status,
  i.closing_date
ORDER BY
  t.invoice_id
`)

