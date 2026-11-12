export type TransactionType = 'PAYMENT' | 'RECEIPT';

export interface PaymentEntry {
  slNo?: number;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  item: string;
  voucherNo: string | number;
  amount: number;
  category: PaymentCategory;
  remarks?: string;
}

export interface ReceiptEntry {
  slNo?: number;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  item: string;
  receiptNo: string | number;
  amount: number;
  category: ReceiptCategory;
  remarks?: string;
}

export type PaymentCategory =
  | 'Farewell Gifts'
  | 'Membership Registration'
  | 'Inauguration Expenses'
  | 'Awareness Program'
  | 'Camp Expenses'
  | 'Bank Charges'
  | 'Miscellaneous'
  | 'Other Expenses';

export type ReceiptCategory =
  | 'Bank Interest'
  | 'Offertory'
  | 'Donation'
  | 'Registration'
  | 'Other Receipts';

export const PAYMENT_CATEGORIES: PaymentCategory[] = [
  'Farewell Gifts',
  'Membership Registration',
  'Inauguration Expenses',
  'Awareness Program',
  'Camp Expenses',
  'Bank Charges',
  'Miscellaneous',
  'Other Expenses',
];

export const RECEIPT_CATEGORIES: ReceiptCategory[] = [
  'Bank Interest',
  'Offertory',
  'Donation',
  'Registration',
  'Other Receipts',
];

export interface ExtractedTransaction {
  type: TransactionType;
  date: string;
  item: string;
  voucherOrReceiptNo: string;
  amount: number;
  category: string;
  remarks: string;
  confidence: number;
  reasoning?: string;
  rawOcrText?: string;
}

export interface UpdateTransactionPayload {
  type: TransactionType;
  slNo: number;
  date: string;
  item: string;
  voucherOrReceiptNo: string | number;
  amount: number;
  category: string;
  remarks?: string;
}

export interface AccountStatementRow {
  category: string;
  budgetAmount: number;
  actualAmount: number;
}

export interface AccountStatementData {
  period: string;
  openingBalance: {
    cashInBank: { budget: number; actual: number };
    cashInHand: { budget: number; actual: number };
  };
  receipts: AccountStatementRow[];
  payments: AccountStatementRow[];
  closingBalance: {
    cashInBank: { budget: number; actual: number };
    cashInHand: { budget: number; actual: number };
  };
  summary: {
    openingBalance: number;
    totalReceipt: number;
    totalPayment: number;
    closingBalance: number;
  };
}

export interface SheetsSyncResult {
  success: boolean;
  message: string;
  sheetUrl?: string;
  rowInserted?: number;
}

// Opening bank balance (actual) — single source of truth until it is stored in the sheet.
export const OPENING_BANK_BALANCE = 103475.35;
