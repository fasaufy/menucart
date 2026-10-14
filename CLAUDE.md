# CLAUDE.md — MenuCart

Project brief for Claude Code. Read this first, then `docs/PRD.md` for full requirements and `wireframes/` for every screen.

## What we're building

MenuCart turns a home cook's weekly menu (breakfast, lunch, dinner × Mon–Sun, up to 21 dishes) into one merged, **halal-safe** grocery list. The user types dish names; the app works out the ingredients, flags non-halal ones with a swap, merges quantities, lets the user tick what they already have, and gives a one-handed shopping mode that works offline.

Primary user: Muslim home cook in Indonesia, shopping at supermarkets and traditional markets, on Android phones, sometimes on weak or no signal.

## Decisions already made

- **Platform:** installable web app (PWA) first, mobile-first at 390×844. Later shipped to Google Play as a Trusted Web Activity. No React Native for now.
- **Hosting:** Vercel.
- **Auth:** Clerk, passwordless. One email field for both sign up and sign in. The email contains a **magic link and a 6-digit code**; support both. No passwords, no social login in MVP.
- **Guest mode:** users can use the app without an account. Guest data is device-only and uploads to the account on sign-up.
- **Local-first:** every write goes to the device first (IndexedDB), then syncs. Only sign-in, AI ingredient generation for unknown dishes, and cross-device sync need the network.
- **Language:** English UI first, Bahasa Indonesia second. Ingredient names can show the local name.

## Suggested stack (confirm with the user before installing)

- Next.js (App Router) + TypeScript + Tailwind CSS
- `@clerk/nextjs` for auth (email link + email code strategies enabled in the Clerk dashboard)
- Postgres (Neon or Supabase free tier) with Drizzle ORM for server data
- IndexedDB via Dexie for local-first storage and a sync queue
- Service worker for offline (e.g. Serwist) with an app-shell cache
- AI ingredient generation through a server route (API key stays on the server). Results are cached in a shared dish library so each dish is generated once.

Check the current docs for Clerk, Next.js and any PWA library before wiring them up; APIs change.

## Screens → routes

| Wireframe | Route | Notes |
| --- | --- | --- |
| `Welcome.html` | `/` (signed out) | Continue with email · Try without an account |
| `SignInEmail.html` | `/sign-in` | Single email field |
| `CheckInbox.html` | `/sign-in/verify` | Link + 6-digit code, resend after 60 s |
| `LinkExpired.html` | `/sign-in/expired` | Also "opened on another device" variant |
| `Onboarding.html` | `/onboarding` | Household size, halal mode, meals to plan, language |
| `GuestSample.html` | `/plan` (guest, first run) | Sample week, max 3 one-time tips |
| `Planner.html` | `/plan` | Day list, 3 slots per day, progress x/21 |
| `AddDish.html` | `/plan` + bottom sheet | Autocomplete, halal hint, recent dishes |
| `Review.html` | `/review` | Only if a non-halal ingredient exists |
| `Pantry.html` | `/pantry` | Staples pre-ticked |
| `List.html` | `/list` | Grouped by market section |
| `GuestSave.html` | `/list` + sheet | Shown to guests after first list |
| `Shopping.html` | `/shop` | Fully offline |
| `CantFind.html` | `/shop` + sheet | 1–3 halal-safe alternatives |
| `OfflinePlanner.html`, `OfflineGenerate.html`, `SessionExpired.html` | states, not routes | Offline banner, queued dishes, expired session |

## Auth & first run (as built)

- Clerk switches on only when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set (`src/lib/auth-config.ts`); without keys the app is guest-only and sign-in screens say so. See `.env.example`.
- Clerk dashboard: Email address required, **Email verification code** and **Email verification link** on for sign-up and sign-in, passwords off.
- One email field: `signIn.emailCode.sendCode`, falling back to `signUp.create` on `form_identifier_not_found` (`src/lib/signin.ts`). The code is primary; "Email me a sign-in link instead" sends a link. Clerk sends either a code or a link per email, not both in one (custom email templates need a paid plan).
- No `proxy.ts` yet: nothing reads auth on the server until sync (step 7). All routes stay static.
- First run: `/` Welcome → `/onboarding` → `/plan` (guests get a 3-dish sample week). Device flags live in the `meta` table (`onboarded`, `tipsSeen`, `signupSnooze`, `lastUser`).
- On sign-in, guest weeks get `ownerId` = the user's id; the actual upload comes with server sync.

## Data model

Source of truth is `src/lib/types.ts`; this is a summary.

