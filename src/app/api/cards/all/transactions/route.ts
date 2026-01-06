import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { transactionsInSalem } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cards/all/transactions
 * Fetch all transactions across all cards for the authenticated user
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
    const financeType = searchParams.get('financeType');
    const cardIds = searchParams.get('cardIds'); // Comma-separated card IDs

    // Build query conditions
    const conditions = [eq(transactionsInSalem.userId, user.id)];

    if (financeType) {
      conditions.push(eq(transactionsInSalem.financeType, financeType));
    }

    // Fetch all transactions
    const query = db
      .select()
      .from(transactionsInSalem)
      .where(and(...conditions));

    let transactions = await query;

    // Filter by specific card IDs if provided
    if (cardIds) {
      const cardIdArray = cardIds.split(',').filter(id => id.trim());
      if (cardIdArray.length > 0) {
        transactions = transactions.filter(t => 
          t.cardId && cardIdArray.includes(t.cardId)
        );
      }
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Failed to fetch aggregated transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
