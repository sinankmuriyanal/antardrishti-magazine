"use client";
import { auth } from "@/lib/firebase";

/**
 * Fetch wrapper that attaches the current user's Firebase ID token as
 * `Authorization: Bearer ...`. All admin client code should use this for
 * write operations against /api/* routes.
 */
export async function authedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = new Headers(init?.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
