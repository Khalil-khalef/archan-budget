import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import * as sheets from "@/lib/sheets";

const LEGACY_SHEETS = ["Budgets", "Income", "Categories", "Items"] as const;

async function connectRaw() {
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!;

  const auth = new JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();
  return doc;
}

async function main() {
  const doc = await connectRaw();

  const legacy: Record<string, GoogleSpreadsheetWorksheet> = {};
  for (const name of LEGACY_SHEETS) {
    const sheet = doc.sheetsByTitle[name];
    if (sheet) legacy[name] = sheet;
  }

  if (!legacy.Budgets && !legacy.Categories && !legacy.Items && !legacy.Income) {
    console.log("لا توجد بيانات قديمة للترحيل. تخطي.");
    return;
  }

  const oldCategoryRows = legacy.Categories ? await legacy.Categories.getRows() : [];
  const oldItemRows = legacy.Items ? await legacy.Items.getRows() : [];
  const oldIncomeRows = legacy.Income ? await legacy.Income.getRows() : [];

  console.log(
    `ترحيل ${oldCategoryRows.length} فئة، ${oldItemRows.length} مصروف، ${oldIncomeRows.length} دخل...`
  );

  // إعادة تسمية الأوراق القديمة قبل إنشاء الأوراق الجديدة (تجنب تصادم الأسماء)
  for (const [name, sheet] of Object.entries(legacy)) {
    await sheet.updateProperties({ title: `${name}_legacy` });
  }

  const categoryIdMap = new Map<string, string>();
  for (const row of oldCategoryRows) {
    const oldId = row.get("id") as string;
    const name = row.get("name") as string;
    const category = await sheets.createCategory(name);
    categoryIdMap.set(oldId, category.id);
  }

  for (const row of oldItemRows) {
    const oldCategoryId = row.get("categoryId") as string;
    const newCategoryId = categoryIdMap.get(oldCategoryId);
    if (!newCategoryId) continue;
    await sheets.addExpense(
      newCategoryId,
      row.get("label") as string,
      Number(row.get("quantity")) || 1,
      Number(row.get("unitPrice")) || 0
    );
  }

  for (const row of oldIncomeRows) {
    const amount = Number(row.get("amount")) || 0;
    if (amount > 0) await sheets.addDonation(amount);
  }

  console.log("تم الترحيل بنجاح. الأوراق القديمة أُعيدت تسميتها بلاحقة _legacy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
