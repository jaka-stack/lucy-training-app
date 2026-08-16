import { DAYS } from '../data/programme';
import type { SessionRecord } from './types';

/* ==========================================================================
   PROGRESS

   The brief asked how progress stays motivating in the weeks when the scale
   does not move. The programme answers that itself (§9): strength goes up
   fast for a beginner, fitness shows by week 3-4, clothes change around week
   5-8, and the scale can go UP for the first three weeks while nothing is
   wrong.

   So this file measures the thing that actually moves early and honestly:
   what she can lift now that she could not lift before. Nothing here is a
   score, a streak or a projection.
   ========================================================================== */

export type ExerciseProgress = {
  exerciseId: string;
  /** The earliest session's best set. */
  first: { weight: number | null; reps: number; week: number };
  /** The most recent session's best set. */
  latest: { weight: number | null; reps: number; week: number };
  /** True when either the weight or the reps have gone up. */
  improved: boolean;
  /** A plain sentence, or null when there is nothing honest to say yet. */
  sentence: string | null;
};

/** The set from a session that best represents it: heaviest, then most reps. */
function bestSet(sets: { weight: number | null; reps: number }[]) {
  return [...sets].sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || b.reps - a.reps,
  )[0];
}

export function exerciseProgress(
  history: SessionRecord[],
): ExerciseProgress[] {
  const byExercise = new Map<
    string,
    { week: number; sets: { weight: number | null; reps: number }[] }[]
  >();

  for (const session of history) {
    const grouped = new Map<string, { weight: number | null; reps: number }[]>();
    for (const s of session.sets) {
      const list = grouped.get(s.exerciseId) ?? [];
      list.push({ weight: s.weight, reps: s.reps });
      grouped.set(s.exerciseId, list);
    }
    for (const [id, sets] of grouped) {
      const list = byExercise.get(id) ?? [];
      list.push({ week: session.week, sets });
      byExercise.set(id, list);
    }
  }

  const out: ExerciseProgress[] = [];

  for (const [exerciseId, sessions] of byExercise) {
    if (sessions.length < 2) continue;

    const first = bestSet(sessions[0].sets);
    const latest = bestSet(sessions[sessions.length - 1].sets);

    const heavier = (latest.weight ?? 0) > (first.weight ?? 0);
    const sameWeight = (latest.weight ?? 0) === (first.weight ?? 0);
    const moreReps = latest.reps > first.reps;
    const improved = heavier || (sameWeight && moreReps);

    let sentence: string | null = null;
    if (heavier && moreReps) {
      sentence = `${first.weight} kg for ${first.reps} → ${latest.weight} kg for ${latest.reps}`;
    } else if (heavier) {
      sentence = `${first.weight} kg → ${latest.weight} kg`;
    } else if (sameWeight && moreReps) {
      sentence =
        latest.weight === null
          ? `${first.reps} → ${latest.reps} reps`
          : `${latest.weight} kg: ${first.reps} → ${latest.reps} reps`;
    }

    out.push({
      exerciseId,
      first: { ...first, week: sessions[0].week },
      latest: { ...latest, week: sessions[sessions.length - 1].week },
      improved,
      sentence,
    });
  }

  // Biggest visible change first — she should see the best news at the top.
  return out.sort((a, b) => Number(b.improved) - Number(a.improved));
}

/** Sessions done, and how many of the twelve weeks have been trained in. */
export function trainingTotals(history: SessionRecord[]) {
  const weeks = new Set(history.map((h) => h.week));
  const sets = history.reduce((n, h) => n + h.sets.length, 0);
  const reps = history.reduce(
    (n, h) => n + h.sets.reduce((m, s) => m + s.reps, 0),
    0,
  );
  return {
    sessions: history.length,
    weeksTrained: weeks.size,
    sets,
    reps,
  };
}

/** Which of the three days have been done in a given week. */
export function daysDoneInWeek(history: SessionRecord[], week: number) {
  const done = new Set(
    history.filter((h) => h.week === week).map((h) => h.dayId),
  );
  return DAYS.map((d) => ({ day: d, done: done.has(d.id) }));
}

/**
 * How long since she last trained. Used for a plain, un-judgemental line —
 * never a warning, never a broken streak.
 */
export function daysSinceLastSession(history: SessionRecord[]): number | null {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const then = new Date(last.finishedAt).getTime();
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) ? days : null;
}
