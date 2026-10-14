"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { SignInEmail } from "@/components/auth/SignInEmail";

export default function SignInPage() {
  return <AuthFrame back="/">{(t) => <SignInEmail t={t} />}</AuthFrame>;
}
