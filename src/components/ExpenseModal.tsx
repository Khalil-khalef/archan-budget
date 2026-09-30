"use client";

import { useMemo, useState, useTransition } from "react";
import Modal from "./Modal";
import type { Category, Expense } from "@/lib/sheets";
import { suggestionsFromExpenses } from "@/lib/budget-calc";
import { formatDate, formatNumber } from "@/lib/format";
import {
  addExpenseAction,
  cancelExpenseAction,
  createCategoryAction,
  restoreExpenseAction,
  updateExpenseAction,
} from "@/app/actions";

export default function ExpenseModal({
  categories,
  expense,
  defaultCategoryId,
  onClose,
}: {
  categories: (Category & { expenses: Expense[] })[];
  expense?: Expense;
  defaultCategoryId?: string;
  onClose: () => void;
}) {
  const isEdit = !!expense;
  const [isCancelledView, setIsCancelledView] = useState(!!expense?.annule);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [motif, setMotif] = useState("");

  const [categorieId, setCategorieId] = useState(
    expense?.categorie_id ?? defaultCategoryId ?? ""
  );
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [search, setSearch] = useState(expense?.nom ?? "");
  const [quantite, setQuantite] = useState(String(expense?.quantite ?? 1));
  const [prixUnitaire, setPrixUnitaire] = useState(
    expense ? String(expense.prix_unitaire) : ""
  );

  const [isPending, startTransition] = useTransition();

  const selectedCategory = categories.find((c) => c.id === categorieId);

  const suggestions = useMemo(() => {
    if (!selectedCategory) return [];
    const all = suggestionsFromExpenses(selectedCategory.expenses);
    if (!search.trim()) return all;
    return all.filter((s) => s.nom.includes(search.trim()));
  }, [selectedCategory, search]);

  const exactMatch = suggestions.some((s) => s.nom === search.trim());

  const total = (Number(quantite) || 0) * (Number(prixUnitaire) || 0);

  const isValid =
    !!categorieId && search.trim() !== "" && Number(quantite) > 0 && Number(prixUnitaire) >= 0;

  const handleCreateCategoryForm = () => {
    const nom = newCategoryName.trim();
    if (!nom) return;
    const formData = new FormData();
    formData.set("nom", nom);
    startTransition(async () => {
      const category = await createCategoryAction(formData);
      setCategorieId(category.id);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
    });
  };

  const handleSave = () => {
    if (!isValid) return;
    const formData = new FormData();
    formData.set("categorieId", categorieId);
    formData.set("nom", search.trim());
    formData.set("quantite", quantite);
    formData.set("prixUnitaire", prixUnitaire);

    startTransition(async () => {
      if (isEdit && expense) {
        await updateExpenseAction(expense.id, formData);
      } else {
        await addExpenseAction(formData);
      }
      onClose();
    });
  };

  const handleConfirmCancel = () => {
    if (!motif.trim() || !expense) return;
    const formData = new FormData();
    formData.set("motif", motif.trim());
    startTransition(async () => {
      await cancelExpenseAction(expense.id, formData);
      setIsCancelledView(true);
      setShowCancelForm(false);
    });
  };

  const handleRestore = () => {
    if (!expense) return;
    startTransition(async () => {
      await restoreExpenseAction(expense.id);
      setIsCancelledView(false);
    });
  };

  if (isCancelledView && expense) {
    return (
      <Modal
        title="مصروف ملغى"
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-row-hover"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleRestore}
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-45"
            >
              استعادة المصروف
            </button>
          </>
        }
      >
        <div className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-sm">
          <p className="mb-2 font-medium text-danger">
            هذا المصروف ملغى ولا يُحتسب في المجموع
          </p>
          <p className="mb-1 text-text">
            {expense.nom} — {expense.quantite} × {formatNumber(expense.prix_unitaire)} ={" "}
            {formatNumber(expense.quantite * expense.prix_unitaire)} MRO
          </p>
          <p className="mb-1 text-text-secondary">السبب: {expense.motif_annulation}</p>
          {expense.annule_le && (
            <p className="text-text-secondary">
              بتاريخ {formatDate(expense.annule_le)}
            </p>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={isEdit ? "تعديل مصروف" : "إضافة مصروف"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-row-hover"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-45"
          >
            حفظ
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-text">1. الفئة</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategorieId(c.id)}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  categorieId === c.id
                    ? "bg-primary text-white"
                    : "border border-border text-text hover:bg-row-hover"
                }`}
              >
                {c.nom}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNewCategoryInput((v) => !v)}
              className="rounded-full border border-dashed border-border px-4 py-1.5 text-sm text-text-secondary hover:bg-row-hover"
            >
              + فئة جديدة
            </button>
          </div>
          {showNewCategoryInput && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategoryForm()}
                placeholder="اسم الفئة الجديدة"
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCategoryForm}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover"
              >
                إضافة
              </button>
            </div>
          )}
        </div>

        {categorieId && (
          <div>
            <p className="mb-2 text-sm font-medium text-text">2. المصروف</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن عنصر أو اكتب اسمًا جديدًا"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />

            {suggestions.length > 0 ? (
              <div className="mt-2 max-h-[200px] overflow-y-auto rounded-lg border border-border">
                {suggestions.map((s) => (
                  <button
                    key={s.nom}
                    type="button"
                    onClick={() => {
                      setSearch(s.nom);
                      setPrixUnitaire(String(s.prix_unitaire));
                    }}
                    className="flex w-full items-center justify-between border-b border-separator px-3 py-2 text-sm last:border-0 hover:bg-row-hover"
                  >
                    <span className="text-text">{s.nom}</span>
                    <span className="text-text-secondary tabular-nums">
                      {formatNumber(s.prix_unitaire)} MRO
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-border bg-table-header px-3 py-2 text-sm text-text-secondary">
                لا توجد عناصر في هذه الفئة
              </p>
            )}

            {search.trim() && !exactMatch && (
              <p className="mt-2 text-sm text-success">
                سيتم إنشاء عنصر جديد: «{search.trim()}»
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  الكمية
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">
                  سعر الوحدة (MRO)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={prixUnitaire}
                  onChange={(e) => setPrixUnitaire(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-table-header px-3 py-2 text-sm">
              <span className="text-text-secondary">المجموع</span>
              <span className="font-semibold tabular-nums text-text">
                MRO {formatNumber(total)}
              </span>
            </div>
          </div>
        )}

        {isEdit && expense && !showCancelForm && (
          <button
            type="button"
            onClick={() => setShowCancelForm(true)}
            className="w-full rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger-bg"
          >
            إلغاء المصروف
          </button>
        )}

        {isEdit && showCancelForm && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg p-4">
            <p className="mb-1 text-sm font-semibold text-danger">
              إلغاء هذا المصروف
            </p>
            <p className="mb-3 text-sm text-text-secondary">
              سيبقى ظاهرًا في السجل مع السبب، ولن يُحتسب في المجموع.
            </p>
            <label className="mb-1 block text-xs text-text-secondary">
              سبب الإلغاء (إجباري)
            </label>
            <input
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-row-hover"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!motif.trim() || isPending}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-45"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
