import type { HalalStatus, Language } from "./types";

// UI copy. English first; Bahasa Indonesia must cover every key.

const en = {
  tabs: { plan: "Plan", list: "List", shop: "Shop", label: "Main" },
  plan: {
    title: "This week",
    progress: (planned: number, total: number) =>
      `${planned} of ${total} meals planned`,
    emptyPrompt: "What's for Monday lunch?",
    emptyHint: "Tap a meal to add a dish. You can leave slots empty.",
  },
  list: {
    title: "Grocery list",
    emptyTitle: "No list yet",
    emptyHint: "Plan a few dishes, then generate your list.",
  },
  shop: {
    title: "Shopping",
    emptyTitle: "Nothing to shop yet",
    emptyHint: "Your list shows up here, and works without signal.",
  },
  halal: {
    halal: "Halal",
    non_halal: "Non-halal",
    check: "Check",
  } satisfies Record<HalalStatus, string>,
};

export type Strings = typeof en;

const id: Strings = {
  tabs: { plan: "Rencana", list: "Daftar", shop: "Belanja", label: "Utama" },
  plan: {
    title: "Minggu ini",
    progress: (planned, total) => `${planned} dari ${total} menu direncanakan`,
    emptyPrompt: "Makan siang Senin apa?",
    emptyHint: "Ketuk waktu makan untuk menambah menu. Boleh dikosongkan.",
  },
  list: {
    title: "Daftar belanja",
    emptyTitle: "Belum ada daftar",
    emptyHint: "Rencanakan beberapa menu, lalu buat daftarnya.",
  },
  shop: {
    title: "Belanja",
    emptyTitle: "Belum ada yang dibeli",
    emptyHint: "Daftarmu muncul di sini, dan tetap bisa dipakai tanpa sinyal.",
  },
  halal: {
    halal: "Halal",
    non_halal: "Tidak halal",
    check: "Cek",
  },
};

const dictionaries: Record<Language, Strings> = { en, id };

// Language comes from Settings once the local data layer exists (step 2).
export function getStrings(language: Language = "en"): Strings {
  return dictionaries[language];
}
