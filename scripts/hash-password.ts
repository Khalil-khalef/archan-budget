import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("الاستخدام: npx tsx scripts/hash-password.ts <كلمة المرور>");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log("\nالصق هذه القيمة في عمود mot_de_passe_hash بورقة Utilisateurs:\n");
  console.log(hash);
  console.log();
});
