"use client";

import { useUser } from "@clerk/nextjs";
import { AUTH_ENABLED } from "./auth-config";

export { AUTH_ENABLED };

export type Account =
  | { loaded: false }
  | { loaded: true; signedIn: false }
  | { loaded: true; signedIn: true; userId: string; email: string | undefined };

function useClerkAccount(): Account {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return { loaded: false };
  if (!isSignedIn) return { loaded: true, signedIn: false };
  return { loaded: true, signedIn: true, userId: user.id, email: user.primaryEmailAddress?.emailAddress };
}

function useGuestAccount(): Account {
  return { loaded: true, signedIn: false };
}

/** The current account, or guest. Chosen once at build time, so hook order never changes. */
export const useAccount: () => Account = AUTH_ENABLED ? useClerkAccount : useGuestAccount;
