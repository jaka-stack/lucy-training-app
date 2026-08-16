/* ==========================================================================
   Checks on the parts where a bug is invisible but consequential: the block
   engine and the kit adaptation. A wrong colour is obvious; the wrong number
   of sets in week 8 is not.

   Run with:  npm test
   ========================================================================== */

import { buildSession, snapToOwned, nextDumbbellUp } from './engine';
import {
  DAY_1,
  DAY_2,
  DAY_3,
  DAYS,
  planForWeek,
  bikeFinisher,
} from '../data/programme';
import { progressionOffers, hasEarnedProgression } from './progression';
import type { Adjustments, Equipment, SessionRecord, SetRecord } from './types';

let failures = 0;
let checks = 0;

function check(label: string, actual: unknown, expected: unknown) {
  checks++;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.error(`FAIL  ${label}\n        expected ${e}\n        got      ${a}`);
  }
}

function ok(label: string, condition: boolean) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`FAIL  ${label}`);
  }
}

const fullKit: Equipment = {
  dumbbells: [5, 10, 15, 20],
  hasBench: true,
  benchInclines: true,
  hasBike: true,
};

const noBenchNoBike: Equipment = {
  dumbbells: [4, 8, 12],
  hasBench: false,
  benchInclines: false,
  hasBike: false,
};

const noHistory: SessionRecord[] = [];

/* --- the block table, week by week (§7) --------------------------------- */

// Sets on the A pair: 2 in wk1, 3 in wk2-6, 2 in wk7 (deload), 3 in wk8-9,
// 4 in wk10-12.
const expectedSetsA = [2, 3, 3, 3, 3, 3, 2, 3, 3, 4, 4, 4];
const expectedSetsC = [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2];
const expectedRest = [90, 90, 90, 75, 75, 75, 90, 60, 60, 60, 60, 60];

for (let w = 1; w <= 12; w++) {
  const p = planForWeek(w);
  check(`week ${w} A-pair sets`, p.setsA, expectedSetsA[w - 1]);
  check(`week ${w} C-pair sets`, p.setsC, expectedSetsC[w - 1]);
  check(`week ${w} rest`, p.rest, expectedRest[w - 1]);
}

check('week 7 is the deload', planForWeek(7).isDeload, true);
ok('no other week is a deload', [1,2,3,4,5,6,8,9,10,11,12].every((w) => !planForWeek(w).isDeload));
check('week 12 is the retest week', planForWeek(12).isRetestWeek, true);
check('week 7 effort target drops to 5', planForWeek(7).targetRpe, [5, 5]);
check('week 10 effort target is 8', planForWeek(10).targetRpe, [8, 8]);

// Blocks fall on the right weeks.
check('block boundaries', [1, 3, 4, 6, 7, 9, 10, 12].map((w) => planForWeek(w).block), [1, 1, 2, 2, 3, 3, 4, 4]);

/* --- the bike plan (§8) -------------------------------------------------- */

check('no finisher in block 1', bikeFinisher('day1',2).kind, 'none');
check('no finisher in the deload week', bikeFinisher('day1',7).kind, 'none');

const b2 = bikeFinisher('day1',5);
ok('block 2 intervals are 30/60 x 4', b2.kind === 'intervals' && b2.hardSeconds === 30 && b2.easySeconds === 60 && b2.rounds === 4);
const b3 = bikeFinisher('day1',9);
ok('block 3 intervals are 40/60 x 5', b3.kind === 'intervals' && b3.hardSeconds === 40 && b3.rounds === 5);
const b4 = bikeFinisher('day1',11);
ok('block 4 intervals are 45/60 x 6', b4.kind === 'intervals' && b4.hardSeconds === 45 && b4.rounds === 6);

/* --- the shape of a built session ---------------------------------------- */

