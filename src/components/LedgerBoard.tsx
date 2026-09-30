"use client";

import { useState } from "react";
import type { Category, Expense } from "@/lib/sheets";
import { countCancelledExpenses, totalActiveDonations } from "@/lib/budget-calc";
import { formatNumber } from "@/lib/format";
import CategoryCard from "./CategoryCard";
import AddDonationModal from "./AddDonationModal";
import ExpenseModal from "./ExpenseModal";
import type { Donation } from "@/lib/sheets";

export default function LedgerBoard({
  categories,
  donations,
  canEdit,
}: {
  categories: (Category & { expenses: Expense[] })[];
  donations: Donation[];
  canEdit: boolean;
}) {
  const [showCancelled, setShowCancelled] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [expenseModal, setExpenseModal] = useState<
    { mode: "add" } | { mode: "edit"; expense: Expense } | null
  >(null);

  const cancelledCount = countCancelledExpenses(categories);
  const donationsTotal = totalActiveDonations(donations);

  return (
    <div className="space-y-4">
      {canEdit && cancelledCount > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowCancelled((v) => !v)}
            className="rounded-full border border-border bg-white px-4 py-1.5 text-sm text-text shadow-sm hover:bg-row-hover"
          >
            {showCancelled ? "إخفاء" : "إظهار"} العمليات الملغاة ({cancelledCount})
          </button>
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-5">
          <div>
            <p className="text-lg font-semibold text-text">مجموع التبرعات</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
              MRO {formatNumber(donationsTotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDonationModalOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            + إضافة تبرع
          </button>
        </div>
      )}

      <div>
        {canEdit && (
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text">المصاريف</h2>
              <p className="text-xs text-text-secondary">
                اضغط على مصروف لتعديله أو إلغائه
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpenseModal({ mode: "add" })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              + إضافة مصروف
            </button>
          </div>
        )}

        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              showCancelled={showCancelled}
              canEdit={canEdit}
              onRowClick={(expense) => setExpenseModal({ mode: "edit", expense })}
            />
          ))}
        </div>
      </div>

      {canEdit && donationModalOpen && (
        <AddDonationModal onClose={() => setDonationModalOpen(false)} />
      )}

      {canEdit && expenseModal && (
        <ExpenseModal
          categories={categories}
          expense={expenseModal.mode === "edit" ? expenseModal.expense : undefined}
          onClose={() => setExpenseModal(null)}
        />
      )}
    </div>
  );
}
