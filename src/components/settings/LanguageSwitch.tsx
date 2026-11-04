import type { Language } from "@/lib/types";

const LANGUAGES: { id: Language; short: string; name: string }[] = [
  { id: "en", short: "EN", name: "English" },
  { id: "id", short: "ID", name: "Bahasa Indonesia" },
];

/** Compact EN / ID switch next to the title, in onboarding (P1, P2) and Settings. */
export function LanguageSwitch({ value, label, onChange }: { value: Language; label: string; onChange: (language: Language) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-card bg-fill-muted p-1">
      {LANGUAGES.map((l) => {
        const active = l.id === value;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={l.name}
            lang={l.id}
            onClick={() => onChange(l.id)}
            // 32px pill on a 40px track; the 44px tap target comes from the padding around it.
            className={`relative h-8 w-16 rounded-xl text-xs font-semibold after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] ${
              active ? "bg-surface text-text-strong shadow-button" : "text-text-quiet"
            }`}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
