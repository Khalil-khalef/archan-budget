import ExcelJS from "exceljs";
import type { Ledger } from "./sheets";
import { activeExpenses, totalActiveDonations } from "./budget-calc";
import { formatDate } from "./format";

const DARK = "FF1F5566";
const SUBTOTAL_BG = "FFB8CCE4";
const SUBTOTAL_TEXT = "FF1F3F5A";
const WHITE = "FFFFFFFF";
const ALT_ROW = "FFF2F2F2";
const BORDER_GRAY = "FFBFBFBF";

const thinBorder = {
  top: { style: "thin" as const, color: { argb: BORDER_GRAY } },
  bottom: { style: "thin" as const, color: { argb: BORDER_GRAY } },
  left: { style: "thin" as const, color: { argb: BORDER_GRAY } },
  right: { style: "thin" as const, color: { argb: BORDER_GRAY } },
};

const NUMBER_FORMAT = "#,##0";

export function buildLedgerWorkbook(ledger: Ledger) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الميزانية", {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [{ width: 34 }, { width: 16 }, { width: 22 }, { width: 18 }];

  let rowIndex = 1;

  const setRowFill = (row: ExcelJS.Row, color: string) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    });
  };

  const darkBand = (text: string, mergeToC = false) => {
    const r = sheet.getRow(rowIndex);
    r.getCell(1).value = text;
    sheet.mergeCells(rowIndex, 1, rowIndex, mergeToC ? 3 : 4);
    setRowFill(r, DARK);
    r.eachCell({ includeEmpty: true }, (c) => {
      c.font = { bold: true, size: 12, color: { argb: WHITE }, name: "Arial" };
      c.alignment = { horizontal: "right", vertical: "middle" };
    });
    rowIndex++;
    return r;
  };

  // العنوان
  {
    const r = sheet.getRow(rowIndex);
    r.height = 30;
    r.getCell(1).value = `ميزانية نادي آرشان الثقافي بتاريخ ${formatDate(new Date())}`;
    sheet.mergeCells(rowIndex, 1, rowIndex, 4);
    setRowFill(r, DARK);
    r.getCell(1).font = { bold: true, size: 18, color: { argb: WHITE }, name: "Arial" };
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    rowIndex++;
  }

  // مجموع التبرعات
  const donationsTotal = totalActiveDonations(ledger.donations);
  const donationsRowIndex = rowIndex;
  {
    const r = darkBand("مجموع التبرعات", true);
    r.getCell(4).value = donationsTotal;
    r.getCell(4).numFmt = NUMBER_FORMAT;
  }

  // شريط المصاريف
  darkBand("المصاريف");

  // رأس الجدول
  {
    const r = sheet.getRow(rowIndex);
    const headers = ["المصروف", "الكمية", "سعر الوحدة (MRO)", "المجموع (MRO)"];
    headers.forEach((h, i) => {
      const c = r.getCell(i + 1);
      c.value = h;
      c.font = { bold: true, size: 12, color: { argb: WHITE }, name: "Arial" };
      c.alignment = { horizontal: i === 1 ? "center" : "right", vertical: "middle" };
    });
    setRowFill(r, DARK);
    rowIndex++;
  }

  const subtotalRows: number[] = [];
  let globalItemIndex = 0;

  for (const category of ledger.categories) {
    const active = activeExpenses(category.expenses);
    if (active.length === 0) continue;

    darkBand(category.nom);

    const firstItemRow = rowIndex;
    for (const expense of active) {
      const bg = globalItemIndex % 2 === 0 ? WHITE : ALT_ROW;
      globalItemIndex++;

      const r = sheet.getRow(rowIndex);
      r.getCell(1).value = expense.nom;
      r.getCell(2).value = expense.quantite;
      r.getCell(3).value = expense.prix_unitaire;
      r.getCell(4).value = { formula: `B${rowIndex}*C${rowIndex}` };

      setRowFill(r, bg);
      r.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
      r.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      r.getCell(3).numFmt = NUMBER_FORMAT;
      r.getCell(4).numFmt = NUMBER_FORMAT;
      r.eachCell({ includeEmpty: true }, (c) => {
        c.font = { size: 10, name: "Arial" };
        c.border = thinBorder;
      });
      rowIndex++;
    }
    const lastItemRow = rowIndex - 1;

    // مجموع التصنيف
    {
      const r = sheet.getRow(rowIndex);
      r.getCell(1).value = `مجموع ${category.nom}`;
      r.getCell(4).value = { formula: `SUM(D${firstItemRow}:D${lastItemRow})` };
      sheet.mergeCells(rowIndex, 1, rowIndex, 3);
      setRowFill(r, SUBTOTAL_BG);
      r.eachCell({ includeEmpty: true }, (c) => {
        c.font = { bold: true, size: 12, color: { argb: SUBTOTAL_TEXT }, name: "Arial" };
        c.alignment = { horizontal: "right", vertical: "middle" };
      });
      r.getCell(4).numFmt = NUMBER_FORMAT;
      subtotalRows.push(rowIndex);
      rowIndex++;
    }
  }

  rowIndex++; // صف فارغ

  // مجموع المصاريف
  const expensesTotalRowIndex = rowIndex;
  {
    const r = sheet.getRow(rowIndex);
    r.getCell(1).value = "مجموع المصاريف";
    r.getCell(4).value =
      subtotalRows.length > 0
        ? { formula: subtotalRows.map((n) => `D${n}`).join("+") }
        : 0;
    sheet.mergeCells(rowIndex, 1, rowIndex, 3);
    setRowFill(r, SUBTOTAL_BG);
    r.eachCell({ includeEmpty: true }, (c) => {
      c.font = { bold: true, size: 12, color: { argb: SUBTOTAL_TEXT }, name: "Arial" };
      c.alignment = { horizontal: "right", vertical: "middle" };
    });
    r.getCell(4).numFmt = NUMBER_FORMAT;
    rowIndex++;
  }

  rowIndex++; // صف فارغ

  // الرصيد المتبقي
  {
    const r = sheet.getRow(rowIndex);
    r.height = 26;
    r.getCell(1).value = "الرصيد المتبقي";
    r.getCell(4).value = {
      formula: `D${donationsRowIndex}-D${expensesTotalRowIndex}`,
    };
    sheet.mergeCells(rowIndex, 1, rowIndex, 3);
    setRowFill(r, DARK);
    r.eachCell({ includeEmpty: true }, (c) => {
      c.font = { bold: true, size: 14, color: { argb: WHITE }, name: "Arial" };
      c.alignment = { horizontal: "right", vertical: "middle" };
    });
    r.getCell(4).numFmt = NUMBER_FORMAT;
    rowIndex++;
  }

  return workbook;
}

export function exportFileName(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `ميزانية_${day}-${month}-${year}.xlsx`;
}
