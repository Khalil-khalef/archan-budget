"use client";

import { useTransition } from "react";
import type { Category, Expense } from "@/lib/sheets";
import { categoryActiveTotal, expenseTotal } from "@/lib/budget-calc";
import { formatNumber } from "@/lib/format";
import { deleteCategoryAction } from "@/app/actions";

export default function CategoryCard({
  category,
  showCancelled,
  onRowClick,
}: {
  category: Category & { expenses: Expense[] };
  showCancelled: boolean;
  onRowClick: (expense: Expense) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const rows = category.expenses.filter((e) => !e.annule || showCancelled);
  const subtotal = categoryActiveTotal(category);
  const canDelete = category.expenses.length === 0;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCategoryAction(category.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "تعذر حذف الفئة");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between bg-primary px-4 py-3">
        <h3 className="font-semibold text-white">{category.nom}</h3>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-white/80 hover:text-white hover:underline"
          >
            حذف الفئة
          </button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_44px_72px_80px] gap-1 bg-table-header px-3 py-2 text-[11px] text-text-secondary sm:grid-cols-[minmax(0,1fr)_70px_110px_110px] sm:gap-2 sm:px-4 sm:text-xs">
        <span>المصروف</span>
        <span className="text-center">الكمية</span>
        <span>سعر الوحدة</span>
        <span>المجموع</span>
      </div>

      {rows.length === 0 && (
        <p className="px-4 py-3 text-sm text-text-secondary">لا توجد مصاريف</p>
      )}

      {rows.map((expense) => (
        <button
          key={expense.id}
          type="button"
          onClick={() => onRowClick(expense)}
          className={`grid w-full grid-cols-[minmax(0,1fr)_44px_72px_80px] gap-1 border-t border-separator px-3 py-2.5 text-start text-[13px] hover:bg-row-hover sm:grid-cols-[minmax(0,1fr)_70px_110px_110px] sm:gap-2 sm:px-4 sm:text-sm ${
            expense.annule ? "text-[#8A9A9F] line-through" : "text-text"
          }`}
        >
          <span className="flex flex-wrap items-center gap-1.5">
            {expense.nom}
            {expense.annule && (
              <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger no-underline">
                ملغى
              </span>
            )}
          </span>
          <span className="text-center tabular-nums text-text-secondary">
            {expense.quantite}
          </span>
          <span className="tabular-nums text-text-secondary">
            {formatNumber(expense.prix_unitaire)}
          </span>
          <span className="tabular-nums text-text-secondary">
            {formatNumber(expenseTotal(expense))}
          </span>
        </button>
      ))}

      <div className="flex items-center justify-between bg-subtotal-bg px-4 py-2.5 text-sm font-semibold text-subtotal-text">
        <span>المجموع</span>
        <span className="tabular-nums">{formatNumber(subtotal)}</span>
      </div>
    </div>
  );
}
