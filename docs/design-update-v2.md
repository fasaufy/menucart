# MenuCart v2 — Design update brief (budget-first)

For: the Claude Code agent working in this repo.
Source of truth: Figma file **Daybük**, section **“MenuCart — as built (v2)”**
https://www.figma.com/design/00Ki7M7ca1cxfHl3uz45K8/Dayb%C3%BCk?node-id=679-404

Read this whole file before planning. Keep the current visual style (it already matches the Figma polish from commit `16480ef`). Ask before adding dependencies. Ship in small, reviewable steps.

---

## 1. The concept shift

**Before:** a grocery checklist that suggests ingredients for the dishes you pick.
**Now:** a **budget-capped weekly planner** that speaks **pasar units**, orders cooking by **freshness**, and hands a clear list to **whoever shops**.

Why (from user research): young Indonesian couples plan the week backwards from a fixed weekly *uang belanja* (often Rp150rb–250rb for two), buy loose items by rupiah amount (“cabai Rp5.000”) rather than grams, get hit by mid-week price jumps (chilli, shallots), and often delegate shopping (“titip belanja”) over WhatsApp.

Rules that follow from this:
- The **weekly budget** is fixed. **To buy** = estimated cost of everything still needed. **Left** = budget − to buy.
- **Ticked in the pantry check = already at home** → not bought, not counted.
- Halal swaps stay, and halal still leads next to budget in messaging.

---

## 2. Screens on the board (Figma node IDs)

If the Figma MCP is available, pull design context by node ID. Captions on the board explain the trigger for each screen.

| ID | Screen | Node | Status in repo |
| --- | --- | --- | --- |
| P1 | Onboarding · set up kitchen | `700:3432` | Exists (`OnboardingScreen`); keep |
| P2 | Onboarding · city and budget | `702:926` | **New**: city row + weekly budget field |
| P3 | Choose your city (sheet) | `700:3911` | **New** |
| P4 | Planner · budget-capped | `700:3491` | **Update** `planner/*` |
| L1 | Pantry check | `697:983` | **Update** `list/PantryScreen.tsx` |
| L2 | List · By menu | `691:656` | **Update** `list/MenuCards.tsx`, `ListScreen.tsx` |
| L3 | List · By aisle | `695:2608` | **Update** `ListScreen.tsx` |
| L5 | Price jumped (sheet) | `700:5274` | **New** (reuse swap patterns from `dishes/swaps.ts`) |
| L6 | Plan changed · over budget | `700:5850` | **New state** of the list |
| L7 | Send titip belanja (sheet) | `691:906` | **Update** `list/share.ts` + new sheet |
| P5 | List · price sources | `709:8625` | **New**: source header + legend |
| P6 | Edit a price (sheet) | `700:4492` | **New** |
| P7 | Edge cases | `700:5054` | **New states** |
| E1 | Nothing to buy | `711:727` | **New state** |
| E2 | Check this price | `711:813` | **New state** of P6 |
| E3 | Budget looks low | `711:1041` | **New state** of P2 |

There is also an **edge-case checklist panel** on the board (“Edge cases · checklist”); it's summarised in section 7.

---

## 3. What's new, feature by feature

### 3.1 Weekly budget (P2, P4, E3)
- Onboarding step 2: **free-entry amount field** (`Rp` prefix, any number) + shortcut chips **150rb / 200rb / 250rb / 300rb**. Chips fill the field; they don't limit it. Hint: “Common for two people: Rp150rb–250rb a week.”
- Subtitle: “Only what you'll buy this week. Things already at home don't count.”
- **No separate monthly staples budget** (removed on purpose). Staples are handled by the pantry check.
- E3: if budget < Rp100rb for 2 people, show a gentle warning under the field (`halal-flag-text` colour). Never block.
- Add `weeklyBudget: number` (rupiah, integer) to `Settings` in `src/lib/types.ts`; editable in Settings.

### 3.2 City / location (P2, P3, P7)
- P2 shows a city row above the budget: “You shop in · Kota Salatiga, Jawa Tengah · Change”.
- P3 city picker: search by kota/kabupaten; kecamatan maps to its kota (“Uses Kota Salatiga”). Fallbacks: “Use my location” (GPS, optional) and “Use Jawa Tengah average”.
- Store **city only** (never exact coordinates). Add `city: { id, name, province }` to `Settings`.

