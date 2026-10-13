import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TimeSlot } from '../store/types';

export const TIME_SLOTS: { value: TimeSlot; label: string }[] = [
  { value: 'FullDay', label: 'Hele dag' },
  { value: 'Morning', label: 'Ochtend' },
  { value: 'Afternoon', label: 'Middag' },
  { value: 'Evening', label: 'Avond' },
];

export function timeSlotLabel(slot: TimeSlot | null | undefined): string {
  return TIME_SLOTS.find(item => item.value === slot)?.label ?? 'Hele dag';
}

/** Voegt het tijdsblok achter de naam toe, behalve bij 'hele dag'. */
export function nameWithTimeSlot(enrollment: { firstName: string; timeSlot?: TimeSlot | null }): string {
  return enrollment.timeSlot && enrollment.timeSlot !== 'FullDay'
    ? `${enrollment.firstName} (${timeSlotLabel(enrollment.timeSlot).toLowerCase()})`
    : enrollment.firstName;
}

/** 90 → "1 uur 30 min", 45 → "45 min". */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} uur` : `${hours} uur ${rest} min`;
}

export function formatDay(date: string, pattern = 'EEEE d MMMM yyyy'): string {
  return format(new Date(date), pattern, { locale: nl });
}
