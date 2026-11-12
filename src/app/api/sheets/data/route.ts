import { NextResponse } from 'next/server';
import {
  getRecentTransactions,
  initializeSpreadsheet,
  isGoogleSheetsConfigured,
} from '@/lib/googleSheets';

// Create the 5 sheets/headers once per server process (idempotent).
let initialized = false;

export async function GET() {
  try {
    if (isGoogleSheetsConfigured() && !initialized) {
      await initializeSpreadsheet();
      initialized = true;
    }
    const data = await getRecentTransactions();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve sheets data' },
      { status: 500 }
    );
  }
}
