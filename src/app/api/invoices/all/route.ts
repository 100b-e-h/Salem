import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { transactionsInSalem, invoicesInSalem } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/invoices/all?year=2026&month=1
 * Fetch all transactions across all cards for a specific month
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const cardIds = searchParams.get('cardIds'); // Comma-separated card IDs

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    // Build invoice query conditions
    const invoiceConditions = [
      eq(invoicesInSalem.userId, user.id),
      eq(invoicesInSalem.year, parseInt(year)),
      eq(invoicesInSalem.month, parseInt(month))
    ];

    // Find all invoices for the user in the specified month/year
    const userInvoices = await db
      .select()
      .from(invoicesInSalem)
      .where(and(...invoiceConditions));

    if (userInvoices.length === 0) {
      return NextResponse.json([]);
    }

    // Filter by specific card IDs if provided
    let filteredInvoices = userInvoices;
    if (cardIds) {
      const cardIdArray = cardIds.split(',').filter(id => id.trim());
      if (cardIdArray.length > 0) {
        filteredInvoices = userInvoices.filter(inv => 
          cardIdArray.includes(inv.cardId)
        );
      }
    }

    if (filteredInvoices.length === 0) {
      return NextResponse.json([]);
    }

    // Get all transactions for these invoices
    const invoiceIds = filteredInvoices.map((inv) => inv.invoiceId);
    
    const transactions = await db
      .select()
      .from(transactionsInSalem)
      .where(eq(transactionsInSalem.userId, user.id));

    // Filter transactions that belong to the invoices for this month
    const filteredTransactions = transactions.filter((t) =>
      t.invoiceId && invoiceIds.includes(t.invoiceId)
    );

    return NextResponse.json(filteredTransactions);
  } catch (error) {
    console.error('Failed to fetch aggregated invoice transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
