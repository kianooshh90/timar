import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "tdc-timar-dental-center-secret-key-2024"
);
const COOKIE_NAME = "tdc_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "ADMIN" | "LAB" | "DESIGNER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  username?: string | null;
  labName?: string | null;
  phone?: string | null;
  city?: string | null;
  points: number;
  referralCode?: string | null;
}

/** The user fields that are safe to send to the browser (never includes the password hash). */
export function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  username?: string | null;
  labName?: string | null;
  phone?: string | null;
  city?: string | null;
  points: number;
  referralCode?: string | null;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    username: user.username ?? null,
    labName: user.labName ?? null,
    phone: user.phone ?? null,
    city: user.city ?? null,
    points: user.points,
    referralCode: user.referralCode ?? null,
  };
}

/** Designer usernames: 3-30 chars, lowercase letters, digits, dot, dash, underscore (no "@", so they never clash with e-mails). */
export function normalizeUsername(input: unknown): string | null {
  const u = String(input ?? "").trim().toLowerCase();
  return /^[a-z0-9._-]{3,30}$/.test(u) ? u : null;
}

/** Internal e-mail used for designer accounts (the User table requires a unique e-mail). */
export const DESIGNER_EMAIL_DOMAIN = "designers.tdc.local";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.sub;
    if (!userId) return null;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) return null; // disabled accounts lose access immediately
    return publicUser(user);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("UNAUTHORIZED", 401);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("UNAUTHORIZED", 401);
  if (user.role !== "ADMIN") throw new AuthError("FORBIDDEN", 403);
  return user;
}

export async function requireDesigner(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("UNAUTHORIZED", 401);
  if (user.role !== "DESIGNER") throw new AuthError("FORBIDDEN", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
