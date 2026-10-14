import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AUTH_ENABLED } from "@/lib/auth-config";

// Clerk reads the session for API routes only, so every page stays static
// (and precached for offline). Without Clerk keys this is a pass-through.
export default AUTH_ENABLED ? clerkMiddleware() : () => NextResponse.next();

export const config = { matcher: ["/api/:path*"] };
