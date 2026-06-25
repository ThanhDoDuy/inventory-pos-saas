declare module 'xlsx-populate/browser/xlsx-populate' {
  interface Cell {
    value(v: string | number): Cell;
    style(key: string, val: unknown): Cell;
  }
  interface Row {
    cell(col: number): Cell;
  }
  interface Sheet {
    cell(addr: string): Cell;
    row(r: number): Row;
    insertRows(rowNumber: number, count: number): Sheet;
  }
  interface Workbook {
    sheet(index: number): Sheet;
    outputAsync(): Promise<Blob>;
  }
  const XlsxPopulate: {
    fromDataAsync(data: ArrayBuffer): Promise<Workbook>;
  };
  export = XlsxPopulate;
}
