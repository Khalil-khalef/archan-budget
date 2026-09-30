import { NextResponse } from "next/server";
import { getFullLedger } from "@/lib/sheets";
import { buildLedgerWorkbook, exportFileName } from "@/lib/export-xlsx";

export async function GET() {
  const ledger = await getFullLedger();
  const workbook = buildLedgerWorkbook(ledger);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        exportFileName()
      )}"`,
    },
  });
}
