'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Edit3,
  Trash2,
  PlusCircle,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  PaymentEntry,
  ReceiptEntry,
  PAYMENT_CATEGORIES,
  RECEIPT_CATEGORIES,
  UpdateTransactionPayload,
} from '@/types/accounting';

interface DaybookTableProps {
  type: 'PAYMENT' | 'RECEIPT';
  payments: PaymentEntry[];
  receipts: ReceiptEntry[];
  spreadsheetUrl?: string;
  onUpdateTransaction: (
    type: 'PAYMENT' | 'RECEIPT',
    updated: PaymentEntry | ReceiptEntry
  ) => void;
  onDeleteTransaction: (type: 'PAYMENT' | 'RECEIPT', slNo: number) => void;
  onAddTransaction: (
    type: 'PAYMENT' | 'RECEIPT',
    newEntry: PaymentEntry | ReceiptEntry
  ) => void;
}

interface EditFormState {
  isNew: boolean;
  slNo: number;
  date: string;
  item: string;
  voucherOrReceiptNo: string;
  amount: number;
  category: string;
  remarks: string;
}

export default function DaybookTable({
  type,
  payments,
  receipts,
  spreadsheetUrl,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
}: DaybookTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<EditFormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isPayment = type === 'PAYMENT';
  const rawData = isPayment ? payments : receipts;

  const filteredData = rawData.filter((item) => {
    const term = searchTerm.toLowerCase();
    const itemName = item.item.toLowerCase();
    const remarks = item.remarks?.toLowerCase() || '';
    const ref = String(
      isPayment ? (item as PaymentEntry).voucherNo : (item as ReceiptEntry).receiptNo
    );
    return itemName.includes(term) || remarks.includes(term) || ref.includes(term);
  });

  const totalAmount = filteredData.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const currentCategories = isPayment ? PAYMENT_CATEGORIES : RECEIPT_CATEGORIES;

  // Open edit modal for existing row
  const handleStartEdit = (row: PaymentEntry | ReceiptEntry, index: number) => {
    const slNo = row.slNo || index + 1;
    const refNo = String(
      isPayment ? (row as PaymentEntry).voucherNo : (row as ReceiptEntry).receiptNo
    );

    setEditingItem({
      isNew: false,
      slNo,
      date: row.date,
      item: row.item,
      voucherOrReceiptNo: refNo,
      amount: row.amount,
      category: row.category || (isPayment ? 'Miscellaneous' : 'Other Receipts'),
      remarks: row.remarks || 'Nil',
    });
    setFeedback(null);
  };

  // Open modal to add a brand new row manually
  const handleStartAdd = () => {
    const nextSl = rawData.length + 1;
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    setEditingItem({
      isNew: true,
      slNo: nextSl,
      date: dateStr,
      item: '',
      voucherOrReceiptNo: String(nextSl),
      amount: 0,
      category: isPayment ? 'Miscellaneous' : 'Donation',
      remarks: 'Nil',
    });
    setFeedback(null);
  };

  // Save changes (either PUT update or POST new)
  const handleSaveModal = async () => {
    if (!editingItem) return;

    if (!editingItem.item.trim()) {
      setFeedback({ type: 'error', message: 'Item description cannot be empty.' });
      return;
    }

    if (editingItem.amount <= 0) {
      setFeedback({ type: 'error', message: 'Amount must be greater than zero.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingItem.isNew) {
        // Create new
        const response = await fetch('/api/sheets/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            date: editingItem.date,
            item: editingItem.item,
            voucherOrReceiptNo: editingItem.voucherOrReceiptNo,
            amount: editingItem.amount,
            category: editingItem.category,
            remarks: editingItem.remarks,
          }),
        });

        const res = await response.json();
        if (!response.ok) throw new Error(res.error || 'Failed to add entry');

        const newRow: any = isPayment
          ? {
              slNo: editingItem.slNo,
              date: editingItem.date,
              item: editingItem.item,
              voucherNo: editingItem.voucherOrReceiptNo,
              amount: editingItem.amount,
              category: editingItem.category,
              remarks: editingItem.remarks,
            }
          : {
              slNo: editingItem.slNo,
              date: editingItem.date,
              item: editingItem.item,
              receiptNo: editingItem.voucherOrReceiptNo,
              amount: editingItem.amount,
              category: editingItem.category,
              remarks: editingItem.remarks,
            };

        onAddTransaction(type, newRow);
        setEditingItem(null);
      } else {
        // Update existing row
        const payload: UpdateTransactionPayload = {
          type,
          slNo: editingItem.slNo,
          date: editingItem.date,
          item: editingItem.item,
          voucherOrReceiptNo: editingItem.voucherOrReceiptNo,
          amount: editingItem.amount,
          category: editingItem.category,
          remarks: editingItem.remarks,
        };

        const response = await fetch('/api/sheets/transaction', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const res = await response.json();
        if (!response.ok) throw new Error(res.error || 'Failed to update entry');

        const updatedRow: any = isPayment
          ? {
              slNo: editingItem.slNo,
              date: editingItem.date,
              item: editingItem.item,
              voucherNo: editingItem.voucherOrReceiptNo,
              amount: editingItem.amount,
              category: editingItem.category,
              remarks: editingItem.remarks,
            }
          : {
              slNo: editingItem.slNo,
              date: editingItem.date,
              item: editingItem.item,
              receiptNo: editingItem.voucherOrReceiptNo,
              amount: editingItem.amount,
              category: editingItem.category,
              remarks: editingItem.remarks,
            };

        onUpdateTransaction(type, updatedRow);
        setEditingItem(null);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error occurred while saving.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete row
  const handleDeleteRow = async (slNo: number, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove row #${slNo} ("${itemTitle}")?`)) {
      return;
    }

    try {
      await fetch(`/api/sheets/transaction?type=${type}&slNo=${slNo}`, {
        method: 'DELETE',
      });
      onDeleteTransaction(type, slNo);
    } catch (err) {
      console.error('Delete error:', err);
      // Still update UI
      onDeleteTransaction(type, slNo);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {isPayment ? (
              <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <ArrowUpRight className="w-5 h-5" />
              </span>
            ) : (
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowDownLeft className="w-5 h-5" />
              </span>
            )}
            Day - Book ({isPayment ? 'Payments' : 'Receipts'})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with Google Sheets • {filteredData.length} entries • Click <strong>Edit</strong> on any row to modify values
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search voucher, item, date..."
              className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* Add Entry Button */}
          <button
            type="button"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Entry
          </button>

          {/* Open Google Sheets direct link */}
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition"
              title="Open full Google Spreadsheet in new tab"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Edit in Sheets
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
        </div>
      </div>

      {/* Styled Table matching the PDF */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-700 text-white font-semibold border-b border-slate-600">
              <th className="py-2.5 px-3 w-14 text-center border-r border-slate-600">Sl. No.</th>
              <th className="py-2.5 px-3 w-28 border-r border-slate-600">Date</th>
              <th className="py-2.5 px-4 border-r border-slate-600">Item / Description</th>
              <th className="py-2.5 px-3 w-24 text-center border-r border-slate-600">
                {isPayment ? 'Voucher No.' : 'Receipt no.'}
              </th>
              <th className="py-2.5 px-4 w-32 text-right border-r border-slate-600">Amount (₹)</th>
              <th className="py-2.5 px-3 w-32 border-r border-slate-600">Category</th>
              {isPayment && <th className="py-2.5 px-3 w-28 border-r border-slate-600">Remarks</th>}
              <th className="py-2.5 px-3 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={isPayment ? 8 : 7}
                  className="py-12 text-center text-slate-400 text-sm italic"
                >
                  No transactions found matching your filter.
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => {
                const sl = row.slNo || idx + 1;
                const ref = isPayment
                  ? (row as PaymentEntry).voucherNo
                  : (row as ReceiptEntry).receiptNo;

                return (
                  <tr
                    key={sl}
                    className="hover:bg-indigo-50/40 transition-colors border-b border-slate-100 group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono border-r border-slate-100 font-medium">
                      {sl}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap border-r border-slate-100">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-medium border-r border-slate-100">
                      {row.item}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-mono border-r border-slate-100">
                      {ref}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 border-r border-slate-100">
                      {Number(row.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] truncate max-w-[130px]">
                        {row.category || (isPayment ? 'Miscellaneous' : 'Other Receipts')}
                      </span>
                    </td>
                    {isPayment && (
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        {row.remarks && row.remarks !== 'Nil' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium">
                            {row.remarks}
                          </span>
                        ) : (
                          <span className="text-slate-400">Nil</span>
                        )}
                      </td>
                    )}
                    {/* Action buttons with Edit and Delete */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(row, idx)}
                          title="Edit this entry"
                          className="p-1.5 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(sl, row.item)}
                          title="Delete this entry"
                          className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-amber-100/70 font-bold text-slate-900 border-t-2 border-slate-300">
                <td
                  colSpan={isPayment ? 4 : 3}
                  className="py-2.5 px-4 text-right uppercase tracking-wider text-xs"
                >
                  Total {isPayment ? 'Payments' : 'Receipts'}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-sm text-indigo-950 font-extrabold border-r border-amber-200">
                  {totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td colSpan={isPayment ? 3 : 2} className="py-2.5 px-4"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Edit / Add Modal Drawer */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingItem.isNew
                      ? `Add New ${isPayment ? 'Payment' : 'Receipt'}`
                      : `Edit ${isPayment ? 'Payment' : 'Receipt'} #${editingItem.slNo}`}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Changes will sync automatically to Google Sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4 text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 border ${
                    feedback.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Sl. No & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Sl. No.
                  </label>
                  <input
                    type="number"
                    disabled={!editingItem.isNew}
                    value={editingItem.slNo}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        slNo: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={editingItem.date}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, date: e.target.value })
                    }
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Item / Description */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Item / Description
                </label>
                <input
                  type="text"
                  value={editingItem.item}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, item: e.target.value })
                  }
                  placeholder="e.g. Snacks for Inauguration meeting"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Voucher/Receipt No & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    {isPayment ? 'Voucher No.' : 'Receipt no.'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.voucherOrReceiptNo}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        voucherOrReceiptNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.amount}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category (Ledger Head) */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Category (Ledger Head)
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {currentCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editingItem.remarks}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, remarks: e.target.value })
                  }
                  placeholder="e.g. Nil, Snack Receipt, Petrol, Bank"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
