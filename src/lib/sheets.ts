import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";

export type Category = {
  id: string;
  nom: string;
};

export type Expense = {
  id: string;
  categorie_id: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  cree_le: string;
  annule: boolean;
  motif_annulation: string;
  annule_le: string;
};

export type Donation = {
  id: string;
  montant: number;
  date: string;
  annule: boolean;
};

export type Ledger = {
  categories: (Category & { expenses: Expense[] })[];
  donations: Donation[];
};

export type User = {
  id: string;
  telephone: string;
  mot_de_passe_hash: string;
  nom: string;
  actif: boolean;
};

const SHEET_SCHEMAS = {
  Categories: ["id", "nom"],
  Depenses: [
    "id",
    "categorie_id",
    "nom",
    "quantite",
    "prix_unitaire",
    "cree_le",
    "annule",
    "motif_annulation",
    "annule_le",
  ],
  Dons: ["id", "montant", "date", "annule"],
  Utilisateurs: ["id", "telephone", "mot_de_passe_hash", "nom", "actif"],
} as const;

type SheetName = keyof typeof SHEET_SCHEMAS;

let cachedDoc: GoogleSpreadsheet | null = null;

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (cachedDoc) return cachedDoc;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) {
    throw new Error(
      "متغيرات البيئة GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY غير مضبوطة"
    );
  }

  const auth = new JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();

  for (const [title, headers] of Object.entries(SHEET_SCHEMAS)) {
    if (!doc.sheetsByTitle[title]) {
      await doc.addSheet({ title, headerValues: [...headers] });
    }
  }

  cachedDoc = doc;
  return doc;
}

async function getSheet(name: SheetName): Promise<GoogleSpreadsheetWorksheet> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[name];
  if (!sheet) throw new Error(`ورقة "${name}" غير موجودة`);
  return sheet;
}

function newId(): string {
  return crypto.randomUUID();
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown): boolean {
  return value === true || value === "TRUE" || value === "true";
}

// ---------- Categories ----------

export async function listCategories(): Promise<Category[]> {
  const sheet = await getSheet("Categories");
  const rows = await sheet.getRows();
  return rows.map((r) => ({ id: r.get("id"), nom: r.get("nom") }));
}

export async function createCategory(nom: string): Promise<Category> {
  const sheet = await getSheet("Categories");
  const category: Category = { id: newId(), nom };
  await sheet.addRow(category);
  return category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const [categorySheet, expenseSheet] = await Promise.all([
    getSheet("Categories"),
    getSheet("Depenses"),
  ]);

  const expenseRows = await expenseSheet.getRows();
  const hasAnyExpense = expenseRows.some(
    (r) => r.get("categorie_id") === categoryId
  );
  if (hasAnyExpense) {
    throw new Error("لا يمكن حذف فئة تحتوي على مصاريف (حتى لو ملغاة)");
  }

  const categoryRows = await categorySheet.getRows();
  const row = categoryRows.find((r) => r.get("id") === categoryId);
  if (row) await row.delete();
}

// ---------- Depenses ----------

function rowToExpense(r: {
  get: (key: string) => string | number | undefined;
}): Expense {
  return {
    id: String(r.get("id")),
    categorie_id: String(r.get("categorie_id")),
    nom: String(r.get("nom")),
    quantite: num(r.get("quantite"), 1),
    prix_unitaire: num(r.get("prix_unitaire")),
    cree_le: String(r.get("cree_le") ?? ""),
    annule: bool(r.get("annule")),
    motif_annulation: String(r.get("motif_annulation") ?? ""),
    annule_le: String(r.get("annule_le") ?? ""),
  };
}

export async function addExpense(
  categorieId: string,
  nom: string,
  quantite: number,
  prixUnitaire: number
): Promise<Expense> {
  const sheet = await getSheet("Depenses");
  const expense: Expense = {
    id: newId(),
    categorie_id: categorieId,
    nom,
    quantite,
    prix_unitaire: prixUnitaire,
    cree_le: new Date().toISOString(),
    annule: false,
    motif_annulation: "",
    annule_le: "",
  };
  await sheet.addRow({ ...expense, annule: "FALSE" });
  return expense;
}

export async function updateExpense(
  expenseId: string,
  data: {
    categorieId: string;
    nom: string;
    quantite: number;
    prixUnitaire: number;
  }
): Promise<void> {
  const sheet = await getSheet("Depenses");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("id") === expenseId);
  if (!row) throw new Error("المصروف غير موجود");
  row.assign({
    categorie_id: data.categorieId,
    nom: data.nom,
    quantite: data.quantite,
    prix_unitaire: data.prixUnitaire,
  });
  await row.save();
}

export async function cancelExpense(
  expenseId: string,
  motif: string
): Promise<void> {
  const sheet = await getSheet("Depenses");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("id") === expenseId);
  if (!row) throw new Error("المصروف غير موجود");
  row.assign({
    annule: "TRUE",
    motif_annulation: motif,
    annule_le: new Date().toISOString(),
  });
  await row.save();
}

export async function restoreExpense(expenseId: string): Promise<void> {
  const sheet = await getSheet("Depenses");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("id") === expenseId);
  if (!row) throw new Error("المصروف غير موجود");
  row.assign({ annule: "FALSE", motif_annulation: "", annule_le: "" });
  await row.save();
}

// ---------- Dons ----------

export async function listDonations(): Promise<Donation[]> {
  const sheet = await getSheet("Dons");
  const rows = await sheet.getRows();
  return rows.map((r) => ({
    id: String(r.get("id")),
    montant: num(r.get("montant")),
    date: String(r.get("date") ?? ""),
    annule: bool(r.get("annule")),
  }));
}

export async function addDonation(montant: number): Promise<Donation> {
  const sheet = await getSheet("Dons");
  const donation: Donation = {
    id: newId(),
    montant,
    date: new Date().toISOString(),
    annule: false,
  };
  await sheet.addRow({ ...donation, annule: "FALSE" });
  return donation;
}

// ---------- Utilisateurs ----------

export async function findActiveUserByPhone(
  telephone: string
): Promise<User | null> {
  const sheet = await getSheet("Utilisateurs");
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get("telephone") === telephone);
  if (!row) return null;
  if (!bool(row.get("actif"))) return null;
  return {
    id: String(row.get("id")),
    telephone: String(row.get("telephone")),
    mot_de_passe_hash: String(row.get("mot_de_passe_hash")),
    nom: String(row.get("nom") ?? ""),
    actif: true,
  };
}

// ---------- Ledger (aggregate) ----------

export async function getFullLedger(): Promise<Ledger> {
  const [categorySheet, expenseSheet, donationSheet] = await Promise.all([
    getSheet("Categories"),
    getSheet("Depenses"),
    getSheet("Dons"),
  ]);

  const [categoryRows, expenseRows, donationRows] = await Promise.all([
    categorySheet.getRows(),
    expenseSheet.getRows(),
    donationSheet.getRows(),
  ]);

  const expenses = expenseRows.map(rowToExpense);

  const categories = categoryRows.map((r) => {
    const id = String(r.get("id"));
    return {
      id,
      nom: String(r.get("nom")),
      expenses: expenses.filter((e) => e.categorie_id === id),
    };
  });

  const donations: Donation[] = donationRows.map((r) => ({
    id: String(r.get("id")),
    montant: num(r.get("montant")),
    date: String(r.get("date") ?? ""),
    annule: bool(r.get("annule")),
  }));

  return { categories, donations };
}
