"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { CheckInbox } from "@/components/auth/CheckInbox";

export default function VerifyPage() {
  return <AuthFrame back="/sign-in">{(t) => <CheckInbox t={t} />}</AuthFrame>;
}
