'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Scale,
  Settings,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';

import CaptureInput from '@/components/CaptureInput';
import DaybookTable from '@/components/DaybookTable';
import LedgerView from '@/components/LedgerView';
import AccountStatementView from '@/components/AccountStatementView';
import ConfigGuideModal from '@/components/ConfigGuideModal';

import {
  PaymentEntry,
  ReceiptEntry,
  ExtractedTransaction,
} from '@/types/accounting';

// Initial sample data faithfully matching the user's attached document
const INITIAL_PAYMENTS: PaymentEntry[] = [
  { slNo: 1, date: '19/4/26', item: 'Farewell for Achens', voucherNo: 1, amount: 10000, category: 'Farewell Gifts', remarks: 'Nil' },
  { slNo: 2, date: '13/4/26', item: 'Youth Registration - Centre', voucherNo: 2, amount: 1380, category: 'Membership Registration', remarks: 'Nil' },
  { slNo: 3, date: '19/4/26', item: 'Inaugration expense (Election Meeting)', voucherNo: 3, amount: 2500, category: 'Inauguration Expenses', remarks: 'Nil' },
  { slNo: 4, date: '26/6/26', item: 'Snacks for Yuvajana Sakhyam Inaugration - PazhamPori', voucherNo: 4, amount: 1700, category: 'Inauguration Expenses', remarks: 'Snack Reciept' },
  { slNo: 5, date: '27/6/26', item: 'Lucky Bamboo for Chief Guest', voucherNo: 5, amount: 249, category: 'Inauguration Expenses', remarks: 'Lucky Bamboo' },
  { slNo: 6, date: '28/6/26', item: 'Milk (3 liter) - Ouseph Cv (Care Taker)', voucherNo: 6, amount: 210, category: 'Inauguration Expenses', remarks: 'Nil' },
  { slNo: 7, date: '7/4/2026', item: "Mugs (Doctor's Day)", voucherNo: 7, amount: 13760, category: 'Awareness Program', remarks: 'Mug Reciept' },
  { slNo: 8, date: '8/15/2026', item: 'Camp Expenses (Ramakkalmedu)', voucherNo: 8, amount: 1000, category: 'Camp Expenses', remarks: 'Ramakkalmedu' },
  { slNo: 9, date: '8/12/2026', item: 'Camp Expenses (Complimentary)', voucherNo: 9, amount: 2502, category: 'Camp Expenses', remarks: 'Complimentary' },
  { slNo: 10, date: '8/15/2026', item: 'Camp Expenses (Petrol)', voucherNo: 10, amount: 14300, category: 'Camp Expenses', remarks: 'Petrol' },
  { slNo: 11, date: '8/16/2026', item: 'Camp Expenses (TA for Rev.VIjay)', voucherNo: 11, amount: 1500, category: 'Camp Expenses', remarks: 'Nil' },
  { slNo: 12, date: '8/16/2026', item: 'Camp Expenses (TA for Rev.Jebin)', voucherNo: 12, amount: 1500, category: 'Camp Expenses', remarks: 'Nil' },
  { slNo: 13, date: '8/16/2026', item: 'Camp Expenses (Donation for MarThoma Navodaya Society)', voucherNo: 13, amount: 4000, category: 'Camp Expenses', remarks: 'Donation' },
  { slNo: 14, date: '8/15/2026', item: 'Camp Expenses (Tip for Thekkady Mar Thoma Meadows)', voucherNo: 14, amount: 2000, category: 'Camp Expenses', remarks: 'Nil' },
  { slNo: 15, date: '8/14/2026', item: 'Camp Expenses (Dinner)', voucherNo: 15, amount: 7764, category: 'Camp Expenses', remarks: 'Dinner' },
  { slNo: 16, date: '8/14/2026', item: 'Camp Expenses (Gift)', voucherNo: 16, amount: 100, category: 'Camp Expenses', remarks: 'GIFT' },
  { slNo: 17, date: '8/15/2026', item: 'Camp Expenses (Water Bottles)', voucherNo: 17, amount: 810, category: 'Camp Expenses', remarks: 'WATER' },
  { slNo: 18, date: '8/15/2026', item: 'Camp Expenses (Thekkady Mar Thoma Meadows)', voucherNo: 18, amount: 88100, category: 'Camp Expenses', remarks: 'Thekkady MT Meadows' },
  { slNo: 19, date: '8/3/2026', item: 'Camp Expenses (Bus Advance)', voucherNo: 19, amount: 5000, category: 'Camp Expenses', remarks: 'Bus Advance' },
  { slNo: 20, date: '7/7/2026', item: 'Charges for PORD Customer payment', voucherNo: 20, amount: 5.61, category: 'Bank Charges', remarks: 'PORD' },
  { slNo: 21, date: '8/17/2026', item: 'Camp Expenses (Bus)', voucherNo: 21, amount: 22000, category: 'Camp Expenses', remarks: 'Bus' },
  { slNo: 22, date: '9/25/2026', item: 'SMS Charges for Sept 2026', voucherNo: 22, amount: 17.11, category: 'Bank Charges', remarks: 'SMS Charges' },
  { slNo: 23, date: '8/29/2026', item: 'Roses for Parish Day', voucherNo: 23, amount: 750.22, category: 'Miscellaneous', remarks: 'Nil' },
  { slNo: 24, date: '8/29/2026', item: 'Tape and Ribbon', voucherNo: 24, amount: 275, category: 'Miscellaneous', remarks: 'Tape' },
  { slNo: 25, date: '08/17/2026', item: 'Charges for PORD Customer payment', voucherNo: 25, amount: 5.61, category: 'Bank Charges', remarks: 'Nil' },
  { slNo: 26, date: '08/17/2026', item: 'Charges for PORD Customer payment', voucherNo: 26, amount: 5.61, category: 'Bank Charges', remarks: 'Nil' },
];

