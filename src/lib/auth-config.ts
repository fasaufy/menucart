// Sign-in is optional: the app is fully usable as a guest. Clerk switches on
// when its publishable key is configured (.env.local / Vercel env).
// Plain module (not "use client") so server components can read it too.
export const AUTH_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