### 3.3 Prices (P4, L1–L3, P5–P7)
Each list item gets an estimated price from one of three sources:
1. **Market price**: official government market survey for that city (SP2KP Kemendag first; SiHaTi for Jawa Tengah and PIHPS Bank Indonesia as cross-checks). **Not integrated yet**: permission is pending.
2. **MenuCart estimate**: a per-province price table we maintain. Shown with **“≈”**.
3. **User price**: what the user paid (P6). Overrides the estimate for that user's week only.

Build a pluggable `PriceSource` interface now, with a seed estimate table (Jawa Tengah first, ~30 common items) and room to add official sources later. Prices are fetched server-side and cached; the app must work offline with the last saved prices.

UI:
- List header card: “Prices from markets in Kota Salatiga”, “Updated Mon 26 Oct” badge, and a one-line legend: *Market price = government market survey · ≈ = MenuCart estimate for Jawa Tengah.*
- Item details show the **specific source**, e.g. “Source: SP2KP, Ministry of Trade · Kota Salatiga, 26 Oct” or “≈Rp6.000 · MenuCart estimate for Jawa Tengah”.

### 3.4 Money shown everywhere
- Planner (P4): budget meter “Rp142.500 / Rp200.000 · Rp57.500 left”, a cost line per dish (“≈Rp9.000 · 2 portions”), Generate button “Generate list · Rp142.500”.
- Pantry (L1): money summary card above the button: “To buy Rp142.500 / Rp200.000 · Rp57.500 left”, plus “Garlic and ginger at home saved Rp7.000”. Ticked items show “At home”; unticked show amount + price. Button: “Show my list · Rp142.500”.
- List (L2/L3): subtitle “Rp142.500 of Rp200.000 · 20 to buy · 3 at home”; same budget card; subtotal per group; estimated cost per meal card in By menu (“Tuesday · ≈Rp26.000”).

### 3.5 Pasar units + merging (L3)
- Every list line uses the **Item row** (spec in section 4.1): checkbox, name, detail line, and a right-hand side that is either the price alone, the **price with a unit pill** under it (“Rp7.000” / “2 ikat”), an **“Add price”** link, or the amount when the item is **at home**.
- The rows inside By menu cards still show the older single-line format (“1/2 ekor · Rp19.000”). Migrate them to the Item row too, so both views use one row.
- Loose items (cabai, bawang, greens) can be shown in rupiah amounts (“cabai Rp5.000”); grams go in the detail line.
- **Merge rule (By aisle):** one line per ingredient across all dishes in the week: sum amounts, **round up to the nearest sellable unit**, and show which dishes use it, e.g. *Kol · 1/2 kg · Rp5.000 — “400 g needed: Capcay 200 g + Tahu tek 200 g”*. By menu still lists the ingredient under each dish. Extend `src/lib/list/merge.ts` and `units.ts`; add tests next to the existing ones.

### 3.6 Price jumped (L5)
When an item's price rises sharply, flag it in the list (detail line in `halal-flag-text`: “up 23% this week”). Tapping opens a sheet: warning badge “Price jumped this week”, title “Cabai rawit is up 23%”, 2–3 swap options with price and saving (“Cabai kering · Rp3.000 · Save Rp2.000”), source line, primary “Use cabai kering · Rp140.500”, secondary “Not now”.

### 3.7 Plan changed · over budget (L6)
After a plan edit, the list updates in place and keeps ticks. Banner: “Plan changed · Rendang added · Thursday dinner · 2 items added. Your ticks are kept.” New items tagged **New**. If over budget: total turns `halal-flag-text`, label “Rp13.000 over”, note “Over budget · 2 cheaper swaps for this week”.

### 3.8 Edit a price (P6) and price check (E2)
Sheet: item name, “What did you pay?” field (Rp), estimate it replaces, effect on total (“Total becomes Rp143.500”), share line (“Anonymously improves prices for Kota Salatiga”), “Reset to estimate”, “Save price”, footnote “Prices differ between stalls; that's normal.”
E2: if the entered price is **> 3× or < ⅓ of the estimate**, show the warning badge “Much higher than usual”, “Rp70.000 is about 12× the estimate. Did you mean Rp7.000?”, buttons “Fix the price” / “Yes, Rp70.000 is right”. Not shared until confirmed.

