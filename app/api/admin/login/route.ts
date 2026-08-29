import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  createSessionToken,
  getAdminEmail,
  getAdminPasswordHash,
  normalizeEmail,
  verifyPasswordHash,
} from "@/lib/auth";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 8;

const lastAttempts = new Map<string, { count: number; resetAt: number }>();

function isAllowedAttempt(ip: string): boolean {
  const now = Date.now();
  const current = lastAttempts.get(ip);

  if (!current || current.resetAt < now) {
    lastAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
    const ip = forwardedFor.split(",")[0]?.trim() || "local";

    if (!isAllowedAttempt(ip)) {
      return NextResponse.json({ error: "Demasiados intentos. Intenta más tarde." }, { status: 429 });
    }

    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    const validEmail = getAdminEmail();
    const storedHash = getAdminPasswordHash();

    if (!validEmail || !storedHash) {
      return NextResponse.json({ error: "Autenticación no configurada." }, { status: 500 });
    }

    if (!email || !password || !email.includes("@") || email !== validEmail) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    const isValidPassword = verifyPasswordHash(password, storedHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    }

    const cookieValue = createSessionToken(email);
    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" }, { status: 200 });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: cookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error("[admin-login] Error inesperado", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
