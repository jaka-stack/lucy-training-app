import {
  DAYS,
  RETEST_LIFTS,
  bikeFinisher,
  planForWeek,
  type BikePlan,
  type Day,
  type PrescribedExercise,
  type WeekPlan,
} from '../data/programme';
import {
  resolveExercise,
  type BenchKind,
  type ResolvedExercise,
} from '../data/exercises';
import type { Adjustments, Equipment, SessionRecord } from './types';

/**
 * The rep range after any ladder steps she has taken. The 'reps' rung raises
 * the top of the range by up to 5 (§4, step 2), so both the screen and the
 * progression check have to agree about where the top now is.
 */
export function effectiveRange(
  base: [number, number],
  adj: Adjustments | undefined,
): [number, number] {
  const bonus = adj?.bonusReps ?? 0;
  return bonus > 0 ? [base[0], base[1] + bonus] : base;
}

/** The equipment record, expressed the way resolveExercise wants it. */
export function benchKind(equipment: Equipment): BenchKind {
  if (!equipment.hasBench) return 'none';
  return equipment.benchInclines ? 'incline' : 'flat';
}

/* ==========================================================================
   THE ENGINE

   Turns "week 8, Day 1, this is the kit she owns, this is what she lifted
   last time" into an ordered list of steps the session player walks through.

   All the programme's rules live here in one place, so there is exactly one
   answer to "how many sets is it this week" rather than the question being
   answered slightly differently on four screens.
   ========================================================================== */

/* --- the effort scale --------------------------------------------------- */

/* The programme records RPE. A beginner cannot give a reliable 1-10 number
   mid-set, so the app asks the question the RPE scale is actually asking —
   "how many more could you have done?" — and converts.
   Definitions from §1: RPE 6 = 4 more reps, 7 = 3 more, 8 = 2 more, 10 = failure. */
export const EFFORTS = [
  { key: 'easy', title: 'Easy', sub: 'lots left', rpe: 5 },
  { key: 'moderate', title: 'Moderate', sub: '3 or 4 more', rpe: 6.5 },
  { key: 'hard', title: 'Hard', sub: '2 more at most', rpe: 8 },
  { key: 'max', title: 'All I had', sub: 'nothing left', rpe: 9.5 },
] as const;

export type Effort = (typeof EFFORTS)[number];

/* --- steps -------------------------------------------------------------- */

export type PlannedSet = {
  slot: string;
  group: 'A' | 'B' | 'C';
  exercise: ResolvedExercise;
  setNumber: number;
  totalSets: number;
  reps: [number, number];
  /** Set instead of reps for holds like planks. Seconds. */
  seconds?: [number, number];
  perSide: boolean;
  /** kg, or null for bodyweight. */
  suggestedWeight: number | null;
  weightStyle: 'one' | 'pair' | 'none';
  /** Pre-filled count — reps, or seconds for a hold. */
  expectedReps: number;
  targetRpe: [number, number];
  tempo: string;
  /** Set when this block changes how the exercise is performed. */
  variationNote?: string;
  /** What she did last time, already formatted. null if never done. */
  lastTime: string | null;
};

export type Step =
  | { kind: 'warmup' }
  | { kind: 'rampup'; exercise: ResolvedExercise; weight: number | null }
  | { kind: 'set'; set: PlannedSet }
  | { kind: 'rest'; seconds: number; nextLabel: string }
  | { kind: 'bike'; plan: BikePlan }
  | { kind: 'cooldown' }
  | { kind: 'retestIntro' }
  | {
      kind: 'retest';
      exercise: ResolvedExercise;
      exerciseId: string;
      weightStyle: 'one' | 'pair' | 'none';
      /** Her week 1 numbers on this lift, for an honest comparison. */
      weekOne: { weight: number | null; reps: number } | null;
      startWeight: number | null;
    }
  | { kind: 'summary' };

