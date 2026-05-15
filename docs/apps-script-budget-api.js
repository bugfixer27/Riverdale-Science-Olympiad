const SPREADSHEET_ID = '1gzxt-oxuxjCn4QsGHNc7KWcdt2OTQQNqS9WfYuAIvn8';
const API_TOKEN = 'Riverdale5250';

function doGet(e) {
  const action = (e.parameter.action || 'budget').trim();
  const callback = e.parameter.callback || '';

  try {
    requireToken(e.parameter.token);

    if (action === 'ping') {
      return respond({ ok: true, message: 'Budget API is online.' }, callback);
    }

    if (action === 'budget') {
      return respond({
        ok: true,
        updatedAt: new Date().toISOString(),
        ...getBudgetData()
      }, callback);
    }

    if (action === 'createPurchaseRequest') {
      const rowNumber = appendPurchaseRequest(e.parameter);
      return respond({ ok: true, message: 'Purchase request added.', rowNumber }, callback);
    }

    if (action === 'updatePurchaseStatus') {
      const result = updatePurchaseStatus(e.parameter);
      return respond({ ok: true, message: 'Purchase request updated.', ...result }, callback);
    }

    return respond({ ok: false, error: 'Unknown action.' }, callback);
  } catch (error) {
    return respond({ ok: false, error: error.message }, callback);
  }
}

function doPost(e) {
  try {
    requireToken(e.parameter.token);

    const action = (e.parameter.action || '').trim();

    if (action === 'createPurchaseRequest') {
      const rowNumber = appendPurchaseRequest(e.parameter);
      return respond({ ok: true, message: 'Purchase request added.', rowNumber });
    }

    if (action === 'updatePurchaseStatus') {
      const result = updatePurchaseStatus(e.parameter);
      return respond({ ok: true, message: 'Purchase request updated.', ...result });
    }

    return respond({ ok: false, error: 'Unknown action.' });
  } catch (error) {
    return respond({ ok: false, error: error.message });
  }
}

function onEdit(e) {
  if (!e || !e.range || !e.source) return;

  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Purchase Requests') return;
  if (e.range.getColumn() !== 9 || e.range.getRow() < 2) return;

  const status = normalizeStatus(e.value);
  if (!isSpentStatus(status)) return;

  ensureBudgetHeaders(e.source);
  logPurchaseRequestToSpending(e.source, e.range.getRow(), status);
}

