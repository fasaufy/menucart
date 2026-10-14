import { auth } from "@clerk/nextjs/server";
import { AUTH_ENABLED } from "@/lib/auth-config";

/** The signed-in Clerk user id for this request, or null (guest / sign-in not configured). */
export async function currentUserId(): Promise<string | null> {
  if (!AUTH_ENABLED) return null;
  const { userId } = await auth();
  return userId;
}
