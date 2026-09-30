import { getFullLedger } from "@/lib/sheets";
import {
  activeExpenses,
  balance,
  categoryActiveTotal,
  expenseTotal,
  totalActiveDonations,
  totalActiveExpenses,
} from "@/lib/budget-calc";
import { formatDate, formatNumber } from "@/lib/format";
import PrintTrigger from "./PrintTrigger";

export const dynamic = "force-dynamic";

const DARK = "#1F5566";
const SUBTOTAL_BG = "#B8CCE4";
const SUBTOTAL_TEXT = "#1F3F5A";

export default async function PrintPage() {
  const { categories, donations } = await getFullLedger();
  const donationsTotal = totalActiveDonations(donations);
  const expensesTotal = totalActiveExpenses(categories);
  const solde = balance(categories, donations);
  const activeCategories = categories.filter(
    (c) => activeExpenses(c.expenses).length > 0
  );

  return (
    <div dir="rtl" className="mx-auto max-w-[800px] bg-white p-4 text-text">
      <style>{`
        @page { size: A4 portrait; margin: 14mm; }
        * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .avoid-break { break-inside: avoid; }
      `}</style>
      <PrintTrigger />

      <div
        className="avoid-break mb-3 rounded-lg p-4 text-center text-white"
        style={{ backgroundColor: DARK }}
      >
        <h1 className="text-xl font-bold">
          ميزانية نادي آرشان الثقافي بتاريخ {formatDate(new Date())}
        </h1>
      </div>

      <div
        className="avoid-break mb-3 flex items-center justify-between rounded-lg px-4 py-2 text-white"
        style={{ backgroundColor: DARK }}
      >
        <span className="font-semibold">مجموع التبرعات</span>
        <span className="tabular-nums">{formatNumber(donationsTotal)}</span>
      </div>

      <div
        className="avoid-break mb-3 rounded-lg px-4 py-2 text-white"
        style={{ backgroundColor: DARK }}
      >
        <span className="font-semibold">المصاريف</span>
      </div>

      {activeCategories.map((category) => {
        const active = activeExpenses(category.expenses);
        return (
          <div key={category.id} className="avoid-break mb-3">
            <div
              className="rounded-t-lg px-4 py-2 text-white"
              style={{ backgroundColor: DARK }}
            >
              <span className="font-semibold">{category.nom}</span>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ backgroundColor: DARK, color: "white" }}>
                  <th className="px-2 py-1 text-right font-medium">المصروف</th>
                  <th className="px-2 py-1 text-center font-medium">الكمية</th>
                  <th className="px-2 py-1 text-right font-medium">
                    سعر الوحدة (MRO)
                  </th>
                  <th className="px-2 py-1 text-right font-medium">
                    المجموع (MRO)
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.map((expense, i) => (
                  <tr
                    key={expense.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F2F2F2",
                    }}
                  >
                    <td className="border border-[#BFBFBF] px-2 py-1">
                      {expense.nom}
                    </td>
                    <td className="border border-[#BFBFBF] px-2 py-1 text-center tabular-nums">
                      {expense.quantite}
                    </td>
                    <td className="border border-[#BFBFBF] px-2 py-1 tabular-nums">
                      {formatNumber(expense.prix_unitaire)}
                    </td>
                    <td className="border border-[#BFBFBF] px-2 py-1 tabular-nums">
                      {formatNumber(expenseTotal(expense))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="flex items-center justify-between rounded-b-lg px-4 py-1.5 font-semibold"
              style={{ backgroundColor: SUBTOTAL_BG, color: SUBTOTAL_TEXT }}
            >
              <span>المجموع</span>
              <span className="tabular-nums">
                {formatNumber(categoryActiveTotal(category))}
              </span>
            </div>
          </div>
        );
      })}

      <div
        className="avoid-break mb-2 mt-4 flex items-center justify-between rounded-lg px-4 py-2 font-semibold"
        style={{ backgroundColor: SUBTOTAL_BG, color: SUBTOTAL_TEXT }}
      >
        <span>مجموع المصاريف</span>
        <span className="tabular-nums">{formatNumber(expensesTotal)}</span>
      </div>

      <div
        className="avoid-break flex items-center justify-between rounded-lg px-4 py-3 font-bold text-white"
        style={{ backgroundColor: DARK }}
      >
        <span>الرصيد المتبقي</span>
        <span className="tabular-nums">{formatNumber(solde)}</span>
      </div>
    </div>
  );
}
