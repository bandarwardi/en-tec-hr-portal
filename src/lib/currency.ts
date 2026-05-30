export const CURRENCY_LABEL = "ج.م";

export function formatEGP(n: number | undefined | null): string {
  const v = Number(n || 0);
  return v.toLocaleString("ar-EG", { maximumFractionDigits: 2 }) + " " + CURRENCY_LABEL;
}
