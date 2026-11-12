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
    <div className="bg-white rounded-2xl shadow-sm border border-cadet/40 overflow-hidden">
      {/* Header with Switcher */}
      <div className="p-6 border-b border-cadet/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gunmetal flex items-center gap-2">
            <Layers className="w-5 h-5 text-cadet-dark" />
            Ledger ({isPayment ? 'Payments' : 'Receipts'})
          </h2>
          <p className="text-xs text-gunmetal/60 mt-0.5">
            Grouped by Account Heads with category subtotals
          </p>
        </div>

        <div className="flex items-center p-1 bg-[#f5f7fa] rounded-lg border border-cadet/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PAYMENT')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              isPayment
                ? 'bg-palepink text-gunmetal shadow-xs border border-palepink-dark'
                : 'text-gunmetal/70 hover:text-gunmetal'
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
                ? 'bg-water text-gunmetal shadow-xs border border-cadet'
                : 'text-gunmetal/70 hover:text-gunmetal'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Ledger (Receipts)
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {groupKeys.length === 0 ? (
          <div className="text-center py-12 text-gunmetal/50 text-sm">
            No entries to categorize in this ledger yet.
          </div>
        ) : (
          groupKeys.map((groupName, gIdx) => {
            const items = currentGroups[groupName];
            const groupSubtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);

            return (
              <div
                key={groupName}
                className="border border-cadet/40 rounded-xl overflow-hidden shadow-xs"
              >
                {/* Category Header */}
                <div className="bg-gunmetal px-4 py-2.5 font-bold text-water text-sm border-b border-gunmetal-light flex justify-between items-center">
                  <span>
                    {gIdx + 1}) {groupName}
                  </span>
                  <span className="text-xs font-medium text-cadet">
                    {items.length} {items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Category Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f5f7fa] text-gunmetal font-semibold border-b border-cadet/30">
                        <th className="py-2 px-3 w-16 text-center border-r border-cadet/30">
                          Sl. No
                        </th>
                        <th className="py-2 px-4 w-28 border-r border-cadet/30">Date</th>
                        <th className="py-2 px-4 border-r border-cadet/30">Item</th>
                        <th className="py-2 px-3 w-28 text-center border-r border-cadet/30">
                          {isPayment ? 'Voucher No.' : 'Receipt no.'}
                        </th>
                        <th className="py-2 px-4 w-32 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cadet/20">
                      {items.map((row, idx) => {
                        const ref = isPayment
                          ? (row as PaymentEntry).voucherNo
                          : (row as ReceiptEntry).receiptNo;
                        return (
                          <tr key={idx} className="hover:bg-water/20 transition-colors">
                            <td className="py-2 px-3 text-center text-gunmetal/70 font-mono border-r border-cadet/20">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-4 text-gunmetal whitespace-nowrap border-r border-cadet/20">
                              {row.date}
                            </td>
                            <td className="py-2 px-4 text-gunmetal font-medium border-r border-cadet/20">
                              {row.item}
                            </td>
                            <td className="py-2 px-3 text-center text-gunmetal/80 font-mono border-r border-cadet/20">
                              {ref}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-gunmetal">
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
                      <tr className="bg-water/80 font-bold text-gunmetal border-t border-cadet">
                        <td colSpan={4} className="py-2 px-4 text-right uppercase tracking-wider text-xs">
                          Total {groupName}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-sm text-gunmetal font-extrabold">
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