function requireToken(token) {
  if (String(token || '') !== API_TOKEN) {
    throw new Error('Invalid API token.');
  }
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getBudgetData() {
  const spreadsheet = getSpreadsheet();
  ensureBudgetHeaders(spreadsheet);
  syncSpentRequests(spreadsheet);
  const purchaseRequests = getPurchaseRequests(spreadsheet);
  const spendingLog = getSpendingLog(spreadsheet);
  return {
    dashboard: getDashboard(spreadsheet, purchaseRequests, spendingLog),
    purchaseRequests,
    spendingLog
  };
}

function getDashboard(spreadsheet, purchaseRequests, spendingLog) {
  const sheet = spreadsheet.getSheetByName('Dashboard');
  const startingBudget = parseMoney(sheet.getRange('B3').getDisplayValue());
  const pendingRequests = purchaseRequests
    .filter(row => ['Submitted', 'Needs info'].includes(normalizeStatus(row.status)))
    .reduce((sum, row) => sum + requestAmount(row), 0);
  const approvedPlanned = purchaseRequests
    .filter(row => ['Approved', 'Ordered'].includes(normalizeStatus(row.status)))
    .reduce((sum, row) => sum + requestAmount(row), 0);
  const spent = spendingLog.reduce((sum, row) => sum + parseMoney(row.amount), 0);
  const cashRemaining = startingBudget - spent;
  const percentSpent = startingBudget > 0 ? `${Math.round((spent / startingBudget) * 100)}%` : '0%';

  return {
    startingBudget: formatMoney(startingBudget),
    totalPlanned: formatMoney(pendingRequests + approvedPlanned),
    spent: formatMoney(spent),
    cashRemaining: formatMoney(cashRemaining),
    approvedPlanned: formatMoney(approvedPlanned),
    pendingRequests: formatMoney(pendingRequests),
    reimbursementsDue: sheet.getRange('H4').getDisplayValue(),
    percentSpent
  };
}

function getPurchaseRequests(spreadsheet) {
  const rows = sheetObjects(spreadsheet.getSheetByName('Purchase Requests'));
  return rows
    .map(row => ({
      rowNumber: row.rowNumber,
      requestDate: row['Request Date'],
      requester: row['Requester'],
      category: row['Category'],
      eventArea: row['Event / Area'],
      description: row['Item / Description'],
      estimatedCost: row['Estimated Cost'],
      qty: row['Qty'],
      totalRequest: row['Total Request'],
      status: row['Status'],
      vendorLink: row['Vendor / Link'],
      needBy: row['Need By'],
      notes: row['Notes'],
      spentLoggedAt: row['Spent Logged At'],
      spendingLogRow: row['Spending Log Row']
    }))
    .filter(row => row.description || row.requester || row.estimatedCost || row.vendorLink)
    .reverse()
    .slice(0, 30);
}

function getSpendingLog(spreadsheet) {
  const rows = sheetObjects(spreadsheet.getSheetByName('Spending Log'));
  return rows
    .map(row => ({
      date: row['Date'],
      vendor: row['Payee / Vendor'],
      category: row['Category'],
      item: row['Item'],
      eventArea: row['Event / Area'],
      receiptLink: row['Receipt Link'],
      paymentMethod: row['Payment Method'],
      amount: row['Amount'],
      submittedBy: row['Submitted By'],
      approvedBy: row['Approved By'],
      reimbursementStatus: row['Reimbursement Status'],
      checkPo: row['Check / PO #'],
      notes: row['Notes']
    }))
    .filter(row => {
      const hasRealAmount = parseMoney(row.amount) > 0;
      const templateNote = String(row.notes || '').startsWith('Enter actual purchases here');
      return !templateNote && (hasRealAmount || row.date || row.vendor || row.item || row.submittedBy);
    })
    .reverse()
    .slice(0, 30);
}

function appendPurchaseRequest(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = getSpreadsheet();
    ensureBudgetHeaders(spreadsheet);
    const sheet = spreadsheet.getSheetByName('Purchase Requests');
    const estimatedCost = numberFromParam(params.estimatedCost);
    const qty = Math.max(1, numberFromParam(params.qty) || 1);
    const total = estimatedCost * qty;
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const rowNumber = findFirstEmptyRow(sheet, [1, 2, 5, 6, 10]);

    sheet.getRange(rowNumber, 1, 1, 14).setValues([[
      today,
      cleanText(params.requester),
      cleanText(params.category),
      cleanText(params.eventArea),
      cleanText(params.description),
      estimatedCost,
      qty,
      total,
      'Submitted',
      cleanText(params.vendorLink),
      cleanText(params.needBy),
      cleanText(params.notes),
      '',
      ''
    ]]);

    return rowNumber;
  } finally {
    lock.releaseLock();
  }
}

function updatePurchaseStatus(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = getSpreadsheet();
    ensureBudgetHeaders(spreadsheet);
    const sheet = spreadsheet.getSheetByName('Purchase Requests');
    const rowNumber = Number(params.rowNumber);
    const status = normalizeStatus(params.status);

    if (!rowNumber || rowNumber < 2) throw new Error('Invalid purchase request row.');
    if (!['Submitted', 'Needs info', 'Approved', 'Ordered', 'Received', 'Rejected / Cut'].includes(status)) {
      throw new Error('Invalid status.');
    }

    sheet.getRange(rowNumber, 9).setValue(status);

    let spendingLogRow = '';
    if (isSpentStatus(status)) {
      spendingLogRow = logPurchaseRequestToSpending(spreadsheet, rowNumber, status);
    }

    return { rowNumber, status, spendingLogRow };
  } finally {
    lock.releaseLock();
  }
}

function syncSpentRequests(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Purchase Requests');
  const values = sheet.getDataRange().getDisplayValues();

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const status = normalizeStatus(row[8]);
    const loggedAt = row[12];
    const hasRequest = row[1] || row[4] || row[5] || row[9];

    if (hasRequest && isSpentStatus(status) && !loggedAt) {
      logPurchaseRequestToSpending(spreadsheet, rowIndex + 1, status);
    }
  }
}

