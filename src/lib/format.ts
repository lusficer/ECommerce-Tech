// Shared formatting helpers

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrency(amount: number): string {
  return USD_FORMATTER.format(amount);
}

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

// Some APIs return multiple image URLs separated by '|'; the UI needs a single safe URL.
export function getFirstImage(
  imageUrl: string | null | undefined,
  placeholder = 'https://placehold.co/400x400?text=No+Image'
): string {
  if (!imageUrl) return placeholder;
  const first = imageUrl.split('|')[0].trim();
  return first || placeholder;
}

export function getSalePrice(price: number, discountPercentage: number): number {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return price * (1 - discountPercentage / 100);
}

// Cart items can come back already discounted; this reconstructs the strikethrough price.
export function getOriginalPrice(
  discountedPrice: number,
  discountPercentage: number
): number {
  if (!discountPercentage || discountPercentage <= 0) return discountedPrice;
  return discountedPrice / (1 - discountPercentage / 100);
}

