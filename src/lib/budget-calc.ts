import type { Category, Donation, Expense } from "@/lib/sheets";

export function expenseTotal(expense: Pick<Expense, "quantite" | "prix_unitaire">) {
  return expense.quantite * expense.prix_unitaire;
}

export function activeExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => !e.annule);
}

export function categoryActiveTotal(category: Category & { expenses: Expense[] }) {
  return activeExpenses(category.expenses).reduce(
    (sum, e) => sum + expenseTotal(e),
    0
  );
}

export function totalActiveExpenses(
  categories: (Category & { expenses: Expense[] })[]
) {
  return categories.reduce((sum, cat) => sum + categoryActiveTotal(cat), 0);
}

export function activeDonations(donations: Donation[]): Donation[] {
  return donations.filter((d) => !d.annule);
}

export function totalActiveDonations(donations: Donation[]) {
  return activeDonations(donations).reduce((sum, d) => sum + d.montant, 0);
}

export function balance(
  categories: (Category & { expenses: Expense[] })[],
  donations: Donation[]
) {
  return totalActiveDonations(donations) - totalActiveExpenses(categories);
}

export function countCancelledExpenses(
  categories: (Category & { expenses: Expense[] })[]
) {
  return categories.reduce(
    (sum, cat) => sum + cat.expenses.filter((e) => e.annule).length,
    0
  );
}

export type ItemSuggestion = {
  nom: string;
  prix_unitaire: number;
};

export function suggestionsFromExpenses(expenses: Expense[]): ItemSuggestion[] {
  const sorted = [...expenses].sort((a, b) => (a.cree_le < b.cree_le ? 1 : -1));
  const seen = new Map<string, ItemSuggestion>();
  for (const expense of sorted) {
    if (!seen.has(expense.nom)) {
      seen.set(expense.nom, { nom: expense.nom, prix_unitaire: expense.prix_unitaire });
    }
  }
  return Array.from(seen.values());
}