{
  const steps = buildSession(DAY_1, 1, fullKit, noHistory);
  const sets = steps.filter((s) => s.kind === 'set');

  // Week 1: A pair 2 sets x 2 exercises, B pair 2 x 2, C pair 2 x 2 = 12.
  check('week 1 total working sets', sets.length, 12);

  ok('session starts with the warm-up', steps[0].kind === 'warmup');
  ok('a ramp-up set comes before the first working set', steps[1].kind === 'rampup');
  ok('session ends with the summary', steps[steps.length - 1].kind === 'summary');
  ok('the bike comes before the cool-down',
    steps.findIndex((s) => s.kind === 'bike') < steps.findIndex((s) => s.kind === 'cooldown'));

  // The superset rule: inside a pair there is NO rest step between A1 and A2.
  const firstA1 = steps.findIndex((s) => s.kind === 'set' && s.set.slot === 'A1');
  ok('A2 follows A1 with no rest in between',
    steps[firstA1 + 1].kind === 'set' && (steps[firstA1 + 1] as { set: { slot: string } }).set.slot === 'A2');
  ok('a rest follows the pair', steps[firstA1 + 2].kind === 'rest');
}

{
  // Week 10: A pair 4 sets, B pair 3, C pair 2.
  const steps = buildSession(DAY_1, 10, fullKit, noHistory);
  const sets = steps.filter((s) => s.kind === 'set');
  check('week 10 total working sets', sets.length, 4 * 2 + 3 * 2 + 2 * 2);
}

{
  // Week 7 deload: A and B 2 sets, C 1 set.
  const steps = buildSession(DAY_1, 7, fullKit, noHistory);
  const sets = steps.filter((s) => s.kind === 'set');
  check('week 7 total working sets', sets.length, 2 * 2 + 2 * 2 + 1 * 2);
  ok('week 7 has no bike intervals',
    steps.some((s) => s.kind === 'bike' && s.plan.kind === 'none'));
}

/* --- adapting to the kit she actually owns ------------------------------- */

check('snap picks the heaviest at or below the target', snapToOwned(15, [4, 8, 12]), 12);
check('snap falls back to the lightest owned', snapToOwned(3, [4, 8, 12]), 4);
check('snap takes an exact match', snapToOwned(8, [4, 8, 12]), 8);
check('snap on an empty rack', snapToOwned(10, []), null);
check('next dumbbell up', nextDumbbellUp(8, [4, 8, 12]), 12);
check('no dumbbell above the heaviest', nextDumbbellUp(12, [4, 8, 12]), null);

{
  // Someone with no bench and a different rack should get a complete session,
  // not gaps.
  const steps = buildSession(DAY_1, 1, noBenchNoBike, noHistory);
  const sets = steps.filter((s) => s.kind === 'set');
  check('no-bench session still has every set', sets.length, 12);

  const weights = sets
    .map((s) => (s.kind === 'set' ? s.set.suggestedWeight : null))
    .filter((w): w is number => w !== null);
  ok('never suggests a dumbbell she does not own',
    weights.every((w) => noBenchNoBike.dumbbells.includes(w)));

  const names = sets.map((s) => (s.kind === 'set' ? s.set.exercise.name : ''));
  ok('the shoulder press is swapped for the standing version',
    names.some((n) => n === 'Standing shoulder press'));
  ok('no set is left without a name', names.every((n) => n.length > 0));

  const substitutions = sets.filter(
    (s) => s.kind === 'set' && s.set.exercise.substitutionNote,
  );
  ok('substitutions explain themselves', substitutions.length > 0);
}

/* --- weights follow what she actually lifted ----------------------------- */

