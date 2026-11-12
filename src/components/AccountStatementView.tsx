'use client';

import React, { useState } from 'react';
import { Landmark, Wallet, Scale, ArrowUpRight, ArrowDownLeft, Edit3, Check, X } from 'lucide-react';
import { PaymentEntry, ReceiptEntry, OPENING_BANK_BALANCE } from '@/types/accounting';

interface AccountStatementViewProps {
  payments: PaymentEntry[];
  receipts: ReceiptEntry[];
}

export default function AccountStatementView({
  payments,
  receipts,
}: AccountStatementViewProps) {
  // Opening balance state
  const [openingBankBudget, setOpeningBankBudget] = useState(103475);
  const [openingBankActual, setOpeningBankActual] = useState(OPENING_BANK_BALANCE);
  const [openingCashBudget, setOpeningCashBudget] = useState(0);
  const [openingCashActual, setOpeningCashActual] = useState(0);
  const [closingCashInHand, setClosingCashInHand] = useState(6408);

  const [isEditingBalances, setIsEditingBalances] = useState(false);

  // Calculate actual totals by category
  const getReceiptActual = (categoryRegex: RegExp) => {
    return receipts
      .filter((r) => categoryRegex.test(r.category || ''))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  };

  const getPaymentActual = (categoryRegex: RegExp) => {
    return payments
      .filter((p) => categoryRegex.test(p.category || ''))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  // Receipts Breakdown
  const actualInterest = getReceiptActual(/interest/i);
  const actualOffertory = getReceiptActual(/offertory/i);
  const actualDonations = getReceiptActual(/donation/i);
  const actualRegistrations = getReceiptActual(/registration/i);

  const totalReceiptsActual =
    actualInterest + actualOffertory + actualDonations + actualRegistrations;

  // Payments Breakdown
  const actualFarewell = getPaymentActual(/farewell/i);
  const actualYouthReg = getPaymentActual(/membership|youth/i);
  const actualAwareness = getPaymentActual(/awareness/i);
  const actualBankCharges = getPaymentActual(/bank/i);
  const actualInauguration = getPaymentActual(/inauguration/i);
  const actualCamp = getPaymentActual(/camp/i);
  const actualMisc = getPaymentActual(/miscellaneous|other/i);

  const totalPaymentsActual =
    actualFarewell +
    actualYouthReg +
    actualAwareness +
    actualBankCharges +
    actualInauguration +
    actualCamp +
    actualMisc;

  const totalOpeningActual = openingBankActual + openingCashActual;
  const netClosingBalance = totalOpeningActual + totalReceiptsActual - totalPaymentsActual;

  const closingCashInBank = netClosingBalance - closingCashInHand;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Title Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Account Statement (Financial Year 2026-27)
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Comparative Budget vs. Actual Receipts & Payments Reconciliation
          </p>
        </div>

        {/* Action & Quick Metric */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditingBalances(!isEditingBalances)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition border border-white/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditingBalances ? 'Done Editing' : 'Edit Opening Balances'}
          </button>

          <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <div className="text-[10px] text-slate-300 uppercase tracking-wider">Closing Balance</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              ₹
              {netClosingBalance.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Balances Editor Drawer */}
      {isEditingBalances && (
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 text-xs flex flex-wrap items-center gap-4 animate-in fade-in">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Opening Bank Actual (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={openingBankActual}
              onChange={(e) => setOpeningBankActual(parseFloat(e.target.value) || 0)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-mono font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Opening Cash in Hand (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={openingCashActual}
              onChange={(e) => setOpeningCashActual(parseFloat(e.target.value) || 0)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-mono font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Closing Cash in Hand (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={closingCashInHand}
              onChange={(e) => setClosingCashInHand(parseFloat(e.target.value) || 0)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-mono font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditingBalances(false)}
            className="self-end mb-0.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white font-semibold flex items-center gap-1 hover:bg-indigo-700"
          >
            <Check className="w-3.5 h-3.5" /> Done
          </button>
        </div>
      )}

      {/* Two Column Account Statement Table (Matching Page 11 & 12 of PDF) */}
      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full text-xs border border-slate-200">
          <thead>
            <tr className="bg-slate-700 text-white text-center font-bold">
              <th colSpan={4} className="py-2.5 px-3 border-r border-slate-600 bg-emerald-900/60 uppercase">
                Receipts (Inflow)
              </th>
              <th colSpan={4} className="py-2.5 px-3 bg-rose-900/60 uppercase">
                Payments (Outflow)
              </th>
            </tr>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th className="py-2 px-2 text-center w-8 border-r border-slate-200">#</th>
              <th className="py-2 px-3 text-left border-r border-slate-200">Head</th>
              <th className="py-2 px-3 text-right w-24 border-r border-slate-200">Budget</th>
              <th className="py-2 px-3 text-right w-28 border-r-2 border-slate-300 bg-emerald-50 text-emerald-900">
                Actual
              </th>

              <th className="py-2 px-2 text-center w-8 border-r border-slate-200">#</th>
              <th className="py-2 px-3 text-left border-r border-slate-200">Head</th>
              <th className="py-2 px-3 text-right w-24 border-r border-slate-200">Budget</th>
              <th className="py-2 px-3 text-right w-28 bg-rose-50 text-rose-900">Actual</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-sans">
            {/* Row 1: Opening Bank vs Farewell */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">1</td>
              <td className="py-2 px-3 font-semibold text-slate-800 border-r">
                Opening Balance
                <div className="text-[11px] font-normal text-slate-500 pl-2">• Cash in Bank</div>
              </td>
              <td className="py-2 px-3 text-right font-mono border-r">1,03,475.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/50 text-emerald-900 border-r-2 border-slate-300">
                {openingBankActual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">1</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Farewell</td>
              <td className="py-2 px-3 text-right font-mono border-r">10,000.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualFarewell.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 2: Opening Cash in Hand vs Center Expenses */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center text-slate-400 border-r"></td>
              <td className="py-2 px-3 text-slate-600 border-r pl-5">• Cash in Hand</td>
              <td className="py-2 px-3 text-right font-mono border-r">0.00</td>
              <td className="py-2 px-3 text-right font-mono bg-emerald-50/50 text-emerald-900 border-r-2 border-slate-300">
                {openingCashActual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">2</td>
              <td className="py-2 px-3 font-semibold text-slate-800 border-r">
                Center Expenses
                <div className="text-[11px] font-normal text-slate-500 pl-2">2.1) Youth Registration</div>
              </td>
              <td className="py-2 px-3 text-right font-mono border-r">1,518.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualYouthReg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 3: Bank Interest vs Awareness Expenses */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">2</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Bank Interest</td>
              <td className="py-2 px-3 text-right font-mono border-r">2,896.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/50 text-emerald-900 border-r-2 border-slate-300">
                {actualInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">3</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Awareness Expenses</td>
              <td className="py-2 px-3 text-right font-mono border-r">1,650.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualAwareness.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 4: Offertory vs Bank Charges */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">3</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Offertory</td>
              <td className="py-2 px-3 text-right font-mono border-r">Nil</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/50 text-emerald-900 border-r-2 border-slate-300">
                {actualOffertory.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">4</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Bank Charges</td>
              <td className="py-2 px-3 text-right font-mono border-r">172.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualBankCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 5: Donation Received vs Inauguration Expenses */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">4</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Donation Received</td>
              <td className="py-2 px-3 text-right font-mono border-r">27,500.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/50 text-emerald-900 border-r-2 border-slate-300">
                {actualDonations.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">5</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Inauguration Expenses</td>
              <td className="py-2 px-3 text-right font-mono border-r">6,875.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualInauguration.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 6: Camp Registration vs Camp Expenses */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">5</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Camp Registration</td>
              <td className="py-2 px-3 text-right font-mono border-r">40,000.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/50 text-emerald-900 border-r-2 border-slate-300">
                {actualRegistrations.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">6</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Camp Expenses</td>
              <td className="py-2 px-3 text-right font-mono border-r">1,50,000.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualCamp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 7: Blank vs Miscellaneous */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center border-r"></td>
              <td className="py-2 px-3 border-r"></td>
              <td className="py-2 px-3 border-r"></td>
              <td className="py-2 px-3 border-r-2 border-slate-300 bg-emerald-50/30"></td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">7</td>
              <td className="py-2 px-3 font-medium text-slate-800 border-r">Miscellaneous</td>
              <td className="py-2 px-3 text-right font-mono border-r">7,056.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-rose-50/50 text-rose-900">
                {actualMisc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 8: Blank vs Closing Balance */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center border-r"></td>
              <td className="py-2 px-3 border-r"></td>
              <td className="py-2 px-3 border-r"></td>
              <td className="py-2 px-3 border-r-2 border-slate-300 bg-emerald-50/30"></td>

              <td className="py-2 px-2 text-center font-bold text-slate-500 border-r">8</td>
              <td className="py-2 px-3 font-semibold text-slate-800 border-r">
                Closing Balance
                <div className="text-[11px] font-normal text-slate-500 pl-2">• Cash in Bank</div>
              </td>
              <td className="py-2 px-3 text-right font-mono border-r">1,13,822.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/70 text-emerald-950">
                {closingCashInBank.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>

            {/* Row 9: Cash in Hand closing */}
            <tr className="hover:bg-slate-50">
              <td className="py-2 px-2 text-center border-r"></td>
              <td className="py-2 px-3 border-r"></td>
              <td className="py-2 px-3 border-r"></td>
              <td className="py-2 px-3 border-r-2 border-slate-300 bg-emerald-50/30"></td>

              <td className="py-2 px-2 text-center border-r"></td>
              <td className="py-2 px-3 text-slate-600 border-r pl-5">• Cash in Hand</td>
              <td className="py-2 px-3 text-right font-mono border-r">1,000.00</td>
              <td className="py-2 px-3 text-right font-mono font-semibold bg-emerald-50/70 text-emerald-950">
                {closingCashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>

          {/* Totals Footer matching Page 11 & 12 */}
          <tfoot>
            <tr className="bg-amber-100 font-extrabold text-slate-900 border-t-2 border-slate-400">
              <td colSpan={2} className="py-2.5 px-3 uppercase text-right border-r border-amber-200">
                Total Receipts
              </td>
              <td className="py-2.5 px-3 text-right font-mono border-r border-amber-200">
                1,73,871.00
              </td>
              <td className="py-2.5 px-3 text-right font-mono border-r-2 border-slate-400 bg-amber-200/60 text-indigo-950">
                {(totalOpeningActual + totalReceiptsActual).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </td>

              <td colSpan={2} className="py-2.5 px-3 uppercase text-right border-r border-amber-200">
                Total Payments
              </td>
              <td className="py-2.5 px-3 text-right font-mono border-r border-amber-200">
                2,92,093.00
              </td>
              <td className="py-2.5 px-3 text-right font-mono bg-amber-200/60 text-indigo-950">
                {(totalPaymentsActual + netClosingBalance).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Reconciliation Summary Card (Matching box on page 11 & 12) */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Account Reconciliation Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Opening Balance</span>
            <div className="text-base font-bold font-mono text-slate-900 mt-1">
              ₹{totalOpeningActual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Total Receipts
            </span>
            <div className="text-base font-bold font-mono text-emerald-800 mt-1">
              ₹{totalReceiptsActual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
            <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Total Payments
            </span>
            <div className="text-base font-bold font-mono text-rose-800 mt-1">
              ₹{totalPaymentsActual.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-xs">
            <span className="text-xs text-indigo-800 font-semibold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Closing Balance
            </span>
            <div className="text-base font-bold font-mono text-indigo-950 mt-1">
              ₹{netClosingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
