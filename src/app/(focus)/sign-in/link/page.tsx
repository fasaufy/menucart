"use client";

import { AuthFrame } from "@/components/auth/AuthFrame";
import { LinkLanding } from "@/components/auth/LinkLanding";

export default function LinkPage() {
  return <AuthFrame back="/plan">{(t) => <LinkLanding t={t} />}</AuthFrame>;
}