{
  const history: SessionRecord[] = [
    {
      id: 'x',
      dayId: 'day1',
      week: 1,
      finishedAt: new Date().toISOString(),
      bike: 'none',
      sets: [
        { exerciseId: 'goblet-squat', slot: 'A1', setNumber: 1, reps: 12, weight: 20, rpe: 6, effortLabel: 'Moderate' },
        { exerciseId: 'goblet-squat', slot: 'A1', setNumber: 2, reps: 11, weight: 20, rpe: 7, effortLabel: 'Hard' },
      ],
    },
  ];

  const steps = buildSession(DAY_1, 2, fullKit, history);
  const squat = steps.find((s) => s.kind === 'set' && s.set.exercise.id === 'goblet-squat');
  ok('carries forward the weight she actually used',
    squat?.kind === 'set' && squat.set.suggestedWeight === 20);
  ok('pre-fills reps from last time, not the bottom of the range',
    squat?.kind === 'set' && squat.set.expectedReps === 12);
  ok('shows what she did last time',
    squat?.kind === 'set' && squat.set.lastTime === '20 kg — 12, 11');
}

/* --- block changes reach the set ----------------------------------------- */

{
  const w2 = buildSession(DAY_1, 2, fullKit, noHistory);
  const rdl2 = w2.find((s) => s.kind === 'set' && s.set.exercise.id === 'db-rdl');
  ok('RDL starts at 10 kg in block 1',
    rdl2?.kind === 'set' && rdl2.set.suggestedWeight === 10);

  const w5 = buildSession(DAY_1, 5, fullKit, noHistory);
  const rdl5 = w5.find((s) => s.kind === 'set' && s.set.exercise.id === 'db-rdl');
  ok('RDL moves to 15 kg in block 2',
    rdl5?.kind === 'set' && rdl5.set.suggestedWeight === 15);

  const w11 = buildSession(DAY_1, 11, fullKit, noHistory);
  const squat11 = w11.find((s) => s.kind === 'set' && s.set.exercise.id === 'goblet-squat');
  ok('block 4 adds the pause to the squat',
    squat11?.kind === 'set' && (squat11.set.variationNote ?? '').includes('Pause'));
  ok('block 4 tempo reaches the A pair',
    squat11?.kind === 'set' && squat11.set.tempo.includes('3 seconds'));

  const cSet11 = w11.find((s) => s.kind === 'set' && s.set.group === 'C');
  ok('the C pair keeps a normal tempo even in block 4',
    cSet11?.kind === 'set' && cSet11.set.tempo.includes('2 seconds'));

  const w8 = buildSession(DAY_1, 8, fullKit, noHistory);
  const push8 = w8.find((s) => s.kind === 'set' && s.set.exercise.id === 'incline-pushup');
  ok('block 3 offers the floor push-up progression',
    push8?.kind === 'set' && (push8.set.variationNote ?? '').includes('floor'));

  // The deload must not carry block 3's slow tempo or variations.
  const w7 = buildSession(DAY_1, 7, fullKit, noHistory);
  const push7 = w7.find((s) => s.kind === 'set' && s.set.exercise.id === 'incline-pushup');
  ok('the deload week drops the harder variations',
    push7?.kind === 'set' && push7.set.variationNote === undefined);
}

/* --- Days 2 and 3 -------------------------------------------------------- */

{
  // Every day builds a complete session on every kit, in every week.
  for (const day of DAYS) {
    for (const kit of [fullKit, noBenchNoBike]) {
      for (const week of [1, 4, 7, 10, 12]) {
        const steps = buildSession(day, week, kit, noHistory);
        const sets = steps.filter((s) => s.kind === 'set');
        ok(`${day.id} week ${week} has sets`, sets.length > 0);
        ok(
          `${day.id} week ${week} never names a dumbbell she lacks`,
          sets.every(
            (s) =>
              s.kind !== 'set' ||
              s.set.suggestedWeight === null ||
              kit.dumbbells.includes(s.set.suggestedWeight),
          ),
        );
        ok(
          `${day.id} week ${week} every exercise has a name and a cue`,
          sets.every(
            (s) =>
              s.kind === 'set' &&
              s.set.exercise.name.length > 0 &&
              s.set.exercise.cue.length > 0,
          ),
        );
      }
    }
  }
}