const INITIAL_RECEIPTS: ReceiptEntry[] = [
  { slNo: 1, date: '4/3/2026', item: 'Union Bank of India (Bank Interest)', receiptNo: 70, amount: 639, category: 'Bank Interest' },
  { slNo: 2, date: '6/28/2026', item: 'C M Philipose (offertory)', receiptNo: 67, amount: 151, category: 'Offertory' },
  { slNo: 3, date: '6/29/2026', item: 'Shiju K Varghese (for Inaugration Program Expenses)', receiptNo: 66, amount: 5000, category: 'Donation' },
  { slNo: 4, date: '7/3/2026', item: 'Union Bank of India (Bank Interest)', receiptNo: 71, amount: 585, category: 'Bank Interest' },
  { slNo: 5, date: '7/4/2026', item: "Ashok Kankalil Titus (Donation for Doctor's Day Mugs)", receiptNo: 65, amount: 13760, category: 'Donation' },
  { slNo: 6, date: '7/5/2026', item: 'C M Philipose (offertory)', receiptNo: 69, amount: 151, category: 'Offertory' },
  { slNo: 7, date: '7/26/2026', item: 'Cottage Prayer (Offertory)', receiptNo: 68, amount: 1570, category: 'Offertory' },
  { slNo: 8, date: '8/2/2026', item: 'Naiju Nelson (Camp Donation)', receiptNo: 72, amount: 2000, category: 'Donation' },
  { slNo: 9, date: '8/2/2026', item: 'Nivin Philip (Camp Donation)', receiptNo: 73, amount: 5000, category: 'Donation' },
  { slNo: 10, date: '8/2/2026', item: 'Jaybi Varghese (Camp Donation)', receiptNo: 74, amount: 4000, category: 'Donation' },
  { slNo: 11, date: '8/2/2026', item: 'Shanu Jacob (Camp Donation)', receiptNo: 75, amount: 1200, category: 'Donation' },
  { slNo: 12, date: '8/2/2026', item: 'Joby Jacob (Camp Donation)', receiptNo: 76, amount: 1000, category: 'Donation' },
  { slNo: 13, date: '8/2/2026', item: 'Jaivee Joseph (Camp Donation)', receiptNo: 77, amount: 4000, category: 'Donation' },
  { slNo: 14, date: '8/3/2026', item: 'Amith Jose (Camp Donation)', receiptNo: 78, amount: 5000, category: 'Donation' },
  { slNo: 15, date: '8/3/2026', item: 'Varghese Abraham (Camp Donation)', receiptNo: 79, amount: 3000, category: 'Donation' },
  { slNo: 16, date: '8/3/2026', item: 'Mathew Philip (Camp Donation)', receiptNo: 80, amount: 6800, category: 'Donation' },
  { slNo: 17, date: '8/3/2026', item: 'Anoop Mathew Philip (Camp Donation)', receiptNo: 81, amount: 4000, category: 'Donation' },
  { slNo: 18, date: '8/2/2026', item: 'Rev. Blesson Philip (Camp Donation)', receiptNo: 82, amount: 2000, category: 'Donation' },
  { slNo: 19, date: '8/2/2026', item: 'Samuel Varghese (Camp Donation)', receiptNo: 83, amount: 2000, category: 'Donation' },
  { slNo: 20, date: '8/1/2026', item: 'Arun K Joy (Camp Donation)', receiptNo: 84, amount: 4000, category: 'Donation' },
  { slNo: 21, date: '8/3/2026', item: 'Biji V Samuel (Camp Donation)', receiptNo: 85, amount: 4000, category: 'Donation' },
  { slNo: 22, date: '8/3/2026', item: 'Reejo (Camp Donation)', receiptNo: 86, amount: 4000, category: 'Donation' },
  { slNo: 23, date: '8/4/2026', item: 'Zachariah Varghese (Camp Donation)', receiptNo: 87, amount: 2500, category: 'Donation' },
  { slNo: 24, date: '8/4/2026', item: 'Kevin Mathew Ajit (Camp Donation)', receiptNo: 88, amount: 3000, category: 'Donation' },
  { slNo: 25, date: '7/31/2026', item: 'Joshua Titus Varghese (Camp Registration)', receiptNo: 89, amount: 1500, category: 'Registration' },
  { slNo: 26, date: '7/31/2026', item: 'Jacob Varghese (Camp Registration)', receiptNo: 90, amount: 1500, category: 'Registration' },
  { slNo: 27, date: '7/31/2026', item: 'Anne Sara Cherian (Camp Registration)', receiptNo: 91, amount: 1500, category: 'Registration' },
  { slNo: 28, date: '8/1/2026', item: 'Abel Philip Antony (Camp Registration)', receiptNo: 93, amount: 1500, category: 'Registration' },
  { slNo: 29, date: '8/1/2026', item: 'Shawn Varghese (Camp Registration)', receiptNo: 94, amount: 1500, category: 'Registration' },
  { slNo: 30, date: '8/1/2026', item: 'Alan Tom David (Camp Registration)', receiptNo: 95, amount: 1500, category: 'Registration' },
  { slNo: 31, date: '8/1/2026', item: 'Deepak Oommen Siju (Camp Registration)', receiptNo: 96, amount: 1500, category: 'Registration' },
  { slNo: 32, date: '8/1/2026', item: 'Judith Liza Joshy (Camp Registration)', receiptNo: 97, amount: 1500, category: 'Registration' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    'capture' | 'daybook-payments' | 'daybook-receipts' | 'ledger' | 'statement'
  >('capture');

  const [payments, setPayments] = useState<PaymentEntry[]>(INITIAL_PAYMENTS);
  const [receipts, setReceipts] = useState<ReceiptEntry[]>(INITIAL_RECEIPTS);
  const [isConfigGuideOpen, setIsConfigGuideOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | undefined>(undefined);

  // Fetch real Google Sheets data on mount
  useEffect(() => {
    fetchSheetsData();
  }, []);

  const fetchSheetsData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets/data');
      const data = await res.json();
      if (data.isConfigured) {
        setIsConfigured(true);
        if (data.payments && data.payments.length > 0) setPayments(data.payments);
        if (data.receipts && data.receipts.length > 0) setReceipts(data.receipts);
      }
    } catch (e) {
      console.warn('Could not connect to live sheets:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTransactionSaved = (tx: ExtractedTransaction) => {
    if (tx.type === 'PAYMENT') {
      const newEntry: PaymentEntry = {
        slNo: payments.length + 1,
        date: tx.date,
        item: tx.item,
        voucherNo: tx.voucherOrReceiptNo === 'auto' ? payments.length + 1 : tx.voucherOrReceiptNo,
        amount: tx.amount,
        category: (tx.category as any) || 'Miscellaneous',
        remarks: tx.remarks,
      };
      setPayments((prev) => [...prev, newEntry]);
      setActiveTab('daybook-payments');
    } else {
      const newEntry: ReceiptEntry = {
        slNo: receipts.length + 1,
        date: tx.date,
        item: tx.item,
        receiptNo: tx.voucherOrReceiptNo === 'auto' ? receipts.length + 1 : tx.voucherOrReceiptNo,
        amount: tx.amount,
        category: (tx.category as any) || 'Donation',
        remarks: tx.remarks,
      };
      setReceipts((prev) => [...prev, newEntry]);
      setActiveTab('daybook-receipts');
    }
  };

  const handleUpdateTransaction = (
    type: 'PAYMENT' | 'RECEIPT',
    updated: PaymentEntry | ReceiptEntry
  ) => {
    if (type === 'PAYMENT') {
      setPayments((prev) =>
        prev.map((item) => (item.slNo === updated.slNo ? (updated as PaymentEntry) : item))
      );
    } else {
      setReceipts((prev) =>
        prev.map((item) => (item.slNo === updated.slNo ? (updated as ReceiptEntry) : item))
      );
    }
  };

  const handleDeleteTransaction = (type: 'PAYMENT' | 'RECEIPT', slNo: number) => {
    if (type === 'PAYMENT') {
      setPayments((prev) => prev.filter((item) => item.slNo !== slNo));
    } else {
      setReceipts((prev) => prev.filter((item) => item.slNo !== slNo));
    }
  };

  const handleAddTransaction = (
    type: 'PAYMENT' | 'RECEIPT',
    newEntry: PaymentEntry | ReceiptEntry
  ) => {
    if (type === 'PAYMENT') {
      setPayments((prev) => [...prev, newEntry as PaymentEntry]);
    } else {
      setReceipts((prev) => [...prev, newEntry as ReceiptEntry]);
    }
  };

  const totalPayments = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalReceipts = receipts.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netClosingBalance = 103475.35 + totalReceipts - totalPayments;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md font-extrabold text-lg">
              AB
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight flex items-center gap-2">
                AgentBuddy Accounting
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-200">
                  Google Sheets Agent
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Daybook • Ledger • Account Statement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Badge */}
            <button
              onClick={() => setIsConfigGuideOpen(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition ${
                isConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="hidden md:inline">
                {isConfigured ? 'Sheets Connected' : 'Demo / Configure Sheets'}
              </span>
              <Settings className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Refresh */}
            <button
              onClick={fetchSheetsData}
              title="Refresh Sheets Data"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Quick Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Daybook Receipts</span>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                ₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Daybook Payments</span>
              <div className="text-lg font-bold font-mono text-rose-600 mt-0.5">
                ₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Closing Balance</span>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                ₹{netClosingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-2">
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'capture'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              Capture Voucher / OCR
            </button>

            <button
              onClick={() => setActiveTab('daybook-payments')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'daybook-payments'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              Daybook - Payments ({payments.length})
            </button>

            <button
              onClick={() => setActiveTab('daybook-receipts')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'daybook-receipts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              Daybook - Receipts ({receipts.length})
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Ledger Head Groups
            </button>

            <button
              onClick={() => setActiveTab('statement')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'statement'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Scale className="w-4 h-4" />
              Account Statement
            </button>
          </nav>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === 'capture' && (
            <CaptureInput onTransactionSaved={handleTransactionSaved} />
          )}

          {activeTab === 'daybook-payments' && (
            <DaybookTable
              type="PAYMENT"
              payments={payments}
              receipts={receipts}
              spreadsheetUrl={spreadsheetUrl}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'daybook-receipts' && (
            <DaybookTable
              type="RECEIPT"
              payments={payments}
              receipts={receipts}
              spreadsheetUrl={spreadsheetUrl}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerView payments={payments} receipts={receipts} />
          )}

          {activeTab === 'statement' && (
            <AccountStatementView payments={payments} receipts={receipts} />
          )}
        </div>
      </main>

      {/* Guide Modal */}
      <ConfigGuideModal
        isOpen={isConfigGuideOpen}
        onClose={() => setIsConfigGuideOpen(false)}
        isConfigured={isConfigured}
      />
    </div>
  );
}

