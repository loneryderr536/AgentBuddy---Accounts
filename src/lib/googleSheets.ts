import { google } from 'googleapis';
import {
  ExtractedTransaction,
  UpdateTransactionPayload,
  PaymentCategory,
  ReceiptCategory,
  AccountStatementData,
} from '@/types/accounting';

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const jsonCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (jsonCreds) {
    try {
      let parsed = jsonCreds;
      if (!jsonCreds.trim().startsWith('{')) {
        // Base64 decoded
        parsed = Buffer.from(jsonCreds, 'base64').toString('utf8');
      }
      const credentials = JSON.parse(parsed);
      return new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  if (email && privateKey) {
    // Replace escaped newlines if passed in .env
    privateKey = privateKey.replace(/\\n/g, '\n');
    return new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  return null;
}

export function isGoogleSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
      (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY))
  );
}

const SHEET_NAMES = {
  DAYBOOK_PAYMENTS: 'Daybook - Payments',
  DAYBOOK_RECEIPTS: 'Daybook - Receipts',
  LEDGER_PAYMENTS: 'Payments (Ledger)',
  LEDGER_RECEIPTS: 'Receipts (Ledger)',
  ACCOUNT_STATEMENT: 'Account Statement',
};

/**
 * Initialize all 5 sheets with required headers and formatting if not already present.
 */
export async function initializeSpreadsheet() {
  const auth = getGoogleAuth();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!auth || !spreadsheetId) {
    throw new Error('Google Sheets credentials are not configured in environment variables.');
  }

  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Get existing sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = meta.data.sheets?.map((s) => s.properties?.title) || [];

  const requiredSheets = [
    SHEET_NAMES.DAYBOOK_PAYMENTS,
    SHEET_NAMES.DAYBOOK_RECEIPTS,
    SHEET_NAMES.LEDGER_PAYMENTS,
    SHEET_NAMES.LEDGER_RECEIPTS,
    SHEET_NAMES.ACCOUNT_STATEMENT,
  ];

  const sheetsToCreate = requiredSheets.filter((name) => !existingSheets.includes(name));

  if (sheetsToCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: sheetsToCreate.map((title) => ({
          addSheet: {
            properties: { title },
          },
        })),
      },
    });
  }

  // 2. Add header rows if sheets are brand new
  // Daybook - Payments
  const daybookPaymentsHeader = [
    ['Day - Book (Payments)'],
    ['Sl. No.', 'Date', 'Item', 'Voucher No.', 'Amount', 'Remarks', 'Category'],
  ];

  // Daybook - Receipts
  const daybookReceiptsHeader = [
    ['Day - Book (Receipts)'],
    ['Sl. No.', 'Date', 'Item', 'Receipt no.', 'Amount', 'Remarks', 'Category'],
  ];

  // Account Statement template
  const accountStatementTemplate = [
    ['Account Statement'],
    ['Receipt', '', '', 'Payment', '', ''],
    ['Opening Balance', 'BUDGET', 'ACTUAL', 'Farewell', 'BUDGET', 'ACTUAL'],
    ['  Cash in Bank', '0', '0', 'Center Expenses', '0', '0'],
    ['  Cash in Hand', '0', '0', '  Youth Registration', '0', '0'],
    ['Bank Interest', '0', '0', 'Awareness Expenses', '0', '0'],
    ['Offertory', '0', '0', 'Bank Charges', '0', '0'],
    ['Donation Received', '0', '0', 'Inauguration Expenses', '0', '0'],
    ['Camp Registration', '0', '0', 'Camp Expenses', '0', '0'],
    ['', '', '', 'Miscellaneous', '0', '0'],
    ['', '', '', 'Closing Balance', '', ''],
    ['', '', '', '  Cash in Bank', '0', '0'],
    ['', '', '', '  Cash in Hand', '0', '0'],
    ['Total Receipts', '=SUM(B3:B9)', '=SUM(C3:C9)', 'Total Payments', '=SUM(E3:E13)', '=SUM(F3:F13)'],
  ];

  // Check if Payments header exists
  const payCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAMES.DAYBOOK_PAYMENTS}'!A1:G2`,
  });

  if (!payCheck.data.values || payCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.DAYBOOK_PAYMENTS}'!A1:G2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: daybookPaymentsHeader },
    });
  }

  // Check if Receipts header exists
  const recCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAMES.DAYBOOK_RECEIPTS}'!A1:G2`,
  });

  if (!recCheck.data.values || recCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.DAYBOOK_RECEIPTS}'!A1:G2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: daybookReceiptsHeader },
    });
  }

  // Check Account Statement
  const stateCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAMES.ACCOUNT_STATEMENT}'!A1:F14`,
  });

  if (!stateCheck.data.values || stateCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.ACCOUNT_STATEMENT}'!A1:F14`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: accountStatementTemplate },
    });
  }

  return { success: true, message: 'Google Sheets initialized successfully.' };
}

/**
 * Record a new transaction into Daybook and Ledger
 */
