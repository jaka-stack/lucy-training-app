import {
  bikeFinisherForWeek,
  planForWeek,
  type BikePlan,
  type Day,
  type PrescribedExercise,
  type WeekPlan,
} from '../data/programme';
import { resolveExercise, type ResolvedExercise } from '../data/exercises';
import type { Equipment, SessionRecord } from './types';

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
  perSide: boolean;
  /** kg, or null for bodyweight. */
  suggestedWeight: number | null;
  weightStyle: 'one' | 'pair' | 'none';
  /** Pre-filled rep count — usually exactly what she will do. */
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

function suggestWeight(
  pe: PrescribedExercise,
  plan: WeekPlan,
  equipment: Equipment,
  history: SessionRecord[],
): number | null {
  if (pe.weightStyle === 'none') return null;

  // What she actually lifted last time beats anything the page says.
  const last = lastPerformanceFor(pe.exerciseId, history);
  if (last && last.weight !== null) return last.weight;

  // Otherwise the programme's number for this block, snapped to her kit.
  // Block 1 always uses the day page's starting weight; blocks 2-4 may name
  // their own in the block table.
  const blockSpecific =
    plan.block === 1 ? undefined : pe.blockWeight?.[plan.block];
  const prescribed = blockSpecific ?? pe.startWeight;
  if (prescribed === null) return null;
  return snapToOwned(prescribed, equipment.dumbbells);
}

/* --- block-specific changes to how a movement is performed --------------- */

/* From the block table (§7). These are changes to the exercise itself, over
   and above the tempo and set changes that apply to everything. */
function variationFor(exerciseId: string, plan: WeekPlan): string | undefined {
  if (plan.isDeload) return undefined; // week 7 changes nothing but volume

  if (exerciseId === 'incline-pushup') {
    if (plan.block === 3)
      return 'If you can do 12 clean reps with your hands on the bench, move them to the floor this block.';
    if (plan.block === 4)
      return 'Floor push-ups now, 3 seconds down. If your hips sag on the floor, go back to the bench — form is the ceiling.';
  }

  if (exerciseId === 'goblet-squat' && plan.block === 4)
    return 'Pause for a full second at the bottom of every rep.';

  if (exerciseId === 'db-rdl') {
    if (plan.block === 4)
      return 'Pause for a second just below the knee on the way down.';
  }

  if (exerciseId === 'seated-shoulder-press' && plan.block === 4)
    return 'Pause for a second at the bottom, level with your shoulders.';

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

export function buildSession(
  day: Day,
  week: number,
  equipment: Equipment,
  history: SessionRecord[],
): Step[] {
  const plan = planForWeek(week);
  const steps: Step[] = [];

  steps.push({ kind: 'warmup' });

  const groups: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  let isFirstExerciseOfSession = true;

  for (const group of groups) {
    const inGroup = day.exercises.filter((e) => e.group === group);
    if (inGroup.length === 0) continue;

    const totalSets = setsForGroup(group, plan);

    // The ramp-up set, on the first exercise of the session only (§5).
    if (isFirstExerciseOfSession) {
      const first = inGroup[0];
      const ex = resolveExercise(first.exerciseId, equipment.hasBench);
      const working = suggestWeight(first, plan, equipment, history);
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
        const ex = resolveExercise(pe.exerciseId, equipment.hasBench);
        const last = lastPerformanceFor(pe.exerciseId, history);
        const weight = suggestWeight(pe, plan, equipment, history);

        // Pre-fill with what she did for this set last time; otherwise the
        // bottom of the range, because double progression climbs from the
        // bottom (§4).
        const expectedReps =
          last?.repsBySet[setNumber - 1] ?? last?.repsBySet[0] ?? pe.reps[0];

        steps.push({
          kind: 'set',
          set: {
            slot: pe.slot,
            group,
            exercise: ex,
            setNumber,
            totalSets,
            reps: pe.reps,
            perSide: pe.perSide ?? false,
            suggestedWeight: weight,
            weightStyle: pe.weightStyle,
            expectedReps,
            targetRpe: plan.targetRpe,
            // The C pair keeps a controlled tempo; the slow lowering and
            // pauses in blocks 3 and 4 apply to the A and B pairs (§7).
            tempo:
              group === 'C' ? 'Controlled, about 2 seconds down' : plan.tempo,
            variationNote: variationFor(pe.exerciseId, plan),
            lastTime: formatLastTime(last, pe.weightStyle),
          },
        });
      }

      // Rest after each round of the pair. Inside the pair there is no rest —
      // that is what makes it a superset — so the rest step only appears here.
      const isLastRoundOfLastGroup =
        group === 'C' && setNumber === totalSets;

      if (!isLastRoundOfLastGroup) {
        const nextIsSameGroup = setNumber < totalSets;
        const nextLabel = nextIsSameGroup
          ? `${resolveExercise(inGroup[0].exerciseId, equipment.hasBench).name} · set ${setNumber + 1} of ${totalSets}`
          : 'Next pair';
        steps.push({ kind: 'rest', seconds: plan.rest, nextLabel });
      }
    }
  }

  steps.push({ kind: 'bike', plan: bikeFinisherForWeek(week) });
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