/* --- weights ------------------------------------------------------------ */

/** The heaviest dumbbell she owns that is no heavier than the target. If she
    owns nothing that light, the lightest she has. Never returns a weight she
    does not own — that is the whole point of asking on first run. */
export function snapToOwned(target: number, owned: number[]): number | null {
  if (owned.length === 0) return null;
  const sorted = [...owned].sort((a, b) => a - b);
  const atOrBelow = sorted.filter((w) => w <= target);
  return atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1] : sorted[0];
}

/** The next dumbbell up from the current one, or null if she is at the top. */
export function nextDumbbellUp(current: number, owned: number[]): number | null {
  const above = [...owned].sort((a, b) => a - b).filter((w) => w > current);
  return above.length > 0 ? above[0] : null;
}

function lastPerformanceFor(
  exerciseId: string,
  history: SessionRecord[],
): { weight: number | null; repsBySet: number[] } | null {
  // Most recent session first.
  for (let i = history.length - 1; i >= 0; i--) {
    const sets = history[i].sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length > 0) {
      return {
        weight: sets[0].weight,
        repsBySet: sets.map((s) => s.reps),
      };
    }
  }
  return null;
}

/**
 * Which block's version of an exercise to use.
 *
 * Week 7 sits inside block 3 but is the deload: "same exercises, roughly half
 * the sets, nothing above RPE 5". Block 3's harder variations belong to weeks
 * 8-9, so during the deload we use the block 2 version — exactly what she was
 * already doing in weeks 4-6.
 */
function effectiveBlock(plan: WeekPlan): 1 | 2 | 3 | 4 {
  return plan.isDeload ? 2 : plan.block;
}

/** The prescription after any block has changed the movement itself. */
export type Effective = {
  reps: [number, number];
  seconds?: [number, number];
  perSide: boolean;
  weightStyle: 'one' | 'pair' | 'none';
  weightOverride?: number | null;
};

function effectivePrescription(
  pe: PrescribedExercise,
  plan: WeekPlan,
): Effective {
  const b = effectiveBlock(plan);
  const o = b === 1 ? undefined : pe.blockOverride?.[b];

  return {
    reps: o?.reps ?? pe.reps,
    seconds: o?.seconds ?? pe.seconds,
    perSide: o?.perSide ?? pe.perSide ?? false,
    weightStyle: o?.weightStyle ?? pe.weightStyle,
    weightOverride: o?.weight,
  };
}

function suggestWeight(
  pe: PrescribedExercise,
  plan: WeekPlan,
  equipment: Equipment,
  history: SessionRecord[],
  eff: Effective,
): number | null {
  if (eff.weightStyle === 'none') return null;

  // When a block changes the movement itself — the hip thrust going
  // single-leg in block 4 — its weight replaces history, because what she
  // lifted last week was effectively a different exercise.
  if (eff.weightOverride !== undefined) {
    return eff.weightOverride === null
      ? null
      : snapToOwned(eff.weightOverride, equipment.dumbbells);
  }

  // Otherwise what she actually lifted last time beats anything the page says.
  const last = lastPerformanceFor(pe.exerciseId, history);
  if (last && last.weight !== null) return last.weight;

  // Block 1 always uses the day page's starting weight; blocks 2-4 may name
  // their own in the block table.
  const b = effectiveBlock(plan);
  const blockSpecific = b === 1 ? undefined : pe.blockWeight?.[b];
  const prescribed = blockSpecific ?? pe.startWeight;
  if (prescribed === null) return null;
  return snapToOwned(prescribed, equipment.dumbbells);
}

/* --- block-specific changes to how a movement is performed --------------- */

/* From the block table (§7). These are changes to the exercise itself, over
   and above the tempo and set changes that apply to everything. */
