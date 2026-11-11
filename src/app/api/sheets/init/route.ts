import { NextRequest, NextResponse } from 'next/server';
import { initializeSpreadsheet, isGoogleSheetsConfigured } from '@/lib/googleSheets';

export async function POST(req: NextRequest) {
  try {
    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Google Sheets credentials are not configured yet. Please check .env file.',
      });
    }

    const res = await initializeSpreadsheet();
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('Init sheets error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize spreadsheet' },
      { status: 500 }
    );
  }
}

