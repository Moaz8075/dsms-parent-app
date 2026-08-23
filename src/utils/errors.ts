/** Map API / system errors to short messages parents can understand. */
export function toUserMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  const raw = String((err as { message?: unknown })?.message ?? '').trim();
  if (!raw) return fallback;

  const lower = raw.toLowerCase();

  if (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('network request failed') ||
    lower.includes('timeout')
  ) {
    return 'Unable to connect. Check your internet and try again.';
  }

  if (
    lower.includes('overlap') ||
    lower.includes('already exists') ||
    lower.includes('duplicate') ||
    lower.includes('conflict') ||
    lower.includes('same date')
  ) {
    return 'A leave request already covers these dates. Choose different dates or cancel the existing request.';
  }

  if (lower.includes('past') || (lower.includes('before') && lower.includes('date'))) {
    return 'Leave dates cannot be in the past. Please choose today or a future date.';
  }

  if (lower.includes('unauthorized') || lower.includes('401') || lower.includes('forbidden') || lower.includes('403')) {
    return 'Your session expired. Please sign in again.';
  }

  if (lower.includes('end date') && (lower.includes('before') || lower.includes('after') || lower.includes('start'))) {
    return 'End date must be on or after the start date.';
  }

  if (
    lower.includes('must be') ||
    lower.includes('should not') ||
    lower.includes('isstring') ||
    lower.includes('isdate') ||
    lower.includes('validation') ||
    lower.includes('exception') ||
    lower.includes('internal server') ||
    /^\d{3}\b/.test(raw) ||
    raw.includes('\n') ||
    raw.length > 140
  ) {
    return fallback;
  }

  return raw;
}
