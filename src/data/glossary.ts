/* ==========================================================================
   THE LANGUAGE — every term a beginner might not know.

   Taken from page 3 of the programme ("The Language - Every Term Defined"),
   reworded only for screen-reading brevity. A few terms the PDF uses without
   defining (RDL, rep range, ramp-up set, superset partner letters) are added
   here, marked  addedByApp: true.

   RULE: any term in this list, wherever it appears in the app, is tappable
   and explains itself in place — the first time and every time. There is no
   glossary page, because nobody visits glossary pages.
   ========================================================================== */

export type Term = {
  /** The word as shown. */
  term: string;
  /** One sentence. If she reads only this, she can carry on. */
  short: string;
  /** Optional second paragraph for when she wants the whole answer. */
  more?: string;
  /** True if this term was not defined in the PDF and we added it. */
  addedByApp?: boolean;
};

export const GLOSSARY: Record<string, Term> = {
  rep: {
    term: 'Rep',
    short: 'One complete go at an exercise — lowering and lifting once.',
  },

  set: {
    term: 'Set',
    short: 'A group of reps done back to back, then you rest.',
    more: '"3 × 8–12" means three sets of somewhere between 8 and 12 reps.',
  },

  'rep range': {
    term: 'Rep range',
    short: 'The window you are aiming for, like 8 to 12 reps.',
    more:
      'Anywhere in the window counts. Getting to the top of it on every set is the signal that the exercise is ready to get harder.',
    addedByApp: true,
  },

  rest: {
    term: 'Rest',
    short: 'Time doing nothing between sets.',
    more:
      'Rest is part of the training, not a break from it — it is what lets you lift properly on the next set.',
  },

  rpe: {
    term: 'Effort (RPE)',
    short: 'How hard a set felt, on a scale of 1 to 10.',
    more:
      'RPE stands for Rate of Perceived Exertion. 6 means you could have done about 4 more reps, 7 means 3 more, 8 means 2 more. You should almost never hit 10 — total failure — in this programme. This app asks you in plain words instead of asking for a number.',
  },

  superset: {
    term: 'Superset',
    short: 'Two exercises done back to back with no rest, then you rest.',
    more:
      'A1, then straight into A2, then rest, then repeat. It is how a full-body session fits into 40 minutes. The letter is the pair, the number is the order.',
  },

  tempo: {
    term: 'Tempo',
    short: 'The speed of a rep.',
    more:
      '"3 seconds down" means take three full seconds to lower the weight. Slow lowering makes a light dumbbell feel heavy — it is one of your main ways of making an exercise harder without a bigger dumbbell.',
  },

  hinge: {
    term: 'Hinge',
    short: 'Bending at the hips with a flat back, rather than squatting down.',
    more:
      'Knees stay softly bent and the hips do the moving. The Romanian deadlift and the hip thrust are hinges.',
  },

  unilateral: {
    term: 'Unilateral',
    short: 'One side at a time — one arm or one leg.',
    more:
      'It doubles how hard the working side is working, without needing a heavier dumbbell.',
  },

  rom: {
    term: 'Range of motion',
    short: 'How far the weight travels.',
    more: 'Full range beats a heavier weight moved halfway, every time.',
  },

  'double progression': {
    term: 'Double progression',
    short: 'Add reps first, then add weight.',
    more:
      'You work up to the top of the rep range, and only then make the exercise harder — and then you start back near the bottom of the range and climb again.',
  },

  deload: {
    term: 'Deload',
    short: 'A deliberately easy week that lets tiredness drain away.',
    more:
      'Week 7 is a planned deload. It is meant to feel too easy — that is the point. You come back into weeks 8 and 9 fresh, and set new bests.',
  },

  block: {
    term: 'Block',
    short: 'A three-week chunk of the programme.',
    more:
      'There are four blocks. The exercises stay almost the same throughout — what changes each block is how hard each one is made to feel.',
  },

  'working set': {
    term: 'Working set',
    short: 'A set that counts, done at the target effort.',
    more: 'Warm-up and ramp-up sets do not count and are not logged.',
  },

  'ramp-up set': {
    term: 'Ramp-up set',
    short:
      'One easy set of 8 with a lighter weight, before your first real set.',
    more:
      'It does not count as a working set and does not get logged. It just makes sure your first proper set is training, not warming up.',
    addedByApp: true,
  },

  rdl: {
    term: 'RDL',
    short: 'Romanian deadlift — a hinge, not a squat.',
    more:
      'You push your hips back with the dumbbells sliding down the front of your thighs, keeping your back flat, then stand back up. It works the back of your legs and your glutes.',
    addedByApp: true,
  },
};

/** Look a term up leniently — case and spacing shouldn't matter at the call site. */
export function lookUp(key: string): Term | undefined {
  return GLOSSARY[key.trim().toLowerCase()];
}
