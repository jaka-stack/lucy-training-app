import type { CheckIn } from './types';

/* ==========================================================================
   WEIGHT AND MEASUREMENTS

   §9 of the programme is unusually blunt about this, and the app follows it
   literally:

     "The scale will lie to you in the first three weeks. New training makes
      muscles hold extra water and glycogen, so the number can rise 0.5-1.5 kg
      before it starts falling. Weigh yourself at the same time on the same
      days, and only compare the weekly average to the previous weekly
      average. A single morning's weight is close to meaningless."

   So: she can log a weight whenever she likes, and the app will never show
   her a single day's number back. It shows the weekly average, and it will
   not show a week's average at all until there are at least two readings in
   it — because an "average" of one reading is just the daily number wearing
   a hat.

   There is no goal weight, no projection, no trend arrow and no chart of
   daily values, because every one of those turns a weekly check into a daily
   habit of checking a number.
   ========================================================================== */

/** The fewest readings that make a weekly average worth showing. */
const MIN_READINGS = 2;

export type WeeklySummary = {
  week: number;
  weightKg?: number;
  waistCm?: number;
  weightReadings: number;
  /** True when there were readings but too few to average honestly. */
  weightTooFew: boolean;
};

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function weeklySummaries(checkIns: CheckIn[]): WeeklySummary[] {
  const byWeek = new Map<number, CheckIn[]>();
  for (const c of checkIns) {
    const list = byWeek.get(c.week) ?? [];
    list.push(c);
    byWeek.set(c.week, list);
  }

  return [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, entries]) => {
      const weights = entries
        .map((e) => e.weightKg)
        .filter((w): w is number => typeof w === 'number');
      const waists = entries
        .map((e) => e.waistCm)
        .filter((w): w is number => typeof w === 'number');

      return {
        week,
        weightKg:
          weights.length >= MIN_READINGS
            ? Math.round(mean(weights) * 10) / 10
            : undefined,
        waistCm:
          waists.length > 0 ? Math.round(mean(waists) * 10) / 10 : undefined,
        weightReadings: weights.length,
        weightTooFew: weights.length > 0 && weights.length < MIN_READINGS,
      };
    });
}

/**
 * The honest comparison: this week's average against the previous week that
 * had one. Returns null when there is not enough to say anything.
 */
export function weekOnWeek(
  checkIns: CheckIn[],
): { change: number; from: number; to: number } | null {
  const withWeight = weeklySummaries(checkIns).filter(
    (s) => s.weightKg !== undefined,
  );
  if (withWeight.length < 2) return null;

  const latest = withWeight[withWeight.length - 1];
  const previous = withWeight[withWeight.length - 2];

  return {
    change: Math.round((latest.weightKg! - previous.weightKg!) * 10) / 10,
    from: previous.week,
    to: latest.week,
  };
}
