# ميزانية نادي آرشان الثقافي

تطبيق ويب لتسجيل دفتر حسابات النادي (تبرعات ومصاريف) بدل ملف إكسل، مع تصدير Excel وPDF في أي وقت.

يستخدم **Google Sheets** كقاعدة بيانات: كل البيانات (الفئات، المصاريف، التبرعات) تُخزَّن مباشرة في
جدول بيانات Google Sheets تختاره أنت، ويمكنك فتحه والاطلاع عليه في أي وقت.

الدفتر واحد ومستمر (لا يوجد مفهوم "ميزانيات متعددة") — العنوان ثابت، والتاريخ المعروض هو تاريخ
اليوم. أي مصروف لا يُحذف أبدًا: يمكن فقط **إلغاؤه** بسبب إجباري، وتبقى آثاره ظاهرة في السجل دون أن
تُحتسب في المجاميع أو التصدير.

## الإعداد (مرة واحدة فقط)

### 1) إنشاء Google Sheet

أنشئ جدول بيانات جديد فارغ على [sheets.google.com](https://sheets.google.com) وانسخ معرّفه (الجزء من الرابط بين `/d/` و `/edit`):

```
https://docs.google.com/spreadsheets/d/CE-JUZ-EST-LID/edit
```

### 2) إنشاء حساب خدمة Google (Service Account)

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/) وأنشئ مشروعًا جديدًا (أو استعمل مشروعًا موجودًا)
2. فعّل **Google Sheets API** من صفحة "APIs & Services" → "Library"
3. من "APIs & Services" → "Credentials" → "Create Credentials" → **Service Account**
4. بعد إنشائه، افتح الحساب → تبويب **Keys** → **Add Key** → **JSON**، وسيُحمَّل ملف JSON يحتوي على `client_email` و `private_key`
5. **شارك** جدول Google Sheets الذي أنشأته في الخطوة 1 مع بريد الحساب (`client_email`) بصلاحية **محرر (Editor)**

### 3) ضبط متغيرات البيئة

انسخ `.env.example` إلى `.env.local` واملأ القيم:

```
GOOGLE_SHEET_ID="معرّف الجدول من الخطوة 1"
GOOGLE_SERVICE_ACCOUNT_EMAIL="client_email من ملف JSON"
GOOGLE_PRIVATE_KEY="private_key من ملف JSON (مع علامات الاقتباس)"
```

> ملاحظة: `GOOGLE_PRIVATE_KEY` يحتوي على أسطر جديدة (`\n`) — انسخه كما هو بين علامتي اقتباس.

عند أول تشغيل، سينشئ التطبيق تلقائيًا 3 أوراق (تبويبات) داخل الجدول:

| الورقة | الأعمدة |
|---|---|
| `Categories` | `id`, `nom` |
| `Depenses` | `id`, `categorie_id`, `nom`, `quantite`, `prix_unitaire`, `cree_le`, `annule`, `motif_annulation`, `annule_le` |
| `Dons` | `id`, `montant`, `date`, `annule` |

المجموع (`quantite × prix_unitaire`) يُحسب دائمًا ولا يُخزَّن. الصفوف الملغاة (`annule = TRUE`)
تُستثنى من كل المجاميع والتصدير، لكنها تبقى في السجل.

### 4) ترحيل بيانات قديمة (إن وُجدت)

إذا كان الجدول يحتوي على بيانات من نسخة سابقة من التطبيق (أوراق `Budgets`/`Income`/`Categories`/`Items`)، شغّل:

```bash
npm run migrate
```

يُعيد الأمر تسمية الأوراق القديمة بلاحقة `_legacy` (دون حذفها) وينسخ بياناتها إلى النموذج الجديد.

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## النشر على Vercel

1. اربط المستودع بـ Vercel
2. أضف نفس متغيرات البيئة الثلاثة (`GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) في إعدادات المشروع على Vercel (Settings → Environment Variables)
3. انشر (Deploy)

## المزايا

- دفتر حسابات واحد مستمر: فئات ومصاريف وتبرعات، بدون تعدد "ميزانيات"
- إضافة مصروف عبر نافذة موحّدة: اختيار الفئة (أو إنشاء فئة جديدة)، والبحث عن عنصر سابق أو كتابة اسم جديد
- المصاريف للقراءة فقط في الجدول — التعديل والإلغاء عبر النافذة فقط
- إلغاء مصروف يتطلب سببًا إجباريًا، ولا حذف نهائي أبدًا
- تصدير Excel بصيغة نفس تصميم النادي، بمعادلات حية (`=B×C`, `SUM`)
- تصدير PDF عبر صفحة طباعة (A4) تفتح في تبويب جديد
- البيانات مخزَّنة في Google Sheets، يمكن مراجعتها مباشرة من هناك