{
  // Day 3's last group is a tri-set: three exercises back to back, one rest.
  const steps = buildSession(DAY_3, 2, fullKit, noHistory);
  const firstC = steps.findIndex((s) => s.kind === 'set' && s.set.group === 'C');
  ok('Day 3 runs three C exercises back to back',
    steps[firstC].kind === 'set' &&
    steps[firstC + 1].kind === 'set' &&
    steps[firstC + 2].kind === 'set');
  check('Day 3 C group is three exercises',
    DAY_3.exercises.filter((e) => e.group === 'C').length, 3);
}

{
  // Planks are timed, not counted.
  const steps = buildSession(DAY_3, 2, fullKit, noHistory);
  const plank = steps.find((s) => s.kind === 'set' && s.set.exercise.id === 'front-plank');
  ok('the front plank is measured in seconds',
    plank?.kind === 'set' && plank.set.seconds !== undefined);
  ok('the plank pre-fills from the bottom of its time range',
    plank?.kind === 'set' && plank.set.expectedReps === 20);

  const side = buildSession(DAY_2, 2, fullKit, noHistory)
    .find((s) => s.kind === 'set' && s.set.exercise.id === 'side-plank');
  ok('the side plank is timed and per side',
    side?.kind === 'set' && side.set.seconds !== undefined && side.set.perSide);
}

{
  // Day 2's finisher is a steady ride, not intervals.
  check('Day 2 block 2 finisher is steady', bikeFinisher('day2', 5).kind, 'steady');
  check('Day 1 block 2 finisher is intervals', bikeFinisher('day1', 5).kind, 'intervals');
  check('Day 2 has no finisher in block 1', bikeFinisher('day2', 2).kind, 'none');
  check('Day 2 has no finisher in the deload', bikeFinisher('day2', 7).kind, 'none');
}

{
  // Block 4 turns the hip thrust single-leg and drops the weight right down.
  const w11 = buildSession(DAY_2, 11, fullKit, noHistory);
  const ht = w11.find((s) => s.kind === 'set' && s.set.exercise.id === 'hip-thrust');
  ok('block 4 hip thrust is one leg at a time',
    ht?.kind === 'set' && ht.set.perSide === true);
  ok('block 4 hip thrust drops to a light weight',
    ht?.kind === 'set' && (ht.set.suggestedWeight ?? 0) <= 5);
  check('block 4 hip thrust reps', ht?.kind === 'set' ? ht.set.reps : null, [10, 12]);

  // Block 3 raises its reps instead.
  const w9 = buildSession(DAY_2, 9, fullKit, noHistory);
  const ht9 = w9.find((s) => s.kind === 'set' && s.set.exercise.id === 'hip-thrust');
  check('block 3 hip thrust reps', ht9?.kind === 'set' ? ht9.set.reps : null, [15, 20]);

  // The deload uses the block 2 version, not block 3's harder one.
  const w7 = buildSession(DAY_2, 7, fullKit, noHistory);
  const ht7 = w7.find((s) => s.kind === 'set' && s.set.exercise.id === 'hip-thrust');
  check('deload hip thrust uses the block 2 version',
    ht7?.kind === 'set' ? ht7.set.reps : null, [12, 15]);
}

{
  // A flat bench should give the flat-bench version, not the floor version.
  const flat: Equipment = { dumbbells: [5, 10], hasBench: true, benchInclines: false, hasBike: true };
  const steps = buildSession(DAY_3, 2, flat, noHistory);
  const row = steps.find((s) => s.kind === 'set' && s.set.exercise.id === 'chest-supported-row');
  ok('a flat bench swaps the chest-supported row for the bent-over version',
    row?.kind === 'set' && row.set.exercise.name === 'Bent-over row');
  ok('and explains the swap',
    row?.kind === 'set' && !!row.set.exercise.substitutionNote);

  const incline: Equipment = { ...flat, benchInclines: true };
  const row2 = buildSession(DAY_3, 2, incline, noHistory)
    .find((s) => s.kind === 'set' && s.set.exercise.id === 'chest-supported-row');
  ok('an adjustable bench keeps the prescribed version',
    row2?.kind === 'set' && row2.set.exercise.name === 'Chest-supported row'
      && !row2.set.exercise.substitutionNote);

  const press = buildSession(DAY_2, 2, flat, noHistory)
    .find((s) => s.kind === 'set' && s.set.exercise.id === 'incline-press');
  ok('a flat bench gives the flat press, not the floor press',
    press?.kind === 'set' && press.set.exercise.name === 'Flat dumbbell press');

  const pressNoBench = buildSession(DAY_2, 2, noBenchNoBike, noHistory)
    .find((s) => s.kind === 'set' && s.set.exercise.id === 'incline-press');
  ok('no bench gives the floor press',
    pressNoBench?.kind === 'set' && pressNoBench.set.exercise.name === 'Floor press');
}

