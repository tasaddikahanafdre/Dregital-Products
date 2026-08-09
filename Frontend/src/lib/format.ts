export const TAKA = '৳';

/** Format a number as BDT, e.g. 1290 → ৳1,290. */
export function formatBDT(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return `${TAKA}0`;
  return `${TAKA}${n.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

/** Percentage off vs. the original price, e.g. "25% OFF". Returns null when no discount. */
export function discountPercent(price: number, originalPrice: number | null | undefined): number | null {
  const original = Number(originalPrice);
  if (!original || original <= 0 || original <= Number(price)) return null;
  return Math.round(((original - Number(price)) / original) * 100);
}

/** Human friendly date/time, e.g. "6 Aug, 2:45 PM". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
