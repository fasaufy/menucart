"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { clearLocalData, db, getMeta } from "./db";

// One email field for both sign-up and sign-in (PRD): try sign-in first and
// fall back to sign-up when Clerk doesn't know the address. Clerk keeps the
// attempt on its client, so the verify screen can pick it up after navigating.

export type Pending = { email: string; mode: "signIn" | "signUp"; sentAt: number };

const KEY = "menucart:signin";

export function readPending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

function writePending(p: Pending | null) {
  try {
    if (p) sessionStorage.setItem(KEY, JSON.stringify(p));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Without sessionStorage the verify screen asks for the email again.
  }
}

/** Email typed into the guest "Save my list" sheet, carried to the sign-in screen. */
export function stashEmail(email: string) {
  try {
    sessionStorage.setItem(`${KEY}:prefill`, email);
  } catch {}
}

export function takeStashedEmail(): string {
  try {
    const email = sessionStorage.getItem(`${KEY}:prefill`) ?? "";
    sessionStorage.removeItem(`${KEY}:prefill`);
    return email;
  } catch {
    return "";
  }
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

type ClerkErrorLike = { code?: string; errors?: { code?: string }[] } | null | undefined;

function errorCode(error: ClerkErrorLike): string | undefined {
  return error?.errors?.[0]?.code ?? error?.code;
}

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: "wrong_code" | "expired" | "error"; message?: string };

function fail(error: ClerkErrorLike & { message?: string }): AuthResult {
  const code = errorCode(error);
  if (code === "form_code_incorrect") return { ok: false, reason: "wrong_code" };
  if (code === "verification_expired" || code === "verification_failed") return { ok: false, reason: "expired" };
  return { ok: false, reason: "error", message: error?.message };
}

/**
 * After sign-in: this device's guest weeks now belong to the account, and we
 * remember the account so an expired session reads as "sign in again", not
 * "guest". Sync then uploads the guest's plans into the account.
 */
async function claimDevice(userId: string, email: string) {
  // Another account's data is on this phone (they signed out but kept it):
  // don't upload it into this account. It's safe on their account already.
  const previous = await getMeta("lastUser");
  if (previous && previous.userId !== userId) await clearLocalData();
  await db.transaction("rw", db.weeks, db.meta, async () => {
    await db.weeks.filter((w) => w.ownerId === null).modify({ ownerId: userId });
    await db.meta.put({ id: "lastUser", userId, email });
  });
}

/** `navigate` is the app router's push, used once the session is active. */
export function useEmailAuth(navigate: (url: string) => void) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  async function send(email: string): Promise<AuthResult> {
    const emailAddress = email.trim().toLowerCase();
    const attempt = await signIn.emailCode.sendCode({ emailAddress });
    if (!attempt.error) {
      writePending({ email: emailAddress, mode: "signIn", sentAt: Date.now() });
      return { ok: true };
    }
    if (errorCode(attempt.error) !== "form_identifier_not_found") return fail(attempt.error);

    // New email: create the account instead.
    const created = await signUp.create({ emailAddress });
    if (created.error) return fail(created.error);
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) return fail(sent.error);
    writePending({ email: emailAddress, mode: "signUp", sentAt: Date.now() });
    return { ok: true };
  }

  async function resend(pending: Pending): Promise<AuthResult> {
    return send(pending.email);
  }

  /** Verifies the code, activates the session and navigates on. */
  async function verifyCode(pending: Pending, code: string): Promise<AuthResult> {
    const flow = pending.mode === "signIn" ? signIn : signUp;
    const result =
      pending.mode === "signIn"
        ? await signIn.emailCode.verifyCode({ code })
        : await signUp.verifications.verifyEmailCode({ code });
    if (result.error) return fail(result.error);
    if (flow.status !== "complete") return { ok: false, reason: "error" };
    return finish(pending);
  }

  /** Sends an email link instead of a code and waits until it's opened. */
  async function sendLinkAndWait(pending: Pending): Promise<AuthResult> {
    const verificationUrl = `${window.location.origin}/sign-in/link`;
    if (pending.mode === "signIn") {
      const sent = await signIn.emailLink.sendLink({ emailAddress: pending.email, verificationUrl });
      if (sent.error) return fail(sent.error);
      const waited = await signIn.emailLink.waitForVerification();
      if (waited.error) return fail(waited.error);
      if (signIn.status !== "complete") return { ok: false, reason: "expired" };
    } else {
      const sent = await signUp.verifications.sendEmailLink({ verificationUrl });
      if (sent.error) return fail(sent.error);
      const waited = await signUp.verifications.waitForEmailLinkVerification();
      if (waited.error) return fail(waited.error);
      if (signUp.status !== "complete") return { ok: false, reason: "expired" };
    }
    return finish(pending);
  }

  async function finish(pending: Pending): Promise<AuthResult> {
    const flow = pending.mode === "signIn" ? signIn : signUp;
    // New accounts set up their kitchen unless this device already did as a guest.
    const onboarded = await getMeta("onboarded");
    const next = pending.mode === "signUp" && !onboarded ? "/onboarding" : "/plan";
    const done = await flow.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.user) await claimDevice(session.user.id, pending.email);
        writePending(null);
        // decorateUrl keeps Safari's cookie refresh working; it may return a full URL.
        const url = decorateUrl(next);
        if (url.startsWith("http")) window.location.href = url;
        else navigate(url);
      },
    });
    return done.error ? fail(done.error) : { ok: true };
  }

  return { send, resend, verifyCode, sendLinkAndWait };
}