/* --- the progression rule ------------------------------------------------ */

/** Build a session record where an exercise was done at the given reps/rpe. */
function sessionWith(
  week: number,
  dayId: string,
  exerciseId: string,
  reps: number[],
  rpe: number,
  weight: number | null,
): SessionRecord {
  const sets: SetRecord[] = reps.map((r, i) => ({
    exerciseId,
    slot: 'A1',
    setNumber: i + 1,
    reps: r,
    weight,
    rpe,
    effortLabel: 'Moderate',
  }));
  return {
    id: `${dayId}-${week}-${Math.random()}`,
    dayId,
    week,
    finishedAt: new Date().toISOString(),
    sets,
    bike: 'none',
  };
}

const squat = DAY_1.exercises.find((e) => e.exerciseId === 'goblet-squat')!;

{
  // One qualifying session is not enough — the rule needs two in a row.
  const one = [sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 6, 15)];
  ok('one good session does not trigger it',
    !hasEarnedProgression(squat, DAY_1, one));

  const two = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
  ];
  ok('two good sessions in a row trigger it',
    hasEarnedProgression(squat, DAY_1, two));

  // Short of the top of the range on one set is not a qualifying session.
  const short = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 11], 6, 15),
  ];
  ok('missing the top of the range on one set does not qualify',
    !hasEarnedProgression(squat, DAY_1, short));

  // At the top of the range but over the target effort is not qualifying —
  // it means the weight is already hard enough.
  const tooHard = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 9, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 12], 9, 15),
  ];
  ok('hitting the reps but above target effort does not qualify',
    !hasEarnedProgression(squat, DAY_1, tooHard));

  // Fewer sets than prescribed is not a qualifying session.
  const shortSets = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12], 6, 15),
  ];
  ok('stopping early does not qualify',
    !hasEarnedProgression(squat, DAY_1, shortSets));
}

