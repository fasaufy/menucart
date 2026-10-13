# MenuCart — design handoff

Everything needed to start building MenuCart with Claude Code in VS Code.

```
menucart-handoff/
├── CLAUDE.md            ← Claude Code reads this automatically: decisions, stack, data model, rules, build order
├── README.md            ← you are here
├── docs/
│   └── PRD.md           ← full product requirements (export of the Claude Doc)
└── wireframes/
    ├── index.html       ← open this in a browser: every screen, grouped by flow
    └── *.html           ← 17 standalone 390×844 screens; buttons link along the flow
```

## How to start in VS Code

1. Unzip this folder and open it in VS Code. Keep it as the root of your new repo so `CLAUDE.md` sits at the top level.
2. Open Claude Code (the VS Code extension or `claude` in the terminal).
3. Paste a first prompt like:

   > Read CLAUDE.md and docs/PRD.md, then look at wireframes/Planner.html. Propose the project setup for step 1 of the build order and wait for my OK before installing anything.

4. Work through the build order in CLAUDE.md one step at a time. For each screen, point Claude Code at its wireframe file, e.g. "Build /list to match wireframes/List.html".

## Flows in the wireframes

- **Flow 0 · Sign up / sign in + guest mode:** Welcome → Enter email → Check inbox → (Link expired) · Guest sample week → Save your list
- **Flow 1 · Plan the week → generate:** Onboarding → Weekly planner → Add a dish → Review halal swaps
- **Flow 2 · Check pantry → shop:** Pantry check → Grocery list → Shopping mode → Can't find it
- **Offline & edge states:** Planner offline → Partial list with queued dish → Session expired, list still works

## Still open (from the PRD)

- Halal mode always on, or a toggle for non-Muslim cooks?
- Day list (current wireframes) or compact 7×3 grid?
- One dish per slot, or several (rice + sayur + lauk)?
- Pantry check as its own step, or inline ticks on the list?
- Swap tone: "Halal swap" or "Make it halal"?

Visual design is still to come; the wireframes are grayscale on purpose.