### 3.9 Send titip belanja (L7)
- **Entry point:** footer button “Send to whoever shops” on **both** By menu and By aisle; the header share icon opens the same sheet.
- Sheet: WhatsApp message preview (grouped by stall, Indonesian), switch “Show rupiah for loose items”, switch “Add ‘Dibuat pakai MenuCart’” (**off by default**), “Send via WhatsApp”, “Copy text”.
- Message format (update `src/lib/list/share.ts`):
  ```
  🛒 Titip belanja · Selasa 13 Okt
  Estimasi: Rp142.500 (budget Rp200.000)

  🥬 Pasar · sayur & bumbu
  • Cabai rawit Rp5.000
  • Bawang merah 1/4 kg
  • Bayam 2 ikat
  • Kol 1/2 kg

  🍗 Ayam & telur
  • Ayam 1 ekor, potong 12, dada tanpa tulang
  • Telur 1/2 kg (promo Superindo)
  ```
  Cut/handling notes come from the item; the footer line only appears when the switch is on.

### 3.10 Empty list (E1)
When everything is ticked at home: subtitle “Rp0 of Rp200.000 · everything is at home”, card “Nothing to buy this week / Everything is already at home”, button “Back to the plan”.

---

## 4. Components (Figma → code)

Reuse existing components where they already exist in `src/components/ui`; only add what's missing.

| Figma component | Use | Code |
| --- | --- | --- |
| Button (Primary / Secondary) | All CTAs | `ui/Button.tsx` |
| Halal badge | Halal flags **and** warning badges (“Price jumped this week”, “Much higher than usual”, “New”) | Existing badge; add `tone` if needed |
| Tab bar (plan / list / shop) | Bottom navigation | `TabBar.tsx` |
| Segmented (By menu · By aisle) | List view switch | `ui/Segmented.tsx` |
| Item row | Every list line (pantry, By menu, By aisle, shopping) | **One** `ItemRow` component, spec in 4.1. Replaces the old Pasar item |
| Swap tag | Swap options/savings | Reuse swap UI |
| Chip | Budget shortcuts | Existing chip |
| Message bubble | WhatsApp preview in L7 | **New** small component |
| Sheet (pattern) | L5, L6, P3, P6, E2, L7 | Build as a reusable bottom-sheet component, not part of the page |

Note: in Figma the main components for Button and Halal badge are being restored; treat their instances as those components. **Pasar item is obsolete**: ignore any layer still named that and use the Item row.

### 4.1 Item row (replaces Pasar item)

Figma reference: “Item row · Cabai rawit”, node `700:5103` (on the P7 edge-cases screen, which shows every variant). In Figma it is currently a frame pattern, not yet a component; build it as one component in code.

Layout
- Horizontal, items vertically centred, gap **12**, no padding; fills the card width (314 in a 350 card).
- Height **54** with a detail line, **44** without.

Parts
1. **Checkbox**: 22 × 22, radius 6. Unchecked: border `checkbox-border`. Checked: fill `primary` with a white check.
2. **Text stack** (fills the remaining width): name in Funnel Sans Medium 15 (`text`); optional detail line in Funnel Sans Regular 12 (`text-muted`). Detail turns `halal-flag-text` for warnings (e.g. “± 50 g · up 23% this week”).
3. **Right side** (hugs content), one of:

| Variant | Shows | Example | When |
| --- | --- | --- | --- |
| `price` | Price, Funnel Sans SemiBold 14 | “Rp5.000” | Loose items bought by rupiah amount |
| `priceUnit` | Price over a small unit pill (“Price Details”, vertical) | “Rp7.000” / “2 ikat” | Items bought by a sellable unit |
| `addPrice` | “Add price” link in `primary` | “Add price” | No price known yet; opens Edit a price (P6) |
| `atHome` | Amount only, checkbox checked, detail “At home” | “4 siung” | Ticked in the pantry check; not counted in the total |

Props for the code component: `name`, `detail?`, `detailTone?: 'default' | 'warning'`, `right: 'price' | 'priceUnit' | 'addPrice' | 'atHome'`, `price?`, `unit?`, `checked`, `estimated?` (prefix the price with “≈”). Tapping the row opens item details; tapping the checkbox toggles bought / at home.

---

## 5. Design tokens

Colours on the v2 screens are bound to `mc/color/*` variables. Ten were **added** in this update. Map each to an existing CSS variable in `src/app/globals.css` if one already matches; only add new variables for real gaps.

| Figma token | Hex | Used for |
| --- | --- | --- |
| `mc/color/primary` | `#0A68DC` | Primary actions, checked boxes, focus |
| `mc/color/primary-border` | `#207DEF` | Primary button border |
| `mc/color/accent` | `#FF3300` | Day strip, meal tags |
| `mc/color/text-active` | `#15253A` | Active tab label/icons |
| `mc/color/text-inactive` | `#6E6E6E` | Inactive tab/switch labels |
| `mc/color/ink-blue` | `#1F3A5B` | Labels on tinted cards |
| `mc/color/checkbox-border` | `#CCC4B8` | Unchecked checkbox |
| `mc/color/border-subtle` | `#F2F2EE` | Secondary button border |
| `mc/color/tint-red` | `#FFECE7` | Light red tint behind cards |
| `mc/color/meal-breakfast` | `#FCE386` | Breakfast tag |

