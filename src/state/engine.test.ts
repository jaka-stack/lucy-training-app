/* ==========================================================================
   Checks on the parts where a bug is invisible but consequential: the block
   engine and the kit adaptation. A wrong colour is obvious; the wrong number
   of sets in week 8 is not.

   Run with:  npm test
   ========================================================================== */

import { buildSession, snapToOwned, nextDumbbellUp } from './engine';
import { DAY_1, planForWeek, bikeFinisherForWeek } from '../data/programme';
import type { Equipment, SessionRecord } from './types';

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

check('no finisher in block 1', bikeFinisherForWeek(2).kind, 'none');
check('no finisher in the deload week', bikeFinisherForWeek(7).kind, 'none');

const b2 = bikeFinisherForWeek(5);
ok('block 2 intervals are 30/60 x 4', b2.kind === 'intervals' && b2.hardSeconds === 30 && b2.easySeconds === 60 && b2.rounds === 4);
const b3 = bikeFinisherForWeek(9);
ok('block 3 intervals are 40/60 x 5', b3.kind === 'intervals' && b3.hardSeconds === 40 && b3.rounds === 5);
const b4 = bikeFinisherForWeek(11);
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