function variationFor(
  exerciseId: string,
  plan: WeekPlan,
  bench: BenchKind,
): string | undefined {
  if (plan.isDeload) return undefined; // week 7 changes nothing but volume

  const b = plan.block;

  /* --- Day 1 ---------------------------------------------------------- */

  if (exerciseId === 'incline-pushup') {
    if (b === 3)
      return bench === 'none'
        ? 'If you can do 12 clean reps on your surface, use a lower one this block.'
        : 'If you can do 12 clean reps with your hands on the bench, move them to the floor this block.';
    if (b === 4)
      return 'Floor push-ups now, 3 seconds down. If your hips sag on the floor, go back up — form is the ceiling.';
  }

  if (exerciseId === 'goblet-squat' && b === 4)
    return 'Pause for a full second at the bottom of every rep.';

  if ((exerciseId === 'db-rdl' || exerciseId === 'b-stance-rdl') && b === 4)
    return 'Pause for a second just below the knee on the way down.';

  if (exerciseId === 'seated-shoulder-press' && b === 4)
    return 'Pause for a second at the bottom, level with your shoulders.';

  /* --- Day 2 ---------------------------------------------------------- */

  if (exerciseId === 'hip-thrust') {
    if (b === 3)
      return 'Higher reps this block — or hold the squeeze at the top for 2 seconds instead.';
    if (b === 4)
      return 'One leg at a time now. Far harder than it sounds, so the weight comes right down — bodyweight is fine.';
  }

  if (exerciseId === 'incline-press') {
    if (b === 2)
      return 'Move up to the next dumbbell once you can do 12 clean reps.';
    if (b === 3) return '3 seconds down on every rep.';
    if (b === 4) return 'Pause for a second with the dumbbells on your chest.';
  }

  /* --- Day 3 ---------------------------------------------------------- */

  if (exerciseId === 'split-squat') {
    if (b === 3 || b === 4) {
      const surface =
        bench === 'none'
          ? 'a chair, a step or the edge of the sofa'
          : 'the bench';
      const tempo = b === 4 ? ', and 3 seconds down' : '';
      // The escape hatch: this movement is balance-limited, and at week 8 of
      // her first ever programme a fall is a worse outcome than a slightly
      // easier set. The programme is unchanged — this only tells her what to
      // do if balance, rather than the leg, is what fails.
      return `Back foot up on ${surface} now${tempo}. If it is your balance that gives out rather than your leg, keep both feet on the floor and slow the lowering instead — that is the harder version for you today.`;
    }
  }

  return undefined;
}

function setsForGroup(group: 'A' | 'B' | 'C', plan: WeekPlan): number {
  return group === 'A' ? plan.setsA : group === 'B' ? plan.setsB : plan.setsC;
}

function formatLastTime(
  last: { weight: number | null; repsBySet: number[] } | null,
  style: 'one' | 'pair' | 'none',
): string | null {
  if (!last) return null;
  const reps = last.repsBySet.join(', ');
  if (last.weight === null) return reps;
  const w = style === 'pair' ? `2 × ${last.weight} kg` : `${last.weight} kg`;
  return `${w} — ${reps}`;
}

/* --- building the session ----------------------------------------------- */

/** Is this the week 12 retest session? (§7 — week 12, session 3.) */
export function isRetestSession(dayId: string, week: number): boolean {
  return week === 12 && dayId === 'day3';
}

/** Her earliest logged set on a lift, for the week 1 comparison. */
function earliestPerformance(
  exerciseId: string,
  history: SessionRecord[],
): { weight: number | null; reps: number } | null {
  for (const session of history) {
    const sets = session.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length > 0) {
      const best = [...sets].sort(
        (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || b.reps - a.reps,
      )[0];
      return { weight: best.weight, reps: best.reps };
    }
  }
  return null;
}

