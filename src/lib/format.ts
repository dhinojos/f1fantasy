import { formatDistanceToNowStrict, format, isPast } from 'date-fns';

export function formatDateTime(value: string): string {
  return format(new Date(value), 'EEE, MMM d · HH:mm');
}

export function formatRaceDate(value: string): string {
  return format(new Date(value), 'MMM d, yyyy');
}

export function formatCountdown(value: string): string {
  const date = new Date(value);
  if (isPast(date)) {
    return 'Locked';
  }

  return formatDistanceToNowStrict(date);
}
