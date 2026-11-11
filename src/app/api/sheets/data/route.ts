import { NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/googleSheets';

export async function GET() {
  try {
    const data = await getRecentTransactions();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve sheets data' },
      { status: 500 }
    );
  }
}

