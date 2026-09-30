"use server";

import { redirect } from "next/navigation";
import { findActiveUserByPhone } from "@/lib/sheets";
import { verifyPassword } from "@/lib/password";
import { createSessionCookie } from "@/lib/session";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginRateLimit,
} from "@/lib/rate-limit";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^\d{8}$/.test(phone)) {
    return { error: "رقم الهاتف يجب أن يتكون من 8 أرقام" };
  }
  if (!password) {
    return { error: "يرجى إدخال كلمة المرور" };
  }

  const rateLimit = checkLoginRateLimit(phone);
  if (rateLimit.locked) {
    return {
      error: `تم حظر المحاولات مؤقتًا، يرجى المحاولة بعد ${rateLimit.minutesLeft} دقيقة`,
    };
  }

  const user = await findActiveUserByPhone(phone);
  const passwordOk = user
    ? await verifyPassword(password, user.mot_de_passe_hash)
    : false;

  if (!user || !passwordOk) {
    recordLoginFailure(phone);
    return { error: "رقم الهاتف أو كلمة المرور غير صحيحة" };
  }

  resetLoginRateLimit(phone);
  await createSessionCookie({ userId: user.id, phone: user.telephone, nom: user.nom });
  redirect("/");
}
