const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

type RelativeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
  now: Date = new Date()
): string {
  const date = toDate(value);
  if (!date) return 'N/A';

  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = diffMs / 1000;

  if (Math.abs(diffSeconds) < 10) return 'just now';

  const absSeconds = Math.abs(diffSeconds);

  const pick = (): { unit: RelativeUnit; value: number } => {
    if (absSeconds < 60) return { unit: 'second', value: Math.round(diffSeconds) };
    const diffMinutes = diffSeconds / 60;
    if (Math.abs(diffMinutes) < 60) return { unit: 'minute', value: Math.round(diffMinutes) };
    const diffHours = diffMinutes / 60;
    if (Math.abs(diffHours) < 24) return { unit: 'hour', value: Math.round(diffHours) };
    const diffDays = diffHours / 24;
    if (Math.abs(diffDays) < 7) return { unit: 'day', value: Math.round(diffDays) };
    const diffWeeks = diffDays / 7;
    if (Math.abs(diffWeeks) < 4) return { unit: 'week', value: Math.round(diffWeeks) };
    const diffMonths = diffDays / 30;
    if (Math.abs(diffMonths) < 12) return { unit: 'month', value: Math.round(diffMonths) };
    const diffYears = diffDays / 365;
    return { unit: 'year', value: Math.round(diffYears) };
  };

  const { unit, value: amount } = pick();
  return RTF.format(amount, unit);
}
