"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/connexion/actions";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [serverErrorDismissed, setServerErrorDismissed] = useState(false);

  const phoneError = attempted && phone.length !== 8;
  const passwordError = attempted && password.length === 0;
  const isComplete = phone.length === 8 && password.length > 0;
  const serverError =
    !serverErrorDismissed && state?.error ? state.error : null;

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 8));
    setServerErrorDismissed(true);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setServerErrorDismissed(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setAttempted(true);
    if (!isComplete) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-white">
      <div className="bg-primary p-6 text-white">
        <h1 className="text-[22px] font-bold">تسجيل الدخول</h1>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <div className="relative">
            <label className="mb-1 block text-[13px] font-semibold text-text-secondary">
              رقم الهاتف
            </label>
            <span className="absolute left-0 top-0 text-xs text-[#8A9A9F]">
              {phone.length}/8
            </span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-[17px] tabular-nums tracking-[2px] focus:outline-none ${
                phoneError
                  ? "border-danger"
                  : "border-border focus:border-primary"
              }`}
            />
          </div>
          {phoneError && (
            <p className="mt-1 text-xs text-danger">
              رقم الهاتف يجب أن يتكون من 8 أرقام
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-semibold text-text-secondary">
            كلمة المرور
          </label>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 ${
              passwordError ? "border-danger" : "border-border"
            }`}
          >
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="shrink-0 text-text-secondary hover:text-primary"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              dir="rtl"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="min-w-0 flex-1 py-2.5 text-right text-sm focus:outline-none"
            />
          </div>
          {passwordError && (
            <p className="mt-1 text-xs text-danger">يرجى إدخال كلمة المرور</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg border border-[#EFD3CE] bg-danger-bg px-3 py-2 text-sm text-danger">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={!isComplete || isPending}
          style={{ opacity: !isComplete ? 0.6 : 1 }}
          className="w-full rounded-lg bg-primary py-2.5 text-[16px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed"
        >
          {isPending ? "جاري الدخول…" : "دخول"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-separator" />
          <span className="text-[13px] text-[#8A9A9F]">أو</span>
          <div className="h-px flex-1 bg-separator" />
        </div>

        <Link
          href="/"
          className="block w-full rounded-lg border border-[#9FB3BA] py-2.5 text-center text-sm font-medium text-primary hover:bg-row-hover"
        >
          عرض الميزانية فقط
        </Link>
      </form>

      <div className="border-t border-separator px-6 py-4 text-center text-[13px] text-text-secondary">
        للحصول على حساب، تواصل مع مسؤول النادي
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 5.2C11.05 5.07 11.52 5 12 5c7 0 11 7 11 7-.63 1.11-1.43 2.2-2.4 3.16M6.6 6.6C3.9 8.3 2 12 2 12s4 7 11 7c1.4 0 2.67-.28 3.8-.75M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
