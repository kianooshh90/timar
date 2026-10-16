import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(e: unknown) {
  if (e instanceof AuthError) {
    return jsonError(e.message, e.status);
  }
  // Details go to the server log only; never expose database/internal messages to the browser.
  console.error("[API]", e);
  return jsonError("SERVER_ERROR", 500);
}

export function formatToman(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}
