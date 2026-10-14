"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { CodeExpired } from "@/components/auth/CodeExpired";

export default function ExpiredPage() {
  return <AuthFrame back="/sign-in">{(t) => <CodeExpired t={t} />}</AuthFrame>;
}
