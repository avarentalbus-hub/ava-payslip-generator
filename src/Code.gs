// AVA PAYSLIP GENERATOR v3.0 - FIXED
const CONFIG = {
  SHEET_ID: '1um-yXSxw2tgXNS5tG47dosiocwdFT2pzglSkHTLtkUg',
  DRIVE_FOLDER_ID: '1FwLhm9uH-yvYaPbucMIXDUkpNJA92Mnd',
  ADMIN_PASSWORD: 'avaadmin2026',
  COMPANY_NAME: 'AVA PASSENGERS TRANSPORT',
  COMPANY_ADDRESS: 'P.O. Box 91977, Dubai, UAE',
  COMPANY_PHONE: '00971 4 3439666',
  COMPANY_EMAIL: 'Contact@avarental.ae',
  COMPANY_TRN: '100364388700003',
  BANK_NAME: 'RAKBANK',
  BANK_IBAN: 'AE110400008371527349901'
};

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('AVA Payslip Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'syncPayslips') {
      return jsonResponse(syncPayslips(data.payslips));
    }
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch(err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// CLIENT-CALLABLE FUNCTIONS
function verifyAdmin(data) {
  return { success: data.password === CONFIG.ADMIN_PASSWORD };
}

function getEmployees() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName('Employees');
    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName('Employees');
    }
    const data = sheet.getDataRange().getValues();
    const employees = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        employees.push({
          code: data[i][0], name: data[i][1], basicSalary: data[i][2],
          phone: data[i][3], email: data[i][4], designation: data[i][5]
        });
      }
    }
    return { success: true, employees: employees };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

function getPayslipTracker() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName('Payslip Tracker');
    if (!sheet) {
      initializeSheets();
      sheet = ss.getSheetByName('Payslip Tracker');
    }
    const data = sheet.getDataRange().getValues();
    const tracker = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        tracker.push({
          voucherNumber: data[i][0], date: data[i][1], empCode: data[i][2], empName: data[i][3],
          basicSalary: data[i][4], otAmount: data[i][5], otherAmount: data[i][6],
          grossSalary: data[i][7], deduction: data[i][8], netSalary: data[i][9],
          monthYear: data[i][10], pdfLink: data[i][11], generatedBy: data[i][12], timestamp: data[i][13]
        });
      }
    }
    return { success: true, tracker: tracker };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

function getNextVoucherNumber() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let setSheet = ss.getSheetByName('Settings');

    // Create Settings sheet if missing
    if (!setSheet) {
      initializeSheets();
      setSheet = ss.getSheetByName('Settings');
    }

    const settings = setSheet.getDataRange().getValues();
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const currentMonthKey = mm + yyyy;

    // Default values if sheet is empty
    let lastVoucher = 'AVA_PS/' + currentMonthKey + '_00';
    let storedMonth = currentMonthKey;

    // Safely read existing values
    if (settings.length > 1 && settings[1] && settings[1][1]) {
      lastVoucher = settings[1][1];
    }
    if (settings.length > 2 && settings[2] && settings[2][1]) {
      storedMonth = settings[2][1];
    }

    // Reset counter if new month
    if (storedMonth !== currentMonthKey) {
      storedMonth = currentMonthKey;
      lastVoucher = 'AVA_PS/' + currentMonthKey + '_00';
      setSheet.getRange(3,1,1,2).setValues([['Current Month', currentMonthKey]]);
    }

    // Extract and increment number
    const match = lastVoucher.match(/AVA_PS\/\d{6}_(\d+)/);
    let nextNum = match ? parseInt(match[1]) + 1 : 1;
    const nextVoucher = 'AVA_PS/' + currentMonthKey + '_' + String(nextNum).padStart(2, '0');

    // Update last voucher
    setSheet.getRange(2,1,1,2).setValues([['Last Voucher Number', nextVoucher]]);

    return { success: true, voucherNumber: nextVoucher };
  } catch(err) {
    return { success: false, error: 'Voucher error: ' + err.toString() };
  }
}

