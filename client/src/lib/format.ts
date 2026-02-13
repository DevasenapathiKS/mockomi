import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDateTime(value: string | null, fallback: string = 'TBD') {
  if (!value) return fallback;
  const date = dayjs(value);
  if (!date.isValid()) return fallback;
  return date.format('MMM D, YYYY · h:mm A');
}

export function formatCurrency(amount: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeUntil(value: string | null) {
  if (!value) return '—';
  const date = dayjs(value);
  if (!date.isValid()) return '—';
  const now = dayjs();
  if (date.isBefore(now)) {
    return `Started ${date.fromNow()}`;
  }
  return date.fromNow();
}
