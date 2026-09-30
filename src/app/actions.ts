"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as sheets from "@/lib/sheets";
import { clearSessionCookie, requireSession } from "@/lib/session";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`الحقل "${key}" مطلوب`);
  }
  return value.trim();
}

function requireNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`الحقل "${key}" يجب أن يكون رقمًا`);
  }
  return n;
}

function optionalNumber(formData: FormData, key: string, fallback: number) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/connexion");
}

export async function addDonationAction(formData: FormData) {
  await requireSession();
  const montant = requireNumber(formData, "montant");
  if (montant <= 0) throw new Error("المبلغ يجب أن يكون أكبر من صفر");
  await sheets.addDonation(montant);
  revalidatePath("/");
}

export async function createCategoryAction(formData: FormData) {
  await requireSession();
  const nom = requireString(formData, "nom");
  const category = await sheets.createCategory(nom);
  revalidatePath("/");
  return category;
}

export async function deleteCategoryAction(categoryId: string) {
  await requireSession();
  await sheets.deleteCategory(categoryId);
  revalidatePath("/");
}

export async function addExpenseAction(formData: FormData) {
  await requireSession();
  const categorieId = requireString(formData, "categorieId");
  const nom = requireString(formData, "nom");
  const quantite = optionalNumber(formData, "quantite", 1);
  const prixUnitaire = optionalNumber(formData, "prixUnitaire", 0);
  await sheets.addExpense(categorieId, nom, quantite, prixUnitaire);
  revalidatePath("/");
}

export async function updateExpenseAction(expenseId: string, formData: FormData) {
  await requireSession();
  const categorieId = requireString(formData, "categorieId");
  const nom = requireString(formData, "nom");
  const quantite = optionalNumber(formData, "quantite", 1);
  const prixUnitaire = optionalNumber(formData, "prixUnitaire", 0);
  await sheets.updateExpense(expenseId, { categorieId, nom, quantite, prixUnitaire });
  revalidatePath("/");
}

export async function cancelExpenseAction(expenseId: string, formData: FormData) {
  await requireSession();
  const motif = requireString(formData, "motif");
  await sheets.cancelExpense(expenseId, motif);
  revalidatePath("/");
}

export async function restoreExpenseAction(expenseId: string) {
  await requireSession();
  await sheets.restoreExpense(expenseId);
  revalidatePath("/");
}
