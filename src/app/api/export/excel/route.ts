import { NextResponse } from "next/server";
import { getFullLedger } from "@/lib/sheets";
import { buildLedgerWorkbook, exportFileName } from "@/lib/export-xlsx";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }

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
