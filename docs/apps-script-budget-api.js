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

    return respond({ ok: false, error: 'Unknown action.' }, callback);
  } catch (error) {
    return respond({ ok: false, error: error.message }, callback);
  }
}

function doPost(e) {
  try {
    requireToken(e.parameter.token);

    const action = (e.parameter.action || '').trim();

    if (action !== 'createPurchaseRequest') {
      return respond({ ok: false, error: 'Unknown action.' });
    }

    appendPurchaseRequest(e.parameter);
    return respond({ ok: true, message: 'Purchase request added.' });
  } catch (error) {
    return respond({ ok: false, error: error.message });
  }
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
  return {
    dashboard: getDashboard(spreadsheet),
    purchaseRequests: getPurchaseRequests(spreadsheet),
    spendingLog: getSpendingLog(spreadsheet)
  };
}

function getDashboard(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Dashboard');
  return {
    startingBudget: sheet.getRange('B3').getDisplayValue(),
    totalPlanned: sheet.getRange('E3').getDisplayValue(),
    spent: sheet.getRange('H3').getDisplayValue(),
    cashRemaining: sheet.getRange('K3').getDisplayValue(),
    approvedPlanned: sheet.getRange('B4').getDisplayValue(),
    pendingRequests: sheet.getRange('E4').getDisplayValue(),
    reimbursementsDue: sheet.getRange('H4').getDisplayValue(),
    percentSpent: sheet.getRange('K4').getDisplayValue()
  };
}

function getPurchaseRequests(spreadsheet) {
  const rows = sheetObjects(spreadsheet.getSheetByName('Purchase Requests'));
  return rows
    .map(row => ({
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
      notes: row['Notes']
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
    const sheet = getSpreadsheet().getSheetByName('Purchase Requests');
    const estimatedCost = numberFromParam(params.estimatedCost);
    const qty = Math.max(1, numberFromParam(params.qty) || 1);
    const total = estimatedCost * qty;
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    sheet.appendRow([
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
      cleanText(params.notes)
    ]);
  } finally {
    lock.releaseLock();
  }
}

function sheetObjects(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(header => String(header || '').trim());
  return values.slice(1).map(row => {
    const object = {};
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