function logPurchaseRequestToSpending(spreadsheet, requestRowNumber, status) {
  const requestSheet = spreadsheet.getSheetByName('Purchase Requests');
  const existingLoggedAt = requestSheet.getRange(requestRowNumber, 13).getDisplayValue();
  const existingLogRow = requestSheet.getRange(requestRowNumber, 14).getDisplayValue();
  if (existingLoggedAt && existingLogRow) return existingLogRow;

  const spendingSheet = spreadsheet.getSheetByName('Spending Log');
  const request = requestRowObject(requestSheet, requestRowNumber);
  const amount = requestAmount({
    estimatedCost: request['Estimated Cost'],
    qty: request['Qty'],
    totalRequest: request['Total Request']
  });
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const spendingRowNumber = findFirstEmptyRow(spendingSheet, [1, 2, 4, 8, 9]);
  const sourceNote = `From purchase request row ${requestRowNumber}. ${request['Notes'] || ''}`.trim();

  spendingSheet.getRange(spendingRowNumber, 1, 1, 13).setValues([[
    today,
    linkHost(request['Vendor / Link']),
    request['Category'] || '',
    request['Item / Description'] || '',
    request['Event / Area'] || '',
    request['Vendor / Link'] || '',
    'Requested',
    amount,
    request['Requester'] || '',
    '',
    status,
    '',
    sourceNote
  ]]);

  requestSheet.getRange(requestRowNumber, 13, 1, 2).setValues([[new Date(), spendingRowNumber]]);
  return spendingRowNumber;
}

function requestRowObject(sheet, rowNumber) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const object = {};
  headers.forEach((header, index) => {
    if (header) object[String(header).trim()] = values[index] || '';
  });
  return object;
}

function ensureBudgetHeaders(spreadsheet) {
  const purchaseSheet = spreadsheet.getSheetByName('Purchase Requests');
  if (purchaseSheet.getMaxColumns() < 14) {
    purchaseSheet.insertColumnsAfter(purchaseSheet.getMaxColumns(), 14 - purchaseSheet.getMaxColumns());
  }

  const headers = purchaseSheet.getRange(1, 1, 1, 14).getDisplayValues()[0];
  const desired = ['Spent Logged At', 'Spending Log Row'];

  if (headers[12] !== desired[0] || headers[13] !== desired[1]) {
    purchaseSheet.getRange(1, 13, 1, 2).setValues([desired]);
  }
}

function findFirstEmptyRow(sheet, keyColumns) {
  const maxRows = sheet.getMaxRows();
  const values = sheet.getRange(2, 1, Math.max(maxRows - 1, 1), sheet.getLastColumn()).getDisplayValues();

  for (let index = 0; index < values.length; index++) {
    const row = values[index];
    const hasData = keyColumns.some(column => {
      const value = row[column - 1];
      if (value === undefined || value === null) return false;
      const text = String(value).trim();
      return text && text !== '$0.00' && text !== '0' && text !== 'Not submitted';
    });

    if (!hasData) return index + 2;
  }

  sheet.insertRowsAfter(maxRows, 20);
  return maxRows + 1;
}

function sheetObjects(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(header => String(header || '').trim());
  return values.slice(1).map((row, rowIndex) => {
    const object = { rowNumber: rowIndex + 2 };
    headers.forEach((header, index) => {
      if (header) object[header] = row[index] || '';
    });
    return object;
  });
}

function respond(payload, callback) {
  const json = JSON.stringify(payload);
  const safeCallback = String(callback || '').replace(/[^\w.$]/g, '');

  if (safeCallback) {
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText(value) {
  return String(value || '').trim();
}

function numberFromParam(value) {
  const parsed = Number(String(value || '').replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMoney(value) {
  const parsed = Number(String(value || '').replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function requestAmount(row) {
  const total = parseMoney(row.totalRequest || row['Total Request']);
  if (total > 0) return total;

  const estimated = parseMoney(row.estimatedCost || row['Estimated Cost']);
  const qty = parseMoney(row.qty || row['Qty']) || 1;
  return estimated * qty;
}

function normalizeStatus(status) {
  const text = String(status || '').trim();
  const lower = text.toLowerCase();
  if (lower === 'ordered' || lower === 'bought' || lower === 'purchased') return 'Ordered';
  if (lower === 'received' || lower === 'recieved') return 'Received';
  if (lower === 'approved') return 'Approved';
  if (lower === 'needs info') return 'Needs info';
  if (lower === 'rejected' || lower === 'rejected / cut') return 'Rejected / Cut';
  if (lower === 'submitted') return 'Submitted';
  return text || 'Submitted';
}

function isSpentStatus(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'Ordered' || normalized === 'Received';
}

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function linkHost(url) {
  const text = String(url || '').trim();
  if (!text) return '';

  try {
    return new URL(text).hostname.replace(/^www\./, '');
  } catch (error) {
    return text;
  }
}
