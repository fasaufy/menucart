import type { HalalStatus, Language, Meal } from "./types";

// UI copy. English first; Bahasa Indonesia must cover every key.

const en = {
  tabs: { plan: "Plan", list: "List", shop: "Shop", label: "Main" },
  meals: {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
  } satisfies Record<Meal, string>,
  plan: {
    thisWeek: "This week",
    lastWeek: "Last week",
    nextWeek: "Next week",
    prevWeekLabel: "Previous week",
    nextWeekLabel: "Next week",
    progress: (planned: number, total: number) =>
      `${planned} of ${total} meals planned`,
    saved: "Saved",
    today: "Today",
    pastWeek: "Past weeks are read-only.",
    emptyPrompt: (day: string) => `What's for ${day} lunch?`,
    add: (meal: string) => `+ Add ${meal.toLowerCase()}`,
    notPlanned: "Not planned",
    repeatAllWeek: "Repeat all week",
    needsIngredients: "Ingredients needed",
    generate: (n: number) =>
      `Generate grocery list · ${n} ${n === 1 ? "dish" : "dishes"}`,
    generateEmpty: "Add a dish to make your list",
  },
  sheet: {
    addingTo: "Adding to",
    slot: (day: string, meal: string) => `${day} · ${meal}`,
    close: "Close",
    dishName: "Dish name",
    placeholder: "e.g. nasi goreng, carbonara",
    ingredients: (n: number) => `${n} ${n === 1 ? "ingredient" : "ingredients"}`,
    ownDish: "My own dish",
    recent: "Recent",
    quickPicks: "Quick picks",
    addOwn: (name: string) => `Not listed? Add “${name}” as my own dish`,
    changeDish: "Change dish",
    moveTo: "Move to",
    move: "Move",
    swapWith: (dish: string) => `swap with ${dish}`,
    clear: "Clear this meal",
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
  meals: {
    breakfast: "Sarapan",
    lunch: "Makan siang",
    dinner: "Makan malam",
  },
  plan: {
    thisWeek: "Minggu ini",
    lastWeek: "Minggu lalu",
    nextWeek: "Minggu depan",
    prevWeekLabel: "Minggu sebelumnya",
    nextWeekLabel: "Minggu berikutnya",
    progress: (planned, total) => `${planned} dari ${total} menu direncanakan`,
    saved: "Tersimpan",
    today: "Hari ini",
    pastWeek: "Minggu yang sudah lewat tidak bisa diubah.",
    emptyPrompt: (day) => `Makan siang ${day} apa?`,
    add: (meal) => `+ Tambah ${meal.toLowerCase()}`,
    notPlanned: "Belum direncanakan",
    repeatAllWeek: "Ulangi seminggu",
    needsIngredients: "Bahan belum diisi",
    generate: (n) => `Buat daftar belanja · ${n} menu`,
    generateEmpty: "Tambah menu untuk membuat daftar",
  },
  sheet: {
    addingTo: "Menambah ke",
    slot: (day, meal) => `${day} · ${meal}`,
    close: "Tutup",
    dishName: "Nama menu",
    placeholder: "mis. nasi goreng, carbonara",
    ingredients: (n) => `${n} bahan`,
    ownDish: "Menu saya",
    recent: "Terakhir",
    quickPicks: "Pilihan cepat",
    addOwn: (name) => `Tidak ada? Tambah “${name}” sebagai menu saya`,
    changeDish: "Ganti menu",
    moveTo: "Pindah ke",
    move: "Pindahkan",
    swapWith: (dish) => `tukar dengan ${dish}`,
    clear: "Kosongkan",
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

export function getStrings(language: Language = "en"): Strings {
  return dictionaries[language];
}
