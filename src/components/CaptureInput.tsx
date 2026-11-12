'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  FileText,
  DollarSign,
  Calendar,
  Hash,
  Tag,
  MessageSquare,
} from 'lucide-react';
import {
  ExtractedTransaction,
  PAYMENT_CATEGORIES,
  RECEIPT_CATEGORIES,
  TransactionType,
} from '@/types/accounting';

interface CaptureInputProps {
  onTransactionSaved: (tx: ExtractedTransaction) => void;
}

export default function CaptureInput({ onTransactionSaved }: CaptureInputProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    sheetUrl?: string;
  } | null>(null);

  const [extractedData, setExtractedData] = useState<ExtractedTransaction | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setStatusMessage(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview && !textPrompt.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please take a picture, upload a file, or write a description.',
      });
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/agent/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || 'image/jpeg',
          textPrompt: textPrompt.trim() || undefined,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to extract data');
      }

      setExtractedData(res.data);
      setStatusMessage({
        type: 'info',
        text: `AI extracted details with ${(res.data.confidence * 100).toFixed(0)}% confidence. Please review before saving.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error communicating with AI agent.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/sheets/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to save to Google Sheets');
      }

      setStatusMessage({
        type: 'success',
        text: res.message || 'Transaction successfully recorded in Daybook & Ledger!',
        sheetUrl: res.sheetUrl,
      });

      onTransactionSaved(extractedData);

      // Reset input form
      setExtractedData(null);
      setImagePreview(null);
      setSelectedFile(null);
      setTextPrompt('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save record.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategoryOptions =
    extractedData?.type === 'RECEIPT' ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Selector Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-cadet/40 overflow-hidden">
        <div className="p-6 border-b border-cadet/30 bg-gradient-to-r from-gunmetal via-gunmetal-light to-gunmetal text-white">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Camera className="w-6 h-6 text-water" />
            Smart Voucher & Receipt Capture
          </h2>
          <p className="text-sm text-cadet mt-1">
            Snap a photo of any receipt, bill, or payment voucher. The agent will read amounts, dates, and automatically categorize it into your Daybook and Ledger.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Capture Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Native Mobile Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cadet/60 hover:border-gunmetal bg-water/20 hover:bg-water/50 rounded-xl transition cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-gunmetal text-water flex items-center justify-center shadow-md group-hover:scale-105 transition border border-gunmetal-light">
                <Camera className="w-7 h-7" />
              </div>
              <span className="mt-3 font-semibold text-gunmetal">Take Live Picture</span>
              <span className="text-xs text-gunmetal/70">Mobile Camera / Shutter</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>

            {/* Upload File / Gallery */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cadet/60 hover:border-gunmetal bg-palepink/20 hover:bg-palepink/40 rounded-xl transition cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-gunmetal text-palepink flex items-center justify-center shadow-md group-hover:scale-105 transition border border-gunmetal-light">
                <Upload className="w-7 h-7" />
              </div>
              <span className="mt-3 font-semibold text-gunmetal">Upload Voucher / Slip</span>
              <span className="text-xs text-gunmetal/70">PNG, JPG, PDF, Scans</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>
          </div>

          {/* Preview if uploaded */}
          {imagePreview && (
            <div className="relative rounded-xl border border-cadet/40 bg-gunmetal/5 p-3 flex flex-col items-center">
              <img
                src={imagePreview}
                alt="Voucher Preview"
                className="max-h-72 object-contain rounded-lg shadow-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setSelectedFile(null);
                }}
                className="mt-3 text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                Remove / Retake image
              </button>
            </div>
          )}

          {/* Natural language text or speech note */}
          <div>
            <label className="block text-sm font-semibold text-gunmetal mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-cadet-dark" />
              Add text note or manual details (Optional)
            </label>
            <input
              type="text"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="e.g. Paid Rs 1700 for Snacks for Inauguration meeting, voucher 4"
              className="w-full px-4 py-2.5 rounded-lg border border-cadet/60 focus:outline-none focus:ring-2 focus:ring-gunmetal text-sm text-gunmetal bg-white"
            />
          </div>

          {/* Analyze Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!imagePreview && !textPrompt.trim())}
            className="w-full py-3.5 px-6 rounded-xl bg-gunmetal hover:bg-gunmetal-light disabled:bg-cadet/40 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-water" />
                <span>Reading voucher & extracting amounts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-water" />
                <span>Agent Analyze & Read Values</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-water border-cadet text-gunmetal'
              : statusMessage.type === 'error'
              ? 'bg-palepink border-palepink-dark text-gunmetal'
              : 'bg-water/60 border-cadet text-gunmetal'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-gunmetal shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-gunmetal shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-semibold">{statusMessage.text}</p>
            {statusMessage.sheetUrl && (
              <a
                href={statusMessage.sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-bold text-gunmetal underline text-xs"
              >
                Open Google Sheets spreadsheet <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Review & Edit Card (Human-in-the-loop verification) */}
      {extractedData && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-gunmetal/20 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-gunmetal via-gunmetal-light to-gunmetal text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-water" />
              <div>
                <h3 className="font-bold text-lg text-white">Verify & Confirm Entry</h3>
                <p className="text-xs text-cadet">
                  Review extracted fields. You can adjust any values before writing to Google Sheets.
                </p>
              </div>
            </div>
            {extractedData.reasoning && (
              <span className="hidden sm:inline-block px-3 py-1 bg-white/10 rounded-full text-xs text-water max-w-xs truncate border border-white/10">
                {extractedData.reasoning}
              </span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Transaction Type Toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gunmetal">Type:</label>
              <div className="inline-flex rounded-lg p-1 bg-[#f5f7fa] border border-cadet/40">
                <button
                  type="button"
                  onClick={() =>
                    setExtractedData({
                      ...extractedData,
                      type: 'PAYMENT',
                      category: 'Miscellaneous',
                    })
                  }
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                    extractedData.type === 'PAYMENT'
                      ? 'bg-palepink text-gunmetal shadow-xs border border-palepink-dark'
                      : 'text-gunmetal/70 hover:text-gunmetal'
                  }`}
                >
                  Daybook - Payment
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExtractedData({
                      ...extractedData,
                      type: 'RECEIPT',
                      category: 'Donation',
                    })
                  }
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${
                    extractedData.type === 'RECEIPT'
                      ? 'bg-water text-gunmetal shadow-xs border border-cadet'
                      : 'text-gunmetal/70 hover:text-gunmetal'
                  }`}
                >
                  Daybook - Receipt
                </button>
              </div>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item / Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gunmetal uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-cadet-dark" /> Item / Description
                </label>
                <input
                  type="text"
                  value={extractedData.item}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, item: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-cadet/60 font-medium text-gunmetal text-sm focus:ring-2 focus:ring-gunmetal focus:outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gunmetal uppercase mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-cadet-dark" /> Amount (₹ / $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.amount}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-cadet/60 font-bold text-gunmetal text-lg focus:ring-2 focus:ring-gunmetal focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gunmetal uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cadet-dark" /> Date
                </label>
                <input
                  type="text"
                  value={extractedData.date}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, date: e.target.value })
                  }
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 rounded-lg border border-cadet/60 font-medium text-gunmetal text-sm focus:ring-2 focus:ring-gunmetal focus:outline-none"
                />
              </div>

              {/* Voucher / Receipt No */}
              <div>
                <label className="block text-xs font-semibold text-gunmetal uppercase mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-cadet-dark" />
                  {extractedData.type === 'PAYMENT' ? 'Voucher No.' : 'Receipt No.'}
                </label>
                <input
                  type="text"
                  value={extractedData.voucherOrReceiptNo}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      voucherOrReceiptNo: e.target.value,
                    })
                  }
                  placeholder="auto"
                  className="w-full px-3 py-2 rounded-lg border border-cadet/60 font-medium text-gunmetal text-sm focus:ring-2 focus:ring-gunmetal focus:outline-none"
                />
                <span className="text-[11px] text-cadet-dark">Leave as 'auto' to auto-assign sequentially.</span>
              </div>

              {/* Category / Ledger Head */}
              <div>
                <label className="block text-xs font-semibold text-gunmetal uppercase mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-cadet-dark" /> Category (Ledger Head)
                </label>
                <select
                  value={extractedData.category}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-cadet/60 font-medium text-gunmetal text-sm focus:ring-2 focus:ring-gunmetal focus:outline-none bg-white"
                >
                  {currentCategoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gunmetal uppercase mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={extractedData.remarks}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, remarks: e.target.value })
                  }
                  placeholder="e.g. Nil, Snack Receipt, Lucky Bamboo, Petrol"
                  className="w-full px-3 py-2 rounded-lg border border-cadet/60 text-gunmetal text-sm focus:ring-2 focus:ring-gunmetal focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-cadet/30">
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="px-5 py-2.5 rounded-lg border border-cadet text-gunmetal hover:bg-cadet/20 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg bg-gunmetal hover:bg-gunmetal-light disabled:bg-cadet/40 text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-water" />
                    Writing to Google Sheets...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-water" />
                    Confirm & Store in Google Sheets
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