export async function addTransaction(transaction: ExtractedTransaction) {
  const auth = getGoogleAuth();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!auth || !spreadsheetId) {
    throw new Error('Google Sheets credentials are not configured in environment variables.');
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const isPayment = transaction.type === 'PAYMENT';
  const targetSheet = isPayment ? SHEET_NAMES.DAYBOOK_PAYMENTS : SHEET_NAMES.DAYBOOK_RECEIPTS;

  // 1. Get current row count to compute next Sl. No. and row index
  const existingRows = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${targetSheet}'!A3:G`,
  });

  const rowCount = existingRows.data.values?.length || 0;
  const slNo = rowCount + 1;

  // If voucher/receipt no is empty or auto, assign next sequential number
  let refNo = transaction.voucherOrReceiptNo;
  if (!refNo || refNo.toLowerCase() === 'auto' || refNo.trim() === '') {
    refNo = String(slNo);
  }

  const newRow = [
    slNo,
    transaction.date,
    transaction.item,
    refNo,
    transaction.amount,
    transaction.remarks || 'Nil',
    transaction.category || (isPayment ? 'Miscellaneous' : 'Other Receipts'),
  ];

  // 2. Append to Daybook
  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${targetSheet}'!A3:G`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [newRow],
    },
  });

  // 3. Update or sync the Ledger sheet
  await syncLedgerEntry(sheets, spreadsheetId, transaction, isPayment, slNo, refNo);

  return {
    success: true,
    slNo,
    refNo,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    updatedRange: appendRes.data.updates?.updatedRange,
  };
}

/**
 * Update an existing transaction in Daybook
 */
export async function updateTransaction(payload: UpdateTransactionPayload) {
  const auth = getGoogleAuth();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!auth || !spreadsheetId) {
    throw new Error('Google Sheets credentials are not configured in environment variables.');
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const isPayment = payload.type === 'PAYMENT';
  const targetSheet = isPayment ? SHEET_NAMES.DAYBOOK_PAYMENTS : SHEET_NAMES.DAYBOOK_RECEIPTS;

  // Read column A to find matching row index for slNo
  const existingRowsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${targetSheet}'!A3:A`,
  });

  const rows = existingRowsRes.data.values || [];
  let foundRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(payload.slNo).trim()) {
      foundRowIndex = i + 3; // Row 1 is Title, Row 2 is Header, Row 3 is index 0
      break;
    }
  }

  const targetRowNumber = foundRowIndex > 0 ? foundRowIndex : payload.slNo + 2;

  const updatedValues = [
    payload.slNo,
    payload.date,
    payload.item,
    String(payload.voucherOrReceiptNo),
    payload.amount,
    payload.remarks || 'Nil',
    payload.category,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${targetSheet}'!A${targetRowNumber}:G${targetRowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [updatedValues],
    },
  });

  return {
    success: true,
    message: `Updated row #${payload.slNo} successfully in ${targetSheet}`,
    rowNumber: targetRowNumber,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

/**
 * Delete a transaction by Sl. No.
 */
export async function deleteTransaction(type: 'PAYMENT' | 'RECEIPT', slNo: number) {
  const auth = getGoogleAuth();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!auth || !spreadsheetId) {
    throw new Error('Google Sheets credentials are not configured in environment variables.');
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const isPayment = type === 'PAYMENT';
  const targetSheet = isPayment ? SHEET_NAMES.DAYBOOK_PAYMENTS : SHEET_NAMES.DAYBOOK_RECEIPTS;

  // Read column A to find matching row
  const existingRowsRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${targetSheet}'!A3:A`,
  });

  const rows = existingRowsRes.data.values || [];
  let foundRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(slNo).trim()) {
      foundRowIndex = i + 3;
      break;
    }
  }

  const targetRowNumber = foundRowIndex > 0 ? foundRowIndex : slNo + 2;

  // Clear that row
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${targetSheet}'!A${targetRowNumber}:G${targetRowNumber}`,
  });

  return {
    success: true,
    message: `Cleared row #${slNo} in ${targetSheet}`,
  };
}

/**
 * Sync entry to the corresponding Ledger sheet category section
 */
async function syncLedgerEntry(
  sheets: any,
  spreadsheetId: string,
  tx: ExtractedTransaction,
  isPayment: boolean,
  slNo: number,
  refNo: string
) {
  const ledgerSheet = isPayment ? SHEET_NAMES.LEDGER_PAYMENTS : SHEET_NAMES.LEDGER_RECEIPTS;

  // Append a summary row into the Ledger
  const ledgerRow = [
    tx.category || (isPayment ? 'Miscellaneous' : 'Other Receipts'),
    tx.date,
    tx.item,
    refNo,
    tx.amount,
    tx.remarks || '',
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${ledgerSheet}'!A:F`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [ledgerRow],
      },
    });
  } catch (err) {
    console.warn('Could not sync to Ledger sheet:', err);
  }
}

/**
 * Fetch recent records from Daybook Payments and Daybook Receipts
 */
export async function getRecentTransactions() {
  const auth = getGoogleAuth();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!auth || !spreadsheetId) {
    return { payments: [], receipts: [], isConfigured: false };
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const [paymentsRes, receiptsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${SHEET_NAMES.DAYBOOK_PAYMENTS}'!A3:G100`,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${SHEET_NAMES.DAYBOOK_RECEIPTS}'!A3:G100`,
      }),
    ]);

    const payments = (paymentsRes.data.values || []).map((row) => ({
      slNo: Number(row[0]) || 0,
      date: row[1] || '',
      item: row[2] || '',
      voucherNo: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      remarks: row[5] || '',
      category: row[6] || 'Miscellaneous',
    }));

    const receipts = (receiptsRes.data.values || []).map((row) => ({
      slNo: Number(row[0]) || 0,
      date: row[1] || '',
      item: row[2] || '',
      receiptNo: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      remarks: row[5] || '',
      category: row[6] || 'Donation',
    }));

    return { payments, receipts, isConfigured: true };
  } catch (err) {
    console.error('Error fetching sheets data:', err);
    return { payments: [], receipts: [], isConfigured: true, error: (err as any).message };
  }
}
