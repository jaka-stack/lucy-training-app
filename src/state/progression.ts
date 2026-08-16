import { planForWeek, type Day, type PrescribedExercise } from '../data/programme';
import { effectiveRange, nextDumbbellUp } from './engine';
import type { Adjustments, Equipment, SessionRecord } from './types';

/* ==========================================================================
   THE PROGRESSION RULE

   From §4 of the programme:

     "When you hit the top of the rep range on every working set of an
      exercise, at or below the target RPE, in two sessions in a row — that
      exercise gets harder next time. Take the next step up the ladder."

   The PDF puts this on her: log everything, notice the pattern, remember
   which exercise earned it. That is the single biggest thing an app can take
   off her, so this file does it.

   THE LADDER (§4). Weight is only the first rung, and it is often the wrong
   one — with 5 kg jumps, "one dumbbell up" can be a 100% increase on a light
   exercise. The other rungs exist because of that.

     1  Next dumbbell up, back to the bottom of the rep range
     2  Add reps beyond the top of the range, up to 5 extra
     3  Slow the lowering to 3 seconds
     4  Add a 1-second pause at the hardest point
     5  One side at a time
     6  Add a set (cap 4)
     7  Cut the rest by 15 seconds

   WHICH RUNG: the PDF picks step 1 "when the jump is manageable". That is a
   judgement about her actual dumbbells, so the app works it out: if the next
   dumbbell up is a small increase on what she is lifting, take it; if it is a
   big one, climb the other rungs first. Someone with 2 kg increments should
   almost always just add weight; someone with 5 kg gaps on a 5 kg exercise
   should not.
   ========================================================================== */

/** How big a jump we will take without hesitating, as a share of the load. */
const COMFORTABLE_JUMP = 0.2;

export type LadderStep =
  | 'weight'
  | 'reps'
  | 'tempo'
  | 'pause'
  | 'unilateral'
  | 'set';

export type ProgressionOffer = {
  exerciseId: string;
  exerciseName: string;
  step: LadderStep;
  /** What the app will do, in her words. */
  headline: string;
  /** Why this rung and not simply more weight. */
  because: string;
  /** For the weight step: the dumbbell to move to. */
  newWeight?: number;
};

/* --- did an exercise earn a step? ---------------------------------------- */

/**
 * A qualifying session: every working set at the top of the range, and every
 * set at or below the target effort.
 *
 * Deload weeks are not evaluated at all — week 7 caps effort at RPE 5 and
 * halves the sets, so nobody can qualify. Counting it as a failure would
 * punish her for following the plan, so it is skipped entirely and the run of
 * qualifying sessions carries across it untouched.
 */
function sessionQualifies(
  session: SessionRecord,
  pe: PrescribedExercise,
  day: Day,
  adj: Adjustments | undefined,
): boolean {
  const plan = planForWeek(session.week);
  if (plan.isDeload) return false;

  const sets = session.sets.filter((s) => s.exerciseId === pe.exerciseId);
  if (sets.length === 0) return false;

  // Every set she actually did must be at the top of the range and at or
  // under target effort. The top moves if she has already taken the extra
  // reps rung.
  const range = effectiveRange(pe.seconds ?? pe.reps, adj);
  const top = range[1];
  const targetTop = plan.targetRpe[1];

  const expected =
    pe.group === 'A' ? plan.setsA : pe.group === 'B' ? plan.setsB : plan.setsC;

  // She must have completed the prescribed number of sets, not just the ones
  // she happened to log before stopping.
  if (sets.length < expected) return false;
  if (day.id !== session.dayId) return false;

  return sets.every((s) => s.reps >= top && s.rpe <= targetTop);
}

/**
 * Sessions of this day, oldest first, excluding deload weeks — the deload is
 * neutral rather than a break in the run.
 */
function relevantSessions(day: Day, history: SessionRecord[]): SessionRecord[] {
  return history.filter(
    (h) => h.dayId === day.id && !planForWeek(h.week).isDeload,
  );
}

/** True when the last two relevant sessions both qualified. */
export function hasEarnedProgression(
  pe: PrescribedExercise,
  day: Day,
  history: SessionRecord[],
  adj?: Adjustments,
): boolean {
  const sessions = relevantSessions(day, history).filter((s) =>
    s.sets.some((x) => x.exerciseId === pe.exerciseId),
  );
  if (sessions.length < 2) return false;

  const lastTwo = sessions.slice(-2);
  return lastTwo.every((s) => sessionQualifies(s, pe, day, adj));
}

/* --- which rung ---------------------------------------------------------- */

