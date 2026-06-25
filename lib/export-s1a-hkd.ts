import type { TaxReportData } from '@/hooks/use-tax-report';

// Template structure (public/templates/s1a-hkd-template.xlsx):
// A1: "HỌ, CÁ NHÂN KINH DOANH:......"  A2: "Địa chỉ:...."  A3: "Mã số thuế:...."
// B7: "Địa điểm kinh doanh:...."  B8: "Kỳ kê khai:...."
// B10/C10/D10: column headers, B11/C11/D11: A/B/1 sub-headers
// Rows 12–18: 7 empty data slots  C19: "Tổng cộng"  D19: total value
// D22–D25: signature section

const TEMPLATE_URL = '/templates/s1a-hkd-template.xlsx';
const DATA_START_ROW = 12;   // 1-indexed
const TEMPLATE_DATA_SLOTS = 7; // rows 12-18 in template
const TEMPLATE_TOTAL_ROW = 19;

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export async function exportS1aHkdToExcel(report: TaxReportData, filename?: string): Promise<void> {
  const XlsxPopulate = await import('xlsx-populate/browser/xlsx-populate');

  const resp = await fetch(TEMPLATE_URL);
  if (!resp.ok) throw new Error('Không tìm thấy file template S1a-HKD');
  const buffer = await resp.arrayBuffer();

  const wb = await XlsxPopulate.default.fromDataAsync(buffer);
  const sheet = wb.sheet(0);

  const { header, rows, total } = report;

  // Fill header info
  sheet.cell('A1').value(`HỌ, CÁ NHÂN KINH DOANH: ${header.business_name || ''}`);
  sheet.cell('A2').value(`Địa chỉ: ${header.business_location || ''}`);
  sheet.cell('A3').value(`Mã số thuế: ${header.tax_code || ''}`);
  sheet.cell('B7').value(`Địa điểm kinh doanh: ${header.business_location || ''}`);
  sheet.cell('B8').value(`Kỳ kê khai: Năm ${header.period}`);

  // Insert extra rows before total if data exceeds the 7 template slots
  let totalRow = TEMPLATE_TOTAL_ROW;
  if (rows.length > TEMPLATE_DATA_SLOTS) {
    const extra = rows.length - TEMPLATE_DATA_SLOTS;
    sheet.insertRows(TEMPLATE_TOTAL_ROW, extra);
    totalRow = TEMPLATE_TOTAL_ROW + extra;
  }

  // Write data rows (cols B=2, C=3, D=4)
  rows.forEach((row, i) => {
    const r = DATA_START_ROW + i;
    sheet.row(r).cell(2).value(fmtDate(row.date));
    sheet.row(r).cell(3).value(`${row.label} (${row.count} HĐ)`);
    sheet.row(r).cell(4).value(row.amount).style('numberFormat', '#,##0');
  });

  // Write total value
  sheet.row(totalRow).cell(4).value(total).style('numberFormat', '#,##0');

  // Trigger download
  const blob = await wb.outputAsync();
  const url = URL.createObjectURL(blob as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `S1a-HKD-${header.period}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