{
  // The deload must be neutral: it neither qualifies nor breaks the run.
  const acrossDeload = [
    sessionWith(6, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
    sessionWith(7, 'day1', 'goblet-squat', [8, 8], 5, 10),   // the easy week
    sessionWith(8, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
  ];
  ok('the deload week does not break the run',
    hasEarnedProgression(squat, DAY_1, acrossDeload));
}

{
  // Choosing the rung. With 5 kg gaps on a 15 kg lift the jump is 33%, so the
  // ladder should NOT reach for the next dumbbell.
  const history = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
  ];
  const offers = progressionOffers(DAY_1, fullKit, history, {}, (id) => id);
  check('one offer at a time', offers.length, 1);
  check('a 5 kg jump on 15 kg is too big, so reps come first',
    offers[0].step, 'reps');

  // With 2.5 kg increments the same lift should just add weight.
  const fineKit: Equipment = {
    dumbbells: [10, 12.5, 15, 17.5, 20],
    hasBench: true, benchInclines: true, hasBike: true,
  };
  const fineOffers = progressionOffers(DAY_1, fineKit, history, {}, (id) => id);
  check('a small jump is taken as weight', fineOffers[0].step, 'weight');
  check('and names the next dumbbell', fineOffers[0].newWeight, 17.5);
}

{
  // The ladder walks on rather than repeating a rung.
  const history = [
    sessionWith(2, 'day1', 'goblet-squat', [17, 17, 17], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [17, 17, 17], 6, 15),
  ];
  const withReps: Record<string, Adjustments> = {
    'goblet-squat': { bonusReps: 5 },
  };
  const offers = progressionOffers(DAY_1, fullKit, history, withReps, (id) => id);
  check('after extra reps, the next rung is tempo', offers[0].step, 'tempo');

  const withTempo: Record<string, Adjustments> = {
    'goblet-squat': { bonusReps: 5, tempo: true },
  };
  check('after tempo comes the pause',
    progressionOffers(DAY_1, fullKit, history, withTempo, (id) => id)[0].step,
    'pause');
}

{
  // Bodyweight exercises cannot take the weight rung at all.
  const pushup = DAY_1.exercises.find((e) => e.exerciseId === 'incline-pushup')!;
  const history = [
    sessionWith(2, 'day1', 'incline-pushup', [12, 12, 12], 6, null),
    sessionWith(3, 'day1', 'incline-pushup', [12, 12, 12], 6, null),
  ];
  ok('a bodyweight exercise can still earn a step',
    hasEarnedProgression(pushup, DAY_1, history));
  const offers = progressionOffers(DAY_1, fullKit, history, {}, (id) => id);
  ok('and is never told to pick up a heavier dumbbell',
    offers.length > 0 && offers[0].step !== 'weight');
}

{
  // "Not yet" is respected until there is new evidence.
  const history = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
  ];
  const declined: Record<string, Adjustments> = {
    'goblet-squat': { declinedAt: history.length },
  };
  check('declining stops it asking again straight away',
    progressionOffers(DAY_1, fullKit, history, declined, (id) => id).length, 0);
}

