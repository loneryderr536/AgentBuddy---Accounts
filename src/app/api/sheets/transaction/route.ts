import { NextRequest, NextResponse } from 'next/server';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  isGoogleSheetsConfigured,
} from '@/lib/googleSheets';
import { ExtractedTransaction, UpdateTransactionPayload } from '@/types/accounting';

export async function POST(req: NextRequest) {
  try {
    const body: ExtractedTransaction = await req.json();

    if (!body.item || !body.amount || !body.date) {
      return NextResponse.json(
        { error: 'Item, amount, and date are required.' },
        { status: 400 }
      );
    }

    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json({
        success: true,
        mockMode: true,
        message: 'Saved in Local Session (Configure Google Sheets credentials in .env to sync with Google Drive)',
        data: body,
      });
    }

    const result = await addTransaction(body);
    return NextResponse.json({
      mockMode: false,
      message: `Transaction recorded successfully in ${body.type === 'PAYMENT' ? 'Daybook - Payments' : 'Daybook - Receipts'}`,
      ...result,
    });
  } catch (error: any) {
    console.error('Save transaction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save to Google Sheets' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body: UpdateTransactionPayload = await req.json();

    if (!body.slNo || !body.item || !body.amount || !body.date) {
      return NextResponse.json(
        { error: 'Sl No, item, amount, and date are required.' },
        { status: 400 }
      );
    }

    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json({
        success: true,
        mockMode: true,
        message: `Updated row #${body.slNo} locally.`,
        data: body,
      });
    }

    const result = await updateTransaction(body);
    return NextResponse.json({
      mockMode: false,
      ...result,
    });
  } catch (error: any) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update transaction in Google Sheets' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as 'PAYMENT' | 'RECEIPT') || 'PAYMENT';
    const slNo = parseInt(searchParams.get('slNo') || '0', 10);

    if (!slNo) {
      return NextResponse.json({ error: 'Valid slNo is required.' }, { status: 400 });
    }

    if (!isGoogleSheetsConfigured()) {
      return NextResponse.json({
        success: true,
        mockMode: true,
        message: `Deleted row #${slNo} locally.`,
      });
    }

    const result = await deleteTransaction(type, slNo);
    return NextResponse.json({
      mockMode: false,
      ...result,
    });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete row in Google Sheets' },
      { status: 500 }
    );
  }
}