export function buildSession(
  day: Day,
  week: number,
  equipment: Equipment,
  history: SessionRecord[],
  adjustments: Record<string, Adjustments> = {},
): Step[] {
  const plan = planForWeek(week);
  const bench = benchKind(equipment);
  const steps: Step[] = [];

  steps.push({ kind: 'warmup' });

  // The week 12 retest replaces the A and B pairs with three max-ish lifts,
  // then keeps Day 3's arm work so it still feels like a session.
  if (isRetestSession(day.id, week)) {
    steps.push({ kind: 'retestIntro' });

    for (const id of RETEST_LIFTS) {
      const pe = DAYS.flatMap((d) => d.exercises).find(
        (e) => e.exerciseId === id,
      );
      const last = lastPerformanceFor(id, history);
      steps.push({
        kind: 'retest',
        exerciseId: id,
        exercise: resolveExercise(id, bench),
        weightStyle: pe?.weightStyle ?? 'one',
        weekOne: earliestPerformance(id, history),
        startWeight:
          last?.weight ??
          (pe?.startWeight != null
            ? snapToOwned(pe.startWeight, equipment.dumbbells)
            : null),
      });
      steps.push({
        kind: 'rest',
        // "back to Block 1 rest periods" (§7)
        seconds: 90,
        nextLabel: 'Next lift',
      });
    }

    // Day 3's C group, unchanged, so the last session is not just three
    // heavy attempts.
    const cGroup = day.exercises.filter((e) => e.group === 'C');
    for (let setNumber = 1; setNumber <= plan.setsC; setNumber++) {
      for (const pe of cGroup) {
        const eff = effectivePrescription(pe, plan);
        const adj = adjustments[pe.exerciseId];
        const range = effectiveRange(eff.seconds ?? eff.reps, adj);
        steps.push({
          kind: 'set',
          set: {
            slot: pe.slot,
            group: 'C',
            exercise: resolveExercise(pe.exerciseId, bench),
            setNumber,
            totalSets: plan.setsC,
            reps: eff.seconds ? eff.reps : range,
            seconds: eff.seconds ? range : undefined,
            perSide: eff.perSide,
            suggestedWeight: suggestWeight(pe, plan, equipment, history, eff),
            weightStyle: eff.weightStyle,
            expectedReps: range[0],
            targetRpe: plan.targetRpe,
            tempo: 'Controlled, about 2 seconds down',
            lastTime: formatLastTime(
              lastPerformanceFor(pe.exerciseId, history),
              eff.weightStyle,
            ),
          },
        });
      }
      if (setNumber < plan.setsC)
        steps.push({ kind: 'rest', seconds: 90, nextLabel: 'Next round' });
    }

    steps.push({ kind: 'bike', plan: bikeFinisher(day.id, week) });
    steps.push({ kind: 'cooldown' });
    steps.push({ kind: 'summary' });
    return steps;
  }

  const groups: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  let isFirstExerciseOfSession = true;

  for (const group of groups) {
    const inGroup = day.exercises.filter((e) => e.group === group);
    if (inGroup.length === 0) continue;

    // The ladder's "add a set" rung applies to whichever exercises have taken
    // it, capped at 4 working sets as the programme requires.
    const groupHasExtraSet = inGroup.some(
      (e) => adjustments[e.exerciseId]?.set,
    );
    const totalSets = Math.min(
      4,
      setsForGroup(group, plan) + (groupHasExtraSet ? 1 : 0),
    );

    // The ramp-up set, on the first exercise of the session only (§5).
    if (isFirstExerciseOfSession) {
      const first = inGroup[0];
      const ex = resolveExercise(first.exerciseId, bench);
      const eff = effectivePrescription(first, plan);
      const working = suggestWeight(first, plan, equipment, history, eff);
      const lighter =
        working === null
          ? null
          : (snapToOwned(working - 1, equipment.dumbbells) ?? null);
      steps.push({
        kind: 'rampup',
        exercise: ex,
        weight: lighter === working ? null : lighter,
      });
      isFirstExerciseOfSession = false;
    }

    for (let setNumber = 1; setNumber <= totalSets; setNumber++) {
      for (const pe of inGroup) {
        const ex = resolveExercise(pe.exerciseId, bench);
        const eff = effectivePrescription(pe, plan);
        const adj = adjustments[pe.exerciseId];
        const last = lastPerformanceFor(pe.exerciseId, history);

        // A dumbbell she has agreed to move up to wins until she has lifted
        // it; after that history takes over again.
        const suggested = suggestWeight(pe, plan, equipment, history, eff);
        const movingUp =
          adj?.targetWeight !== undefined &&
          (suggested === null || suggested < adj.targetWeight);
        const weight = movingUp ? adj!.targetWeight! : suggested;

        // Holds like planks are counted in seconds, not reps. Either way the
        // ladder's extra reps raise the top of the range.
        const range = effectiveRange(eff.seconds ?? eff.reps, adj);

        // Pre-fill with what she did for this set last time; otherwise the
        // bottom of the range, because double progression climbs from the
        // bottom (§4). Moving up a dumbbell, or a block changing the
        // movement, resets that — last week's numbers no longer apply.
        const changedThisBlock = eff.weightOverride !== undefined;
        const reset = changedThisBlock || movingUp;
        const expectedReps = reset
          ? range[0]
          : (last?.repsBySet[setNumber - 1] ?? last?.repsBySet[0] ?? range[0]);

        // Ladder steps that change how the rep itself is performed.
        const extraNotes: string[] = [];
        if (adj?.pause)
          extraNotes.push('Pause for a second at the hardest point.');
        if (adj?.unilateral)
          extraNotes.push('One side at a time.');
        const blockNote = variationFor(pe.exerciseId, plan, bench);

        steps.push({
          kind: 'set',
          set: {
            slot: pe.slot,
            group,
            exercise: ex,
            setNumber,
            totalSets,
            reps: eff.seconds ? eff.reps : range,
            seconds: eff.seconds ? range : undefined,
            perSide: eff.perSide || (adj?.unilateral ?? false),
            suggestedWeight: weight,
            weightStyle: eff.weightStyle,
            expectedReps,
            targetRpe: plan.targetRpe,
            // The C group keeps a controlled tempo; the slow lowering and
            // pauses in blocks 3 and 4 apply to the A and B groups (§7).
            // A tempo step she has taken herself applies wherever she took it.
            tempo: adj?.tempo
              ? '3 seconds down'
              : group === 'C'
                ? 'Controlled, about 2 seconds down'
                : plan.tempo,
            variationNote:
              [blockNote, ...extraNotes].filter(Boolean).join(' ') || undefined,
            lastTime: reset ? null : formatLastTime(last, eff.weightStyle),
          },
        });
      }

      // Rest after each round of the group. Inside the group there is no rest
      // — that is what makes it a superset — so the rest step only appears
      // here, once the whole group has been through.
      const isLastRoundOfLastGroup = group === 'C' && setNumber === totalSets;

      if (!isLastRoundOfLastGroup) {
        const nextIsSameGroup = setNumber < totalSets;
        const nextLabel = nextIsSameGroup
          ? `${resolveExercise(inGroup[0].exerciseId, bench).name} · set ${setNumber + 1} of ${totalSets}`
          : 'Next pair';
        steps.push({ kind: 'rest', seconds: plan.rest, nextLabel });
      }
    }
  }

  steps.push({ kind: 'bike', plan: bikeFinisher(day.id, week) });
  steps.push({ kind: 'cooldown' });
  steps.push({ kind: 'summary' });

  return steps;
}

/* --- progress through the session --------------------------------------- */

/** How many working sets the session contains, for the progress bar. */
export function countSets(steps: Step[]): number {
  return steps.filter((s) => s.kind === 'set').length;
}

export function setsCompletedBefore(steps: Step[], index: number): number {
  return steps.slice(0, index).filter((s) => s.kind === 'set').length;
}