{
  // Accepting a weight step feeds through into the next session.
  const history = [
    sessionWith(2, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
  ];
  const adj: Record<string, Adjustments> = { 'goblet-squat': { targetWeight: 20 } };
  const steps = buildSession(DAY_1, 4, fullKit, history, adj);
  const s = steps.find((x) => x.kind === 'set' && x.set.exercise.id === 'goblet-squat');
  ok('the agreed heavier dumbbell is what gets suggested',
    s?.kind === 'set' && s.set.suggestedWeight === 20);
  ok('and the reps drop back to the bottom of the range',
    s?.kind === 'set' && s.set.expectedReps === 8);

  // The extra-set rung is capped at 4 working sets.
  const capped = buildSession(DAY_1, 11, fullKit, noHistory, {
    'goblet-squat': { set: true },
  });
  const a1 = capped.find((x) => x.kind === 'set' && x.set.group === 'A');
  check('sets are capped at 4', a1?.kind === 'set' ? a1.set.totalSets : null, 4);
}

/* --- the week 12 retest -------------------------------------------------- */

{
  const steps = buildSession(DAY_3, 12, fullKit, noHistory);
  const retests = steps.filter((s) => s.kind === 'retest');

  check('the retest has three lifts', retests.length, 3);
  check('and they are the three the programme names',
    retests.map((s) => (s.kind === 'retest' ? s.exerciseId : '')),
    ['goblet-squat', 'one-arm-row', 'seated-shoulder-press']);

  ok('the retest is introduced before it starts',
    steps.findIndex((s) => s.kind === 'retestIntro') <
    steps.findIndex((s) => s.kind === 'retest'));

  // Day 3's arm work still follows, so the last session is not three heavy
  // attempts and a walk home.
  const armSets = steps.filter((s) => s.kind === 'set');
  ok('the arm work still happens', armSets.length > 0);
  ok('and it is only the C group',
    armSets.every((s) => s.kind === 'set' && s.set.group === 'C'));

  // Rest goes back to Block 1 length for the retest (§7).
  const rests = steps.filter((s) => s.kind === 'rest');
  ok('retest rests are back to block 1 length',
    rests.every((s) => s.kind === 'rest' && s.seconds === 90));

  // Only week 12 Day 3 is a retest.
  ok('week 12 day 1 is a normal session',
    !buildSession(DAY_1, 12, fullKit, noHistory).some((s) => s.kind === 'retest'));
  ok('week 11 day 3 is a normal session',
    !buildSession(DAY_3, 11, fullKit, noHistory).some((s) => s.kind === 'retest'));
}

{
  // The retest shows her week 1 numbers for an honest comparison.
  const history = [
    sessionWith(1, 'day1', 'goblet-squat', [10, 10], 6, 15),
    sessionWith(6, 'day1', 'goblet-squat', [12, 12, 12], 7, 20),
  ];
  const steps = buildSession(DAY_3, 12, fullKit, history);
  const squatTest = steps.find(
    (s) => s.kind === 'retest' && s.exerciseId === 'goblet-squat',
  );
  ok('the retest carries her earliest numbers, not her latest',
    squatTest?.kind === 'retest' &&
    squatTest.weekOne?.weight === 15 &&
    squatTest.weekOne?.reps === 10);
}

/* --- weekly averages, never a single day --------------------------------- */

{
  const { weeklySummaries, weekOnWeek } = await import('./checkins');

  const one = weeklySummaries([{ date: '2026-01-01', week: 1, weightKg: 72 }]);
  check('a single reading is not shown as a weekly average',
    one[0].weightKg, undefined);
  check('but it is acknowledged as too few', one[0].weightTooFew, true);

  const two = weeklySummaries([
    { date: '2026-01-01', week: 1, weightKg: 72 },
    { date: '2026-01-03', week: 1, weightKg: 71 },
  ]);
  check('two readings average', two[0].weightKg, 71.5);

  const across = weeklySummaries([
    { date: '2026-01-01', week: 1, weightKg: 72 },
    { date: '2026-01-03', week: 1, weightKg: 71 },
    { date: '2026-01-08', week: 2, weightKg: 71 },
    { date: '2026-01-10', week: 2, weightKg: 70 },
  ]);
  check('weeks are summarised separately', across.length, 2);

  const change = weekOnWeek([
    { date: '2026-01-01', week: 1, weightKg: 72 },
    { date: '2026-01-03', week: 1, weightKg: 71 },
    { date: '2026-01-08', week: 2, weightKg: 71 },
    { date: '2026-01-10', week: 2, weightKg: 70 },
  ]);
  check('week-on-week compares averages', change?.change, -1);
  check('a single week gives no comparison',
    weekOnWeek([{ date: '2026-01-01', week: 1, weightKg: 72 }]), null);
}

/* --- backup round-trip ---------------------------------------------------- */

{
  const { parseBackup } = await import('./storage');

  const state = {
    settings: {
      equipment: fullKit,
      startedOn: new Date().toISOString(),
      cues: true,
    },
    currentWeek: 5,
    history: [sessionWith(4, 'day1', 'goblet-squat', [10, 10, 10], 7, 15)],
    inProgress: null,
    adjustments: { 'goblet-squat': { bonusReps: 5 } },
    checkIns: [],
  };

  const file = JSON.stringify({
    marker: 'trainer-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  });

  const restored = parseBackup(file);
  ok('a backup file restores', restored.ok);
  if (restored.ok) {
    check('history survives the round trip', restored.state.history.length, 1);
    check('the week survives', restored.state.currentWeek, 5);
    check('ladder steps survive',
      restored.state.adjustments['goblet-squat'].bonusReps, 5);
    check('a stale half-finished session is not restored',
      restored.state.inProgress, null);
  }

  ok('a file from somewhere else is refused',
    !parseBackup('{"hello":"world"}').ok);
  ok('nonsense is refused', !parseBackup('not json at all').ok);
}

/* --- progress -------------------------------------------------------------- */

{
  const { exerciseProgress, daysSinceLastSession } = await import('./progress');

  const history = [
    sessionWith(1, 'day1', 'goblet-squat', [8, 8, 8], 6, 15),
    sessionWith(6, 'day1', 'goblet-squat', [12, 12, 12], 7, 20),
  ];
  const p = exerciseProgress(history).find((x) => x.exerciseId === 'goblet-squat');
  ok('progress spots a real improvement', p?.improved === true);
  ok('and describes it in plain numbers',
    (p?.sentence ?? '').includes('15') && (p?.sentence ?? '').includes('20'));

  // One session is not a comparison.
  const single = [sessionWith(1, 'day1', 'goblet-squat', [8, 8, 8], 6, 15)];
  check('one session shows nothing', exerciseProgress(single).length, 0);

  // Same weight, more reps, still counts.
  const reps = [
    sessionWith(1, 'day1', 'goblet-squat', [8, 8, 8], 6, 15),
    sessionWith(3, 'day1', 'goblet-squat', [12, 12, 12], 6, 15),
  ];
  ok('more reps at the same weight counts as progress',
    exerciseProgress(reps)[0].improved === true);

  check('no history means no "days since"', daysSinceLastSession([]), null);
}

/* --- week and day completion --------------------------------------------- */

{
  const { isWeekComplete, completedWeeks, doneDayIds } = await import('./progress');

  const mk = (week: number, dayId: string): SessionRecord => ({
    id: dayId + week,
    dayId,
    week,
    finishedAt: new Date().toISOString(),
    bike: 'none',
    sets: [
      { exerciseId: 'goblet-squat', slot: 'A1', setNumber: 1, reps: 10, weight: 15, rpe: 6, effortLabel: 'Moderate' },
    ],
  });

  const partial = [mk(1, 'day1'), mk(1, 'day2')];
  ok('two of three days is not a finished week', !isWeekComplete(partial, 1));
  check('and it knows which two', doneDayIds(partial, 1).size, 2);

  const full = [...partial, mk(1, 'day3')];
  ok('all three days finishes the week', isWeekComplete(full, 1));

  // The same day logged twice does not finish a week on its own.
  const repeated = [mk(2, 'day1'), mk(2, 'day1'), mk(2, 'day1')];
  ok('the same session three times is not a finished week',
    !isWeekComplete(repeated, 2));

  const mixed = [...full, mk(2, 'day1'), mk(2, 'day2'), mk(2, 'day3'), mk(3, 'day1')];
  check('completed weeks are counted across the programme',
    [...completedWeeks(mixed)].sort((a, b) => a - b), [1, 2]);
  check('no history means no completed weeks', completedWeeks([]).size, 0);
}

/* --- every jargon term on screen has a definition ------------------------ */

/* The requirement is that any term a beginner would not know explains itself
   in one tap, wherever it appears. A <Term k="..."> whose key is missing from
   the glossary degrades to plain text — correct behaviour mid-set, but it
   means the explanation has silently gone. This catches that at build time
   instead of on her phone. */
{
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { GLOSSARY } = await import('../data/glossary');

  const files: string[] = [];
  (function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      // Test files are skipped — this file discusses <Term k="..."> in its
      // own comments, and would otherwise report itself.
      else if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) files.push(p);
    }
  })(join(import.meta.dirname, '..'));

  const used = new Set<string>();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/<Term\s+k="([^"]+)"/g)) used.add(m[1]);
  }

  ok('the app actually uses jargon terms', used.size > 0);

  const undefinedTerms = [...used].filter(
    (k) => !(k.trim().toLowerCase() in GLOSSARY),
  );
  check('every term used on screen has a definition', undefinedTerms, []);
}

/* ------------------------------------------------------------------------- */

if (failures > 0) {
  // Throwing (rather than process.exit) keeps this file free of Node types,
  // so it typechecks under the same browser config as the rest of the app.
  // A thrown error still gives npm a non-zero exit code.
  throw new Error(`${failures} of ${checks} checks FAILED`);
}
console.log(`All ${checks} checks passed.`);
