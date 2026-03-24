// ===== src/lib/format.ts =====
// Shared formatting helpers used across the application

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Formats a number as USD currency string.
 * e.g. 1234.5 → "$1,234.50"
 */
export function formatCurrency(amount: number): string {
  return USD_FORMATTER.format(amount);
}

/**
 * Formats an ISO date string into a human-readable date.
 * e.g. "2024-03-15T10:30:00" → "Mar 15, 2024"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats an ISO date string with time.
 * e.g. "2024-03-15T10:30:00" → "Mar 15, 2024, 10:30 AM"
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Extracts the first image URL from a pipe-separated string.
 * Falls back to a placeholder image.
 * e.g. "https://img1.jpg|https://img2.jpg" → "https://img1.jpg"
 */
export function getFirstImage(
  imageUrl: string | null | undefined,
  placeholder = 'https://placehold.co/400x400?text=No+Image'
): string {
  if (!imageUrl) return placeholder;
  const first = imageUrl.split('|')[0].trim();
  return first || placeholder;
}

/**
 * Calculates the sale price after applying a discount percentage.
 */
export function getSalePrice(price: number, discountPercentage: number): number {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return price * (1 - discountPercentage / 100);
}

/**
 * Calculates the original price from a discounted price.
 * Used in cart where unitPrice is already discounted.
 */
export function getOriginalPrice(
  discountedPrice: number,
  discountPercentage: number
): number {
  if (!discountPercentage || discountPercentage <= 0) return discountedPrice;
  return discountedPrice / (1 - discountPercentage / 100);
}
