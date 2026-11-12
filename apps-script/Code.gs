/**
 * AgentBuddy Accounting — Google Sheets backend (Apps Script Web App).
 * Bind this script to your spreadsheet (Extensions > Apps Script), set the
 * Script Property API_TOKEN, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). See README section "Apps Script setup".
 */
var SHEETS = {
  PAY: 'Daybook - Payments',
  REC: 'Daybook - Receipts',
  LEDGER_PAY: 'Payments (Ledger)',
  LEDGER_REC: 'Receipts (Ledger)',
  STATEMENT: 'Account Statement'
};
var FIRST_ROW = 3; // row 1 = title, row 2 = headers

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!token || req.token !== token) return out({ error: 'Unauthorized' });

    lock.waitLock(20000);
    switch (req.action) {
      case 'init':   return out(init());
      case 'list':   return out(list());
      case 'add':    return out(add(req.tx));
      case 'update': return out(update(req.tx));
      case 'delete': return out(del(req.type, Number(req.slNo)));
      default:       return out({ error: 'Unknown action: ' + req.action });
    }
  } catch (err) {
    return out({ error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return out({ ok: true, message: 'AgentBuddy API is running. Use POST.' }); }

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheetFor(type) { return ss().getSheetByName(type === 'PAYMENT' ? SHEETS.PAY : SHEETS.REC); }

function init() {
  var s = ss();
  Object.keys(SHEETS).forEach(function (k) {
    if (!s.getSheetByName(SHEETS[k])) s.insertSheet(SHEETS[k]);
  });
  var pay = s.getSheetByName(SHEETS.PAY), rec = s.getSheetByName(SHEETS.REC);
  if (!pay.getRange('A2').getValue()) {
    pay.getRange('A1').setValue('Day - Book (Payments)');
    pay.getRange('A2:G2').setValues([['Sl. No.', 'Date', 'Item', 'Voucher No.', 'Amount', 'Remarks', 'Category']]).setFontWeight('bold');
  }
  if (!rec.getRange('A2').getValue()) {
    rec.getRange('A1').setValue('Day - Book (Receipts)');
    rec.getRange('A2:G2').setValues([['Sl. No.', 'Date', 'Item', 'Receipt no.', 'Amount', 'Remarks', 'Category']]).setFontWeight('bold');
  }
  // Keep dates as typed text (DD/MM/YYYY) instead of letting Sheets reinterpret them
  pay.getRange('B:B').setNumberFormat('@'); rec.getRange('B:B').setNumberFormat('@');
  return { success: true, message: 'Sheets initialized' };
}

function readRows(sheet) {
  var last = sheet.getLastRow();
  if (last < FIRST_ROW) return [];
  return sheet.getRange(FIRST_ROW, 1, last - FIRST_ROW + 1, 7).getValues();
}

function list() {
  var pay = readRows(sheetFor('PAYMENT')).filter(nonBlank).map(function (r) {
    return { slNo: Number(r[0]) || 0, date: str(r[1]), item: str(r[2]), voucherNo: str(r[3]),
             amount: Number(r[4]) || 0, remarks: str(r[5]), category: str(r[6]) || 'Miscellaneous' };
  });
  var rec = readRows(sheetFor('RECEIPT')).filter(nonBlank).map(function (r) {
    return { slNo: Number(r[0]) || 0, date: str(r[1]), item: str(r[2]), receiptNo: str(r[3]),
             amount: Number(r[4]) || 0, remarks: str(r[5]), category: str(r[6]) || 'Donation' };
  });
  return { payments: pay, receipts: rec, spreadsheetUrl: ss().getUrl() };
}

function add(tx) {
  var sheet = sheetFor(tx.type);
  var rows = readRows(sheet);
  var slNo = rows.reduce(function (m, r) { return Math.max(m, Number(r[0]) || 0); }, 0) + 1;
  var ref = (!tx.voucherOrReceiptNo || String(tx.voucherOrReceiptNo).toLowerCase() === 'auto')
    ? String(slNo) : String(tx.voucherOrReceiptNo);
  var category = tx.category || (tx.type === 'PAYMENT' ? 'Miscellaneous' : 'Other Receipts');
  var row = [slNo, tx.date, tx.item, ref, Number(tx.amount), tx.remarks || 'Nil', category];
  var target = Math.max(sheet.getLastRow() + 1, FIRST_ROW);
  sheet.getRange(target, 1, 1, 7).setValues([row]);

  var ledger = ss().getSheetByName(tx.type === 'PAYMENT' ? SHEETS.LEDGER_PAY : SHEETS.LEDGER_REC);
  ledger.appendRow([category, tx.date, tx.item, ref, Number(tx.amount), tx.remarks || '']);
  return { success: true, slNo: slNo, refNo: ref, sheetUrl: ss().getUrl() };
}

function findRow(sheet, slNo) {
  var rows = readRows(sheet);
  for (var i = 0; i < rows.length; i++) if (Number(rows[i][0]) === slNo) return i + FIRST_ROW;
  throw new Error('Row #' + slNo + ' was not found. Refresh and try again.');
}

function update(tx) {
  var sheet = sheetFor(tx.type);
  var r = findRow(sheet, Number(tx.slNo));
  sheet.getRange(r, 1, 1, 7).setValues([[Number(tx.slNo), tx.date, tx.item, String(tx.voucherOrReceiptNo),
    Number(tx.amount), tx.remarks || 'Nil', tx.category]]);
  return { success: true, message: 'Updated row #' + tx.slNo, rowNumber: r, sheetUrl: ss().getUrl() };
}

function del(type, slNo) {
  var sheet = sheetFor(type);
  sheet.deleteRow(findRow(sheet, slNo));
  return { success: true, message: 'Deleted row #' + slNo };
}

function nonBlank(r) { return r[0] !== '' || r[2] !== ''; }
function str(v) { return v === null || v === undefined ? '' : String(v); }