Existing tokens used for warnings: `halal-flag-bg` / `halal-flag-text`.
Still unbound in Figma (hard-code as named constants for now): group background `#EDEDE3` at 60%, tab track `#211F1D` at 4%, overlay `#000000` at 6%.

**Currency format:** always **Rp** (never IDR), Indonesian grouping, no space: `Rp142.500`. Estimates: `≈Rp6.000` (no space). The large total in budget cards shows a smaller `Rp` prefix next to the number; that's a display style, not a different format. Shortcut chips use `150rb`. Add one formatter (e.g. `formatRupiah`) in `src/components/list/format.ts` and use it everywhere.

---

## 6. What was fixed in Figma in this pass (so code matches)

- **IDR → Rp** on every screen; `≈ Rp` → `≈Rp`.
- List subtitles corrected: normal state “Rp142.500 of Rp200.000 · 20 to buy · 3 at home”; over budget “Rp213.000 of Rp200.000 · 22 to buy · 3 at home”; “1 item has no price” only on the edge-case screen.
- Prices made to add up: vegetables group Rp26.000 (cabai 5.000, bawang merah 10.000, bayam 6.000, kol 5.000 · 1/2 kg); breakfast card ≈Rp26.000 (bread 12.000, butter 6.000 · 1 sachet, cheese 8.000 · 4 lembar); tauge “1 bungkus”. Estimates on the price-sources screen carry “≈”; the user-entered bayam on P7 is Rp7.000 (total Rp143.500).
- Copy: “You shop in” (was “You market in”); budget hint reworded; price field example Rp7.000.
- WhatsApp message corrected to the format in 3.9 (“Estimasi”, cabai rawit, kol).
- Captions renumbered L1–L7, P1–P7; the edge states E1–E3 were added.
- Structure: colours bound to tokens (364), 10 new tokens, ~190 layers renamed (Row / Stack / Item row / Text stack), fixed-size text boxes set to grow.

---

## 7. Edge cases to handle (acceptance criteria)

Location and data
- City without official data → nearest covered city or province average, and say which (“Kab. Boyolali · using Jawa Tengah average”).
- Kecamatan/kelurahan → map to kota/kabupaten. GPS denied → search still works.
- Store city only.

Price data
- No update today → keep the last price, show its date.
- Source down or format changed → keep last good data, never show blanks; log/alert.
- Official prices are per kg; keep a per-item conversion table to pasar units.
- Item with no price → “Add price”; total marked ≈ and subtitle says “1 item has no price”.
- Offline → last saved prices, badge “Offline · 23 Oct”.

User prices
- Price check at > 3× or < ⅓ of estimate (E2).
- A user's price changes only their own week; shared prices are anonymous and averaged.
- “Reset to estimate” always available.

Budget and timing
- Mid-week price refresh pushes total over budget → L6 banner with swaps.
- Items already ticked as bought keep the price at the time they were bought.
- Everything at home → E1. Budget under Rp100rb for two → E3 note.

---

## 8. Not decided / out of scope for now

- Official price integration (SP2KP / SiHaTi / PIHPS) waits for data-owner permission. Build the `PriceSource` interface and seed estimates first.
- Backend for anonymous shared prices: design the data shape, ship later.
- Sharing switch default for prices: currently **on** in the design (anonymous). Confirm before release.

---

## 9. Suggested build order

1. `formatRupiah` + replace all money formatting; `weeklyBudget` and `city` in `Settings` (+ Settings UI).
2. Onboarding P2 (city row + budget field + chips + E3) and P3 city picker with fallbacks.
3. `PriceSource` interface, seed estimate table (Jawa Tengah), price per list item, totals (to buy / left), with tests.
4. Pantry money summary (L1), budget card + subtitles in List (L2/L3), planner meter and dish costs (P4).
5. `ItemRow` component (section 4.1) used in every list, including By menu cards; then merge-by-name with rounding to sellable units and the “used in” detail (L3).
6. Bottom-sheet component; Edit price (P6) + price check (E2); price sources header and legend (P5).
7. Price jumped sheet (L5), plan changed / over budget (L6), empty list (E1), offline and missing-price states (P7).
8. Titip belanja sheet and message format (L7); “Send to whoever shops” in both list views.
