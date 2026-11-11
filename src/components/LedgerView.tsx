'use client';

import React, { useState } from 'react';
import { Layers, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { PaymentEntry, ReceiptEntry } from '@/types/accounting';

interface LedgerViewProps {
  payments: PaymentEntry[];
  receipts: ReceiptEntry[];
}

export default function LedgerView({ payments, receipts }: LedgerViewProps) {
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'RECEIPT'>('PAYMENT');

  const isPayment = activeTab === 'PAYMENT';

  // Group payments by category
  const groupedPayments = payments.reduce((acc, curr) => {
    const cat = curr.category || 'Miscellaneous';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, PaymentEntry[]>);

  // Group receipts by category
  const groupedReceipts = receipts.reduce((acc, curr) => {
    const cat = curr.category || 'Other Receipts';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, ReceiptEntry[]>);

  const currentGroups = isPayment ? groupedPayments : groupedReceipts;
  const groupKeys = Object.keys(currentGroups);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Switcher */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Ledger ({isPayment ? 'Payments' : 'Receipts'})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grouped by Account Heads with category subtotals
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENT')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              isPayment
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Ledger (Payments)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RECEIPT')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              !isPayment
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Ledger (Receipts)
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {groupKeys.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No entries to categorize in this ledger yet.
          </div>
        ) : (
          groupKeys.map((groupName, gIdx) => {
            const items = currentGroups[groupName];
            const groupSubtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);

            return (
              <div
                key={groupName}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-xs"
              >
                {/* Category Header */}
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 text-sm border-b border-slate-200 flex justify-between items-center">
                  <span>
                    {gIdx + 1}) {groupName}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {items.length} {items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Category Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3 w-16 text-center border-r border-slate-200">
                          Sl. No
                        </th>
                        <th className="py-2 px-4 w-28 border-r border-slate-200">Date</th>
                        <th className="py-2 px-4 border-r border-slate-200">Item</th>
                        <th className="py-2 px-3 w-28 text-center border-r border-slate-200">
                          {isPayment ? 'Voucher No.' : 'Receipt no.'}
                        </th>
                        <th className="py-2 px-4 w-32 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((row, idx) => {
                        const ref = isPayment
                          ? (row as PaymentEntry).voucherNo
                          : (row as ReceiptEntry).receiptNo;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-500 font-mono border-r border-slate-100">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-4 text-slate-700 whitespace-nowrap border-r border-slate-100">
                              {row.date}
                            </td>
                            <td className="py-2 px-4 text-slate-900 font-medium border-r border-slate-100">
                              {row.item}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-700 font-mono border-r border-slate-100">
                              {ref}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                              {Number(row.amount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-100/70 font-bold text-slate-900 border-t border-amber-200">
                        <td colSpan={4} className="py-2 px-4 text-right uppercase tracking-wider text-xs">
                          Total {groupName}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-sm text-indigo-950 font-extrabold">
                          {groupSubtotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

