// Opening hours are stored on the store record as a flat list of intervals.
// The visible table and the schema.org OpeningHoursSpecification are both
// derived from that single list, so they cannot contradict each other — the
// previous setup kept free text for the page and a hardcoded schema constant.

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface OpeningHoursInterval {
  day: Weekday;
  /** 24h "HH:MM". */
  opens: string;
  closes: string;
}

const WEEK: { day: Weekday; label: string; schemaDay: string }[] = [
  { day: 'monday', label: 'Lundi', schemaDay: 'Monday' },
  { day: 'tuesday', label: 'Mardi', schemaDay: 'Tuesday' },
  { day: 'wednesday', label: 'Mercredi', schemaDay: 'Wednesday' },
  { day: 'thursday', label: 'Jeudi', schemaDay: 'Thursday' },
  { day: 'friday', label: 'Vendredi', schemaDay: 'Friday' },
  { day: 'saturday', label: 'Samedi', schemaDay: 'Saturday' },
  { day: 'sunday', label: 'Dimanche', schemaDay: 'Sunday' },
];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Shown when the CMS has no usable hours, so page and schema stay in step. */
export const DEFAULT_OPENING_HOURS: OpeningHoursInterval[] = [
  { day: 'monday', opens: '09:30', closes: '12:30' },
  { day: 'monday', opens: '14:00', closes: '19:00' },
  { day: 'tuesday', opens: '09:30', closes: '12:30' },
  { day: 'tuesday', opens: '14:00', closes: '19:00' },
  { day: 'wednesday', opens: '09:30', closes: '12:30' },
  { day: 'wednesday', opens: '14:00', closes: '19:00' },
  { day: 'thursday', opens: '09:30', closes: '12:30' },
  { day: 'thursday', opens: '14:00', closes: '19:00' },
  { day: 'friday', opens: '09:30', closes: '12:30' },
  { day: 'friday', opens: '14:00', closes: '19:00' },
  { day: 'saturday', opens: '09:30', closes: '19:00' },
];

function isInterval(value: unknown): value is OpeningHoursInterval {
  const row = value as Partial<OpeningHoursInterval> | null;
  return (
    !!row &&
    typeof row === 'object' &&
    WEEK.some((d) => d.day === row.day) &&
    typeof row.opens === 'string' &&
    typeof row.closes === 'string' &&
    TIME.test(row.opens) &&
    TIME.test(row.closes)
  );
}

/**
 * Keeps only well-formed intervals. Store records written before this format
 * (a `{ monday: "10h00 – 19h00" }` object) yield an empty list rather than
 * throwing, so the page falls back to DEFAULT_OPENING_HOURS.
 */
export function parseOpeningHours(value: unknown): OpeningHoursInterval[] {
  return Array.isArray(value) ? value.filter(isInterval) : [];
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = String(Number(hours));
  return minutes === '00' ? `${hour}h` : `${hour}h${minutes}`;
}

function intervalsByDay(intervals: OpeningHoursInterval[]): Map<Weekday, OpeningHoursInterval[]> {
  const byDay = new Map<Weekday, OpeningHoursInterval[]>(WEEK.map((d) => [d.day, []]));
  for (const interval of intervals) {
    byDay.get(interval.day)!.push(interval);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.opens.localeCompare(b.opens));
  }
  return byDay;
}

/**
 * One row per run of consecutive days sharing the same schedule:
 * `{ label: 'Lundi - Vendredi', value: '9h30 - 12h30 / 14h - 19h' }`.
 * Days without an interval are reported as closed rather than hidden.
 */
export function formatOpeningHours(
  intervals: OpeningHoursInterval[],
): { label: string; value: string }[] {
  const byDay = intervalsByDay(intervals);
  const rows: { label: string; value: string }[] = [];

  for (const day of WEEK) {
    const value =
      byDay
        .get(day.day)!
        .map((i) => `${formatTime(i.opens)} - ${formatTime(i.closes)}`)
        .join(' / ') || 'Fermé';
    const previous = rows.at(-1);

    if (previous && previous.value === value) {
      // Days are walked in order, so the previous row always ends on the day
      // before this one: extend its run, keeping the day it started on.
      previous.label = `${previous.label.split(' - ')[0]} - ${day.label}`;
    } else {
      rows.push({ label: day.label, value });
    }
  }

  return rows;
}

/** schema.org OpeningHoursSpecification: one entry per distinct time range. */
export function toOpeningHoursSpecification(intervals: OpeningHoursInterval[]) {
  const ranges = new Map<string, string[]>();

  for (const day of WEEK) {
    for (const interval of intervals.filter((i) => i.day === day.day)) {
      const key = `${interval.opens}-${interval.closes}`;
      const days = ranges.get(key) ?? [];
      if (!days.includes(day.schemaDay)) days.push(day.schemaDay);
      ranges.set(key, days);
    }
  }

  return [...ranges.entries()].map(([range, dayOfWeek]) => {
    const [opens, closes] = range.split('-');
    return { '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes };
  });
}
