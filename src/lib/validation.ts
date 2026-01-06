import { z } from "zod";

// Schemas de validação para APIs
export const emailSchema = z
  .string()
  .email("Email inválido")
  .min(1, "Email é obrigatório");

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Senha deve conter ao menos 1 letra minúscula, 1 maiúscula e 1 número"
  );

export const amountSchema = z
  .number()
  .positive("Valor deve ser positivo")
  .max(999999999, "Valor muito alto")
  .refine(
    (val: number) => Number.isFinite(val),
    "Valor deve ser um número válido"
  );

export const descriptionSchema = z
  .string()
  .min(1, "Descrição é obrigatória")
  .max(255, "Descrição muito longa")
  .regex(
    /^[a-zA-Z0-9\sÀ-ÿ\-_.,!?()@#$%&*+=:;/\\]+$/,
    "Descrição contém caracteres inválidos"
  );

export const uuidSchema = z.string().uuid("ID inválido");

export const dateSchema = z
  .string()
  .refine((date: string) => {
    // Accept both YYYY-MM-DD and ISO 8601 timestamp formats
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return dateOnlyPattern.test(date) || isoPattern.test(date);
  }, "Data deve estar no formato YYYY-MM-DD ou ISO 8601")
  .refine((date: string) => {
    const parsed = new Date(date);
    return (
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() >= 2000 &&
      parsed.getFullYear() <= 2100
    );
  }, "Data inválida");

// Schema para criar conta
export const createAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  balance: amountSchema.optional().default(0),
  type: z.enum(["corrente", "poupanca", "carteira", "corretora"], {
    message: "Tipo de conta inválido",
  }),
});

// Schema para criar cartão
export const createCardSchema = z.object({
  alias: z.string().min(1, "Alias é obrigatório").max(50, "Alias muito longo"),
  brand: z.string().min(1, "Marca é obrigatória").max(30, "Marca muito longa"),
  totalLimit: amountSchema,
  closingDay: z.number().int().min(1).max(31, "Dia de fechamento inválido"),
  dueDay: z.number().int().min(1).max(31, "Dia de vencimento inválido"),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z
    .string()
    .refine((date: string) => {
      // Accept both YYYY-MM-DD and ISO 8601 timestamp formats
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      return dateOnlyPattern.test(date) || isoPattern.test(date);
    }, "Data deve estar no formato YYYY-MM-DD ou ISO 8601")
    .transform((date: string) => {
      // Always convert to UTC midnight to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Date-only format - use as-is with midnight UTC
        return `${date}T00:00:00.000Z`;
      }
      // If already ISO format, extract date and normalize to midnight UTC
      const parsedDate = new Date(date);
      const year = parsedDate.getUTCFullYear();
      const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }),
  category: z.string().nullable().optional(),
  installments: z.number().int().min(1).optional().default(1),
  installmentOffset: z.number().int().min(0).optional().default(0),
  tags: z.array(z.string()).nullable().optional().default([]).transform(val => val ?? []),
  invoiceMonth: z.number().int().min(1).max(12).optional(),
  invoiceYear: z.number().int().min(2000).max(2100).optional(),
  financeType: z.enum(["installment", "upfront", "subscription"]).default("upfront"),
  type: z.enum(["expense", "income"]).optional().default("expense"),
});

export const createInvoiceSchema = z.object({
  cardId: uuidSchema,
  month: z.number().int().min(1).max(12, "Mês inválido"),
  year: z.number().int().min(2000).max(2100, "Ano inválido"),
  totalAmount: amountSchema,
  paidAmount: amountSchema.optional().default(0),
  dueDate: dateSchema,
  closingDate: dateSchema,
  status: z.enum(["open", "paid", "overdue"]).optional().default("open"),
});

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

export function sanitizeNumber(num: unknown): number {
  const parsed = Number(num);
  if (!Number.isFinite(parsed)) {
    throw new Error("Número inválido");
  }
  return parsed;
}

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(`Dados inválidos: ${messages.join(", ")}`);
    }
    throw error;
  }
}
