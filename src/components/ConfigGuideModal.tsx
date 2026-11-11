'use client';

import React from 'react';
import { X, Key, FileSpreadsheet, ExternalLink, ShieldCheck, Check } from 'lucide-react';

interface ConfigGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
}

export default function ConfigGuideModal({
  isOpen,
  onClose,
  isConfigured,
}: ConfigGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-bold text-lg">Google Sheets & Gemini AI Setup</h3>
              <p className="text-xs text-slate-300">
                Connect your Google Account to automatically store Daybook and Ledger entries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isConfigured ? (
              <>
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium text-xs">
                  Google Sheets is fully configured! Live reads and appends are enabled.
                </span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span className="font-medium text-xs">
                  Currently running in Demo / Local Session Mode. Configure your credentials below for live Google Drive storage.
                </span>
              </>
            )}
          </div>

          {/* Step 1 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                1
              </span>
              Get Gemini API Key (For OCR & Reasoning)
            </h4>
            <p className="text-xs text-slate-600 pl-8">
              Create a free API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline inline-flex items-center gap-0.5"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and set it as:
            </p>
            <div className="pl-8">
              <code className="block bg-slate-900 text-indigo-300 p-2.5 rounded-lg text-xs font-mono">
                GEMINI_API_KEY=AIzaSy...
              </code>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Create Google Cloud Service Account
            </h4>
            <p className="text-xs text-slate-600 pl-8">
              1. Open{' '}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline inline-flex items-center gap-0.5"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
              .<br />
              2. Enable <strong>Google Sheets API</strong>.<br />
              3. Go to <strong>IAM & Admin &gt; Service Accounts</strong>, create a service account (e.g. <code>sheets-agent@...</code>).<br />
              4. Under <strong>Keys</strong>, click <strong>Add Key &gt; Create New Key (JSON)</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                3
              </span>
              Create or Share Google Sheet
            </h4>
            <p className="text-xs text-slate-600 pl-8">
              1. Create a blank Google Sheet in your Google Drive.<br />
              2. Click <strong>Share</strong> and add your Service Account email as <strong>Editor</strong>.<br />
              3. Copy the Spreadsheet ID from the URL:
              <br />
              <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-800">
                https://docs.google.com/spreadsheets/d/<strong>1BxiMVs0XR...</strong>/edit
              </code>
            </p>
          </div>

          {/* Step 4: Environment Variables */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                4
              </span>
              Add to .env.local or Vercel Environment Variables
            </h4>
            <div className="pl-8">
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{`GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-agent@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

