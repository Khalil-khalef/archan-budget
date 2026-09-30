import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "archan_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 يومًا

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("متغير البيئة SESSION_SECRET غير مضبوط");
  }
  return new TextEncoder().encode(secret);
}

export type Session = {
  userId: string;
  phone: string;
  nom: string;
};

export async function createSessionCookie(user: Session): Promise<void> {
  const token = await new SignJWT({ phone: user.phone, nom: user.nom })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      phone: String(payload.phone ?? ""),
      nom: String(payload.nom ?? ""),
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("يجب تسجيل الدخول للقيام بهذا الإجراء");
  }
  return session;
}