function getDashboardStats() {
  try {
    const empResult = getEmployees();
    const trackResult = getPayslipTracker();
    if (!empResult.success || !trackResult.success) {
      return { success: false, error: 'Failed to load data' };
    }
    const tracker = trackResult.tracker;
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0') + now.getFullYear();
    const monthPayslips = tracker.filter(p => p.voucherNumber && p.voucherNumber.includes('/' + currentMonth + '_'));
    const totalNet = monthPayslips.reduce((sum, p) => sum + (parseFloat(p.netSalary) || 0), 0);
    return {
      success: true,
      stats: {
        totalEmployees: empResult.employees.length,
        totalPayslips: tracker.length,
        monthPayslips: monthPayslips.length,
        monthTotalNet: totalNet.toFixed(2),
        lastVoucher: tracker.length > 0 ? tracker[tracker.length-1].voucherNumber : 'None'
      }
    };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

function generatePayslip(data) {
  try {
    const voucherResult = getNextVoucherNumber();
    if (!voucherResult.success) {
      return { success: false, error: voucherResult.error };
    }
    const voucherNumber = voucherResult.voucherNumber;
    const pdfBlob = createPayslipPDF(data.payslipData, voucherNumber);
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const fileName = voucherNumber + '_' + data.payslipData.employeeName.replace(/\s+/g, '_') + '_Payslip.pdf';
    const driveFile = folder.createFile(pdfBlob.setName(fileName));
    const pdfUrl = driveFile.getUrl();
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const trackSheet = ss.getSheetByName('Payslip Tracker');
    const timestamp = new Date();
    const rowData = [
      voucherNumber, data.payslipData.payslipDate, data.payslipData.employeeCode, data.payslipData.employeeName,
      parseFloat(data.payslipData.basicSalary)||0, parseFloat(data.payslipData.otAmount)||0, parseFloat(data.payslipData.otherAmount)||0,
      parseFloat(data.payslipData.grossSalary)||0, parseFloat(data.payslipData.deduction)||0, parseFloat(data.payslipData.netSalary)||0,
      data.payslipData.monthYear, pdfUrl, 'Admin', timestamp
    ];
    trackSheet.appendRow(rowData);
    const lastRow = trackSheet.getLastRow();
    trackSheet.getRange(lastRow, 12).setFormula('=HYPERLINK("' + pdfUrl + '","\uD83D\uDCC4 View PDF")');
    return { success: true, voucherNumber: voucherNumber, pdfUrl: pdfUrl, message: 'Payslip generated!' };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

function syncPayslips(payslips) {
  try {
    const results = [];
    for (let i = 0; i < payslips.length; i++) {
      const p = payslips[i];
      const voucherResult = getNextVoucherNumber();
      if (!voucherResult.success) continue;
      const voucherNumber = voucherResult.voucherNumber;
      const pdfBlob = createPayslipPDF(p, voucherNumber);
      const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      const fileName = voucherNumber + '_' + p.employeeName.replace(/\s+/g, '_') + '_Payslip.pdf';
      const driveFile = folder.createFile(pdfBlob.setName(fileName));
      const pdfUrl = driveFile.getUrl();
      const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      const trackSheet = ss.getSheetByName('Payslip Tracker');
      const rowData = [
        voucherNumber, p.payslipDate, p.employeeCode, p.employeeName,
        parseFloat(p.basicSalary)||0, parseFloat(p.otAmount)||0, parseFloat(p.otherAmount)||0,
        parseFloat(p.grossSalary)||0, parseFloat(p.deduction)||0, parseFloat(p.netSalary)||0,
        p.monthYear, pdfUrl, 'Admin (Sync)', new Date()
      ];
      trackSheet.appendRow(rowData);
      const lastRow = trackSheet.getLastRow();
      trackSheet.getRange(lastRow, 12).setFormula('=HYPERLINK("' + pdfUrl + '","\uD83D\uDCC4 View PDF")');
      results.push({ success: true, oldVoucher: p.voucherNumber, newVoucher: voucherNumber, pdfUrl: pdfUrl });
    }
    return { success: true, results: results };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

function initializeSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);

  // Employees Sheet
  let empSheet = ss.getSheetByName('Employees');
  if (!empSheet) {
    empSheet = ss.insertSheet('Employees');
    empSheet.getRange(1,1,1,6).setValues([['Employee Code','Employee Name','Basic Salary (AED)','Phone','Email','Designation']]);
    empSheet.getRange(1,1,1,6).setFontWeight('bold').setBackground('#1a237e').setFontColor('white');
    const defaultEmployees = [
      ['TR_01','Mubarak Theyyampattil',4000,'','','Driver'],
      ['TR_02','Shahzeed',3000,'','','Driver'],
      ['TR_03','Ilyas',3000,'','','Driver'],
      ['TR_04','HASEEB',3000,'','','Driver'],
      ['TR_05','kamarvan kahan',3000,'','','Driver'],
      ['TR_06','kamarvan kahan',3000,'','','Driver'],
      ['TR_07','SHAKIR',3000,'','','Driver'],
      ['TR_08','Mohammed',2500,'','','Driver'],
      ['TR_09','ABDU SALAM',2500,'','','Driver'],
      ['TR_10','ABDUL GAFOOR',2500,'','','Driver'],
      ['TR_11','Mohammed GULREHMEN',1700,'','','Driver']
    ];
    empSheet.getRange(2,1,defaultEmployees.length,6).setValues(defaultEmployees);
  }

  // Payslips Tracker Sheet
  let trackSheet = ss.getSheetByName('Payslip Tracker');
  if (!trackSheet) {
    trackSheet = ss.insertSheet('Payslip Tracker');
    trackSheet.getRange(1,1,1,14).setValues([[ 'Voucher Number','Date','Employee Code','Employee Name','Basic Salary', 'OT Amount','Other Amount','Gross Salary','Deduction','Net Salary', 'Month/Year','Drive PDF Link','Generated By','Timestamp' ]]);
    trackSheet.getRange(1,1,1,14).setFontWeight('bold').setBackground('#1a237e').setFontColor('white');
    trackSheet.setColumnWidth(1, 160);
    trackSheet.setColumnWidth(12, 300);
  }

  // Settings Sheet - ALWAYS recreate to fix corruption
  let setSheet = ss.getSheetByName('Settings');
  if (setSheet) {
    ss.deleteSheet(setSheet);
  }
  setSheet = ss.insertSheet('Settings');
  setSheet.getRange(1,1,1,2).setValues([['Setting','Value']]);
  setSheet.getRange(2,1,2,2).setValues([['Last Voucher Number','AVA_PS/082026_00'],['Current Month','082026']]);
  setSheet.getRange(1,1,1,2).setFontWeight('bold').setBackground('#f57c00').setFontColor('white');

  return 'Sheets initialized!';
}

function createPayslipPDF(data, voucherNumber) {
  const doc = DocumentApp.create('Temp_Payslip_' + Date.now());
  const body = doc.getBody();
  body.clear();
  const headerStyle = {}; headerStyle[DocumentApp.Attribute.FONT_SIZE] = 11; headerStyle[DocumentApp.Attribute.BOLD] = true; headerStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#1a237e';
  const normalStyle = {}; normalStyle[DocumentApp.Attribute.FONT_SIZE] = 10;
  const titleStyle = {}; titleStyle[DocumentApp.Attribute.FONT_SIZE] = 18; titleStyle[DocumentApp.Attribute.BOLD] = true; titleStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#1a237e';
  const labelStyle = {}; labelStyle[DocumentApp.Attribute.FONT_SIZE] = 10; labelStyle[DocumentApp.Attribute.BOLD] = true;
  const compTable = body.appendTable([[CONFIG.COMPANY_NAME],[CONFIG.COMPANY_ADDRESS],['Phone: ' + CONFIG.COMPANY_PHONE + ' | Email: ' + CONFIG.COMPANY_EMAIL],['TRN: ' + CONFIG.COMPANY_TRN]]);
  for (let i = 0; i < 4; i++) {
    const cell = compTable.getCell(i, 0);
    cell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    if (i === 0) cell.getChild(0).asParagraph().setAttributes(titleStyle);
    else cell.getChild(0).asParagraph().setAttributes(normalStyle);
    cell.setBackgroundColor('#e8eaf6');
  }
  compTable.setColumnWidth(0, 500);
  body.appendParagraph('');
  const titlePara = body.appendParagraph('SALARY VOUCHER');
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER); titlePara.setAttributes(titleStyle);
  const voucherPara = body.appendParagraph('Voucher No: ' + voucherNumber);
  voucherPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  voucherPara.setAttributes({...normalStyle, [DocumentApp.Attribute.BOLD]: true});
  body.appendParagraph('');
  const empTable = body.appendTable([
    ['Employee Code:', data.employeeCode, 'Date:', data.payslipDate],
    ['Employee Name:', data.employeeName, 'Month:', data.monthYear],
    ['Designation:', data.designation || 'Driver', 'Bank:', CONFIG.BANK_NAME],
    ['IBAN:', CONFIG.BANK_IBAN, '', '']
  ]);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = empTable.getCell(r, c);
      if (c === 0 || c === 2) cell.getChild(0).asParagraph().setAttributes(labelStyle);
      else cell.getChild(0).asParagraph().setAttributes(normalStyle);
    }
  }
  empTable.setColumnWidth(0, 120); empTable.setColumnWidth(1, 180); empTable.setColumnWidth(2, 80); empTable.setColumnWidth(3, 120);
  body.appendParagraph('');
  const salaryTable = body.appendTable([
    ['EARNINGS', 'AMOUNT (AED)', 'DEDUCTIONS', 'AMOUNT (AED)'],
    ['Basic Salary', formatAED(data.basicSalary), 'Deductions', formatAED(data.deduction)],
    ['OT Amount', formatAED(data.otAmount), '', ''],
    ['Other Amount', formatAED(data.otherAmount), '', ''],
    ['', '', '', ''],
    ['GROSS SALARY', formatAED(data.grossSalary), 'TOTAL DEDUCTION', formatAED(data.deduction)],
    ['', '', 'NET SALARY', formatAED(data.netSalary)]
  ]);
  for (let c = 0; c < 4; c++) {
    const cell = salaryTable.getCell(0, c);
    cell.setBackgroundColor('#1a237e');
    cell.getChild(0).asParagraph().setAttributes({...headerStyle, [DocumentApp.Attribute.FOREGROUND_COLOR]: '#ffffff'});
  }
  salaryTable.getCell(5, 0).setBackgroundColor('#e8eaf6').getChild(0).asParagraph().setAttributes(labelStyle);
  salaryTable.getCell(5, 1).setBackgroundColor('#e8eaf6').getChild(0).asParagraph().setAttributes(labelStyle);
  salaryTable.getCell(5, 2).setBackgroundColor('#fff3e0').getChild(0).asParagraph().setAttributes(labelStyle);
  salaryTable.getCell(5, 3).setBackgroundColor('#fff3e0').getChild(0).asParagraph().setAttributes(labelStyle);
  salaryTable.getCell(6, 2).setBackgroundColor('#c8e6c9').getChild(0).asParagraph().setAttributes({...labelStyle, [DocumentApp.Attribute.FONT_SIZE]: 12});
  salaryTable.getCell(6, 3).setBackgroundColor('#c8e6c9').getChild(0).asParagraph().setAttributes({...labelStyle, [DocumentApp.Attribute.FONT_SIZE]: 12, [DocumentApp.Attribute.FOREGROUND_COLOR]: '#2e7d32'});
  salaryTable.setColumnWidth(0, 150); salaryTable.setColumnWidth(1, 120); salaryTable.setColumnWidth(2, 150); salaryTable.setColumnWidth(3, 120);
  body.appendParagraph('');
  const wordsPara = body.appendParagraph('Amount in Words: ' + numberToWords(parseFloat(data.netSalary)) + ' UAE Dirhams Only');
  wordsPara.setAttributes({...normalStyle, [DocumentApp.Attribute.ITALIC]: true});
  body.appendParagraph('');
  const sigTable = body.appendTable([['_____________________', '_____________________', '_____________________'],['Prepared By', 'Checked By', 'Approved By']]);
  sigTable.setColumnWidth(0, 166); sigTable.setColumnWidth(1, 166); sigTable.setColumnWidth(2, 166);
  for (let c = 0; c < 3; c++) {
    sigTable.getCell(0, c).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    sigTable.getCell(1, c).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER).setAttributes(labelStyle);
  }
  body.appendParagraph('');
  const notePara = body.appendParagraph('Note: This is a computer-generated voucher and does not require a physical signature.');
  notePara.setAttributes({...normalStyle, [DocumentApp.Attribute.ITALIC]: true, [DocumentApp.Attribute.FONT_SIZE]: 8});
  notePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  doc.saveAndClose();
  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdfBlob;
}

function formatAED(amount) { const num = parseFloat(amount) || 0; return num.toFixed(2); }

function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function convertLessThanOneThousand(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 !== 0 ? ' ' + ones[n%10] : '');
    return ones[Math.floor(n/100)] + ' Hundred' + (n%100 !== 0 ? ' and ' + convertLessThanOneThousand(n%100) : '');
  }
  function convert(n) {
    if (n < 1000) return convertLessThanOneThousand(n);
    if (n < 1000000) return convertLessThanOneThousand(Math.floor(n/1000)) + ' Thousand' + (n%1000 !== 0 ? ' ' + convertLessThanOneThousand(n%1000) : '');
    return convertLessThanOneThousand(Math.floor(n/1000000)) + ' Million' + (n%1000000 !== 0 ? ' ' + convert(n%1000000) : '');
  }
  const whole = Math.floor(num);
  const decimal = Math.round((num - whole) * 100);
  let result = convert(whole);
  if (decimal > 0) result += ' and ' + convertLessThanOneThousand(decimal) + ' Fils';
  return result;
}

function setupApp() {
  initializeSheets();
  Logger.log('Setup complete!');
}