```ts
type Meal = 'breakfast' | 'lunch' | 'dinner';
type HalalStatus = 'halal' | 'non_halal' | 'check';
type Section = 'produce' | 'meat_poultry' | 'seafood' | 'dairy_eggs' | 'dry_goods_spices' | 'others';

interface Settings { householdSize: number; halalMode: boolean; meals: Meal[]; language: 'en' | 'id'; }
interface Week { id: string; ownerId: string | null; startDate: string; /* Monday, ISO; id = startDate for now */ }
interface Slot { weekId: string; day: 0|1|2|3|4|5|6; meal: Meal; dishId?: string; dishName: string; isSample?: boolean; updatedAt: number; /* last edit per slot wins */ }
interface Dish { id: string; name: string; aliases: string[]; source: 'library' | 'ai' | 'user'; cuisine?: string; meals?: Meal[]; servings: number; ingredients: Ingredient[];
  customized?: boolean;            // an edited library dish, saved on device; overrides the library copy
  swaps?: Record<string, string>;  // original ingredient key → swap option id, or 'keep'
}
interface Ingredient { key: string; name: string; localName?: string; qty: number; unit: string; section: Section; halal: HalalStatus; swappedFrom?: string; }
// Halal swaps (src/lib/dishes/swaps.ts): ranked options per non-halal key. A line's qty is ratio × the original
// unless fixed; no lines = leave it out. Effective ingredients = dish.ingredients with dish.swaps applied.
interface SwapRule { forKey: string; role: string; options: { id: string; note: string; lines: { key: string; ratio?: number; qty?: number; unit?: string }[] }[]; }

interface Amount { qty: number; unit: string; }
// One line per ingredient key per week. Ingredient fields are a snapshot so the list renders offline
// without the dish library. Several amounts = incompatible units shown as sub-lines.
interface ListItem {
  weekId: string; key: string; name: string; localName?: string; section: Section; halal: HalalStatus;
  amounts: Amount[];
  uses: { dishId: string; dishName: string; count: number }[];   // count > 1 when a dish is planned twice (×2)
  state: 'to_buy' | 'at_home' | 'bought' | 'skipped';
  swappedFrom?: string;       // line comes from a halal swap for this original
  replacedBy?: string;
  noLongerNeeded?: boolean;   // bought, then its dish was removed from the plan
  updatedAt: number;
}
```

The grocery list is a saved snapshot: "Generate" merges the week's dishes (all 7 days) and reconciles with the saved list by ingredient key, so ticks survive. The list view groups it by menu (one card per planned meal) or by aisle; ticks are shared per ingredient.

Ownerless (`ownerId: null`) weeks are guest data.

## Rules that must hold

- Never block the user on the network. Offline = slim banner, never a modal.
- Never lock a user out of their list when a session expires; ask to sign in only to sync.
- Halal status is always **icon + text**, never colour alone.
- Swaps are suggestions, not rulings; show the one-time disclaimer on the first swap.
- "Check" items (cheese, gelatin, stock cubes) get a note, never an automatic swap.
- Tap targets ≥ 44 px; text respects system font size.
- Merging: same ingredient key + compatible unit → sum; incompatible units → sub-lines.
- Ticks survive list regeneration.
- At most one sign-up prompt per session for guests; "Not now" hides prompts for 3 days.

## Wireframe tokens (low-fi; final visuals come from the creative director)

```css
--bg: #F5F5F3; --surface: #FFFFFF; --border: #D6D6D2; --border-strong: #BDBDB8;
--text: #1C1C1C; --text-muted: #5E5E5A; --fill-muted: #E6E6E2;
--halal-flag-bg: #FBEBD9; --halal-flag-text: #8A4300;
--radius-card: 12px; --radius-row: 10px; --button-height: 52px;
font-family: 'Work Sans', system-ui, sans-serif;
```

Build components against tokens so the visual design can be swapped in later without touching layout code.

## Suggested build order

1. Project setup, tokens, app shell, bottom tab bar (Plan / List / Shop).
2. Local data layer (Dexie) + planner with breakfast/lunch/dinner slots, using a hard-coded dish library of ~20 dishes. No auth yet.
3. Ingredient merge + grocery list + pantry check + shopping mode, all from local data.
4. Halal tags, swap table and the review screen.
5. Offline: service worker, offline banner, queued generation.
6. Clerk auth (magic link + code), guest mode, guest-to-account upload.
7. Server sync (Postgres) and AI generation for unknown dishes with a shared cache.
8. PWA install, then Trusted Web Activity for Google Play.

Ask before adding dependencies beyond this list, and keep each step shippable.
