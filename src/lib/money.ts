// Rupiah, one format everywhere: "Rp142.500" (never IDR), Indonesian grouping,
// no space. Estimates get "≈Rp6.000". Shortcuts like "150rb" are for chips only.

const grouping = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "142.500": the number alone, for displays that style the "Rp" prefix separately. */
export function rupiahNumber(amount: number): string {
  return grouping.format(Math.abs(Math.round(amount)));
}

/** "Rp142.500", "≈Rp6.000", "-Rp13.000". */
export function formatRupiah(amount: number, { estimated = false } = {}): string {
  const sign = Math.round(amount) < 0 ? "-" : "";
  return `${sign}${estimated ? "≈" : ""}Rp${rupiahNumber(amount)}`;
}

/** "150rb" for whole thousands; anything else falls back to the full number. */
export function formatRb(amount: number): string {
  const rounded = Math.round(amount);
  return rounded % 1000 === 0 ? `${rounded / 1000}rb` : rupiahNumber(rounded);
}

/** Digits typed into an amount field ("Rp 200.000", "200000") → 200000; nothing typed → 0. */
export function parseRupiah(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
