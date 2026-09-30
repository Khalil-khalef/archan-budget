import { getFullLedger } from "@/lib/sheets";
import {
  balance,
  totalActiveDonations,
  totalActiveExpenses,
} from "@/lib/budget-calc";
import { formatDate, formatNumber } from "@/lib/format";
import LedgerBoard from "@/components/LedgerBoard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, donations } = await getFullLedger();

  const donationsTotal = totalActiveDonations(donations);
  const expensesTotal = totalActiveExpenses(categories);
  const solde = balance(categories, donations);

  return (
    <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
      <header className="rounded-xl bg-primary p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">ميزانية بتاريخ {formatDate(new Date())}</span>
          <div className="flex gap-2">
            <a
              href="/print"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            >
              تصدير PDF ⬇
            </a>
            <a
              href="/api/export/excel"
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-white/90"
            >
              تصدير Excel ⬇
            </a>
          </div>
        </div>
        <h1 className="mt-3 text-xl font-bold sm:text-2xl">
          ميزانية نادي آرشان الثقافي
        </h1>
      </header>

      <div
        className="my-4 grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-[13px] text-text-secondary">مجموع التبرعات (MRO)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
            {formatNumber(donationsTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-[13px] text-text-secondary">مجموع المصاريف (MRO)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-text">
            {formatNumber(expensesTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-[13px] text-text-secondary">الرصيد المتبقي (MRO)</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${
              solde >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatNumber(solde)}
          </p>
        </div>
      </div>

      <LedgerBoard categories={categories} donations={donations} />
    </main>
  );
}