function currentWeightFor(
  exerciseId: string,
  history: SessionRecord[],
): number | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const s = history[i].sets.find((x) => x.exerciseId === exerciseId);
    if (s) return s.weight;
  }
  return null;
}

export function chooseStep(
  pe: PrescribedExercise,
  equipment: Equipment,
  history: SessionRecord[],
  applied: Adjustments,
): { step: LadderStep; newWeight?: number; because: string } {
  const current = currentWeightFor(pe.exerciseId, history);

  // Step 1 — more weight, but only when the jump is not brutal.
  if (pe.weightStyle !== 'none' && current !== null) {
    const next = nextDumbbellUp(current, equipment.dumbbells);
    if (next !== null) {
      const jump = (next - current) / current;
      if (jump <= COMFORTABLE_JUMP) {
        return {
          step: 'weight',
          newWeight: next,
          because: `Your next dumbbell up is ${next} kg — a small enough step to just take it.`,
        };
      }
      // The jump is big. Fall through to the other rungs, which is exactly
      // what the programme's ladder is for.
    }
  }

  // Step 2 — add reps beyond the top of the range, up to 5 extra.
  const bonus = applied.bonusReps ?? 0;
  if (bonus < 5) {
    const nextDb =
      current !== null ? nextDumbbellUp(current, equipment.dumbbells) : null;
    const because =
      nextDb !== null && current !== null
        ? `The next dumbbell up is ${nextDb} kg, which is a big jump from ${current} kg. Reps first.`
        : pe.weightStyle === 'none'
          ? 'There is no weight to add to this one, so the reps go up.'
          : 'Nothing heavier to move to, so the reps go up.';
    return { step: 'reps', because };
  }

  // Step 3 — slow the lowering.
  if (!applied.tempo)
    return {
      step: 'tempo',
      because:
        'The reps are getting high. Slowing the lowering makes the same dumbbell feel much heavier — this is the best tool you have with the weights you own.',
    };

  // Step 4 — a pause at the hardest point.
  if (!applied.pause)
    return {
      step: 'pause',
      because:
        'Slow lowering has been in place for a while. A pause at the hardest point is the next step up.',
    };

  // Step 5 — one side at a time.
  if (!applied.unilateral && pe.weightStyle !== 'none' && !pe.perSide)
    return {
      step: 'unilateral',
      because:
        'One side at a time doubles the load on the working side without a heavier dumbbell.',
    };

  // Step 6 — add a set, capped at 4.
  return {
    step: 'set',
    because: 'An extra set, which is the last easy lever before the block changes.',
  };
}

/* --- the offer she actually sees ----------------------------------------- */

export function progressionOffers(
  day: Day,
  equipment: Equipment,
  history: SessionRecord[],
  adjustments: Record<string, Adjustments>,
  nameFor: (exerciseId: string) => string,
): ProgressionOffer[] {
  const offers: ProgressionOffer[] = [];

  for (const pe of day.exercises) {
    const applied = adjustments[pe.exerciseId] ?? {};

    // She said "not yet". Wait for a new session before asking again rather
    // than putting the same card in front of her every time she opens the app.
    if (
      applied.declinedAt !== undefined &&
      history.length <= applied.declinedAt
    )
      continue;

    // A weight step already agreed but not yet lifted is not re-offered.
    if (applied.targetWeight !== undefined) continue;

    if (!hasEarnedProgression(pe, day, history, applied)) continue;

    const { step, newWeight, because } = chooseStep(
      pe,
      equipment,
      history,
      applied,
    );

    // Cap sets at 4, as the programme says. Once the extra set is in, this
    // exercise has run out of ladder until the block changes.
    if (step === 'set' && applied.set) continue;

    offers.push({
      exerciseId: pe.exerciseId,
      exerciseName: nameFor(pe.exerciseId),
      step,
      newWeight,
      because,
      headline: headlineFor(step, newWeight),
    });
  }

  // "Progress one exercise at a time. Don't jump three exercises in the same
  // session or you won't know what caused the soreness." (§4)
  return offers.slice(0, 1);
}

function headlineFor(step: LadderStep, newWeight?: number): string {
  switch (step) {
    case 'weight':
      return `Move up to the ${newWeight} kg`;
    case 'reps':
      return 'Add a few more reps';
    case 'tempo':
      return 'Slow the lowering to 3 seconds';
    case 'pause':
      return 'Add a 1-second pause';
    case 'unilateral':
      return 'One side at a time';
    case 'set':
      return 'Add one more set';
  }
}
