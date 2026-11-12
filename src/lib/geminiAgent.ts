import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  ExtractedTransaction,
  PAYMENT_CATEGORIES,
  RECEIPT_CATEGORIES,
} from '@/types/accounting';

const SYSTEM_PROMPT = `
You are an expert Accountant Agent for an organization (church/parish/non-profit) managing accounts with five primary sheets:
1. Daybook - Payments
2. Payments (Ledger)
3. Daybook - Receipts
4. Receipts (Ledger)
5. Account Statement

Your job is to inspect an uploaded image of a receipt, bill, bank statement, counterfoil, or handwritten voucher, OR natural language text descriptions, and extract structured accounting data.

Standard Payment Categories:
- "Farewell Gifts": farewell gifts to achens, priests, honored guests
- "Membership Registration": youth registration, centre registration, affiliation fees
- "Inauguration Expenses": election meetings, snacks, tea, inaugural program, chief guest gifts
- "Awareness Program": Doctor's day, medical awareness, awareness gifts/mugs
- "Camp Expenses": Camp petrol, food, dinner, TA for Revs, accommodation, bus advance, water bottles, camp donations
- "Bank Charges": PORD customer payment charges, SMS charges, bank maintenance fees
- "Miscellaneous": Roses for parish day, tape and ribbon, minor decor, stationery
- "Other Expenses": Any other outflow

Standard Receipt Categories:
- "Bank Interest": Savings/Fixed interest credited by bank
- "Offertory": Sunday offertory, cottage prayer offertory, camp offertory
- "Donation": Member donations, doctor's day mug donation, patron contributions
- "Registration": Camp delegate registration fees (e.g. 1500 per head)
- "Other Receipts": Any other inflow

Extract the following JSON fields:
{
  "type": "PAYMENT" or "RECEIPT",
  "date": "DD/MM/YYYY" (e.g. 19/04/2026). If year is missing or ambiguous, use current year or standard 2026.
  "item": "Clear description of the item or person",
  "voucherOrReceiptNo": "Voucher or Receipt number if found on slip, otherwise 'auto'",
  "amount": number (positive numeric value),
  "category": "The most appropriate category from the lists above",
  "remarks": "Brief remark (e.g., 'Nil', 'Dinner', 'Bus', 'PORD', 'Gift')",
  "confidence": number between 0.1 and 1.0,
  "reasoning": "A concise explanation of why this category and transaction type were chosen."
}
`;

export async function extractTransactionWithAgent(params: {
  imageBase64?: string;
  mimeType?: string;
  textPrompt?: string;
}): Promise<ExtractedTransaction> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback demo mode if API key is not yet set up
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    if (!params.textPrompt?.trim()) {
      throw new Error(
        'GEMINI_API_KEY is not configured, so images cannot be read. Add the key to .env.local or type a text description.'
      );
    }
    return generateDemoExtraction(params.textPrompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Primary model, then optional comma-separated fallbacks (GEMINI_FALLBACK_MODELS)
    const models = [
      process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      ...(process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash,gemini-flash-latest')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    ];

    const parts: any[] = [{ text: SYSTEM_PROMPT }];

    if (params.imageBase64 && params.mimeType) {
      // Strip data URL header if present
      const cleanBase64 = params.imageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: params.mimeType,
          data: cleanBase64,
        },
      });
      parts.push({
        text: 'Analyze this receipt / voucher image and extract the accounting transaction details according to the schema.',
      });
    }

    if (params.textPrompt) {
      parts.push({
        text: `Additional user note or manual input: "${params.textPrompt}"`,
      });
    }

    const isTransient = (e: any) => /\b(503|429|500|504)\b|overloaded|high demand|unavailable|timeout|timed out|abort/i.test(String(e?.message));
    let responseText = '';
    let lastErr: any;
    outer: for (const name of models) {
      const model = genAI.getGenerativeModel(
        {
          model: name,
          generationConfig: { responseMimeType: 'application/json' },
        },
        { timeout: 25000 } // some models hang under load; fail over instead of waiting
      );
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await model.generateContent(parts);
          responseText = result.response.text();
          break outer;
        } catch (e) {
          lastErr = e;
          if (!isTransient(e)) break; // e.g. 404/400: try next model
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)); // 1s then move on
        }
      }
    }
    if (!responseText) throw lastErr || new Error('No response from model');
    const parsed = JSON.parse(responseText);

    return {
      type: parsed.type === 'RECEIPT' ? 'RECEIPT' : 'PAYMENT',
      date: parsed.date || new Date().toLocaleDateString('en-GB'),
      item: parsed.item || 'General Expense',
      voucherOrReceiptNo: parsed.voucherOrReceiptNo || 'auto',
      amount: Math.abs(Number(parsed.amount) || 0),
      category: parsed.category || (parsed.type === 'RECEIPT' ? 'Other Receipts' : 'Miscellaneous'),
      remarks: parsed.remarks || 'Nil',
      confidence: Number(parsed.confidence) || 0.9,
      reasoning: parsed.reasoning || 'Extracted via Gemini Vision',
    };
  } catch (error) {
    console.error('Gemini extraction failed:', error);
    throw new Error(
      `AI extraction failed: ${(error as Error)?.message || 'unknown error'}. Please retry or enter the entry manually.`
    );
  }
}

/**
 * Intelligent heuristic fallback for testing without API keys
 */
function generateDemoExtraction(text: string): ExtractedTransaction {
  const isReceipt = /donation|offertory|interest|registration|reciept|received/i.test(text);
  const amountMatch = text.match(/(?:rs\.?|₹|\$)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 1500;

  let category = isReceipt ? 'Donation' : 'Camp Expenses';
  if (/farewell/i.test(text)) category = 'Farewell Gifts';
  else if (/registration/i.test(text)) category = isReceipt ? 'Registration' : 'Membership Registration';
  else if (/tea|snack|inauguration/i.test(text)) category = 'Inauguration Expenses';
  else if (/bank|sms|pord/i.test(text)) category = 'Bank Charges';
  else if (/mugs|doctor/i.test(text)) category = 'Awareness Program';
  else if (/interest/i.test(text)) category = 'Bank Interest';
  else if (/offertory/i.test(text)) category = 'Offertory';

  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return {
    type: isReceipt ? 'RECEIPT' : 'PAYMENT',
    date: dateStr,
    item: text.trim().length > 3 ? text.trim() : 'Camp Expenses (Supplies)',
    voucherOrReceiptNo: 'auto',
    amount: amount || 1500,
    category,
    remarks: 'Auto-detected',
    confidence: 0.5,
    reasoning: `DEMO MODE (no Gemini key): guessed ${category} from keywords. Verify every field.`,
  };
}

