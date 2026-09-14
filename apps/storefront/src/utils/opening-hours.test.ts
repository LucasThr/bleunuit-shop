import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OPENING_HOURS,
  formatOpeningHours,
  parseOpeningHours,
  toOpeningHoursSpecification,
  type OpeningHoursInterval,
} from './opening-hours';

describe('parseOpeningHours', () => {
  it('keeps well-formed intervals', () => {
    const rows: OpeningHoursInterval[] = [{ day: 'monday', opens: '09:30', closes: '12:30' }];
    expect(parseOpeningHours(rows)).toEqual(rows);
  });

  it('drops the pre-migration per-day object instead of throwing', () => {
    expect(parseOpeningHours({ monday: '10h00 – 19h00' })).toEqual([]);
  });

  it('drops rows with an unknown day or a malformed time', () => {
    expect(
      parseOpeningHours([
        { day: 'lundi', opens: '09:30', closes: '12:30' },
        { day: 'monday', opens: '9:30', closes: '12:30' },
        { day: 'monday', opens: '09:30', closes: '25:00' },
      ]),
    ).toEqual([]);
  });

  it('returns an empty list for null', () => {
    expect(parseOpeningHours(null)).toEqual([]);
  });
});

describe('formatOpeningHours', () => {
  it('groups consecutive days sharing a schedule and marks closed days', () => {
    expect(formatOpeningHours(DEFAULT_OPENING_HOURS)).toEqual([
      { label: 'Lundi - Vendredi', value: '9h30 - 12h30 / 14h - 19h' },
      { label: 'Samedi', value: '9h30 - 19h' },
      { label: 'Dimanche', value: 'Fermé' },
    ]);
  });

  it('reports every day as closed when there is no interval', () => {
    const rows = formatOpeningHours([]);
    expect(rows).toEqual([{ label: 'Lundi - Dimanche', value: 'Fermé' }]);
  });

  it('does not merge days that are not adjacent', () => {
    expect(
      formatOpeningHours([
        { day: 'monday', opens: '10:00', closes: '19:00' },
        { day: 'wednesday', opens: '10:00', closes: '19:00' },
      ]),
    ).toEqual([
      { label: 'Lundi', value: '10h - 19h' },
      { label: 'Mardi', value: 'Fermé' },
      { label: 'Mercredi', value: '10h - 19h' },
      { label: 'Jeudi - Dimanche', value: 'Fermé' },
    ]);
  });
});

describe('toOpeningHoursSpecification', () => {
  it('emits one entry per distinct time range', () => {
    expect(toOpeningHoursSpecification(DEFAULT_OPENING_HOURS)).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:30',
        closes: '12:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '14:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:30',
        closes: '19:00',
      },
    ]);
  });

  it('emits nothing when the store has no interval', () => {
    expect(toOpeningHoursSpecification([])).toEqual([]);
  });
});
