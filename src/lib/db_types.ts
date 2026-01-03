import {
  accountsInSalem,
  cardsInSalem,
  invoicesInSalem,
  categoriesInSalem,
  transactionsInSalem,
  subscriptionsInSalem,
  installmentsInSalem,
} from "./schema";

export type Account = typeof accountsInSalem.$inferSelect;
export type NewAccount = typeof accountsInSalem.$inferInsert;

export type Card = typeof cardsInSalem.$inferSelect;
export type NewCard = typeof cardsInSalem.$inferInsert;

export type Invoice = typeof invoicesInSalem.$inferSelect;
export type NewInvoice = typeof invoicesInSalem.$inferInsert;

export type Category = typeof categoriesInSalem.$inferSelect;
export type NewCategory = typeof categoriesInSalem.$inferInsert;

export type Transaction = typeof transactionsInSalem.$inferSelect;
export type NewTransaction = typeof transactionsInSalem.$inferInsert;

export type Subscription = typeof subscriptionsInSalem.$inferSelect;
export type NewSubscription = typeof subscriptionsInSalem.$inferInsert;

export type Installment = typeof installmentsInSalem.$inferSelect;
export type NewInstallment = typeof installmentsInSalem.$inferInsert;