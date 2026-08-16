/* ==========================================================================
   THE EXERCISE LIBRARY

   Every movement, with the cue and the common mistake taken from the
   programme's own pages (§6.1–6.3 and §13). Wording is the PDF's, lightly
   trimmed for screen width. Nothing here changes the training.

   Each exercise also records what equipment it needs and what to do instead
   when that equipment is missing. The substitutions are additions to the PDF
   — it was written for one person with a bench and a bike — and each one is
   noted in DECISIONS.md.
   ========================================================================== */

export type Needs = 'nothing' | 'bench-flat' | 'bench-upright' | 'bench-incline';

export type Exercise = {
  id: string;
  name: string;
  /** Used where space is tight, e.g. the "next up" line. */
  shortName?: string;
  cue: string;
  mistake: string;
  needs: Needs;
  /** What this movement is for, in her terms. Shown on the exercise page. */
  why?: string;
  /**
   * What to do when the bench is missing. Same movement pattern, same muscles,
   * same place in the session — only the set-up changes.
   */
  noBench?: {
    name: string;
    cue: string;
    mistake: string;
    /** Shown plainly so she knows this is a swap and why. */
    note: string;
  };
};

/** The PDF links every exercise name to a YouTube search rather than one
    fixed video, on purpose: individual videos get deleted, and a dead link is
    useless. We keep that behaviour. Needs an internet connection. */
export function videoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `how to ${name} dumbbell form`,
  )}`;
}

export const EXERCISES: Record<string, Exercise> = {
  /* ---- Day 1 ---------------------------------------------------------- */

  'goblet-squat': {
    id: 'goblet-squat',
    name: 'Goblet squat',
    needs: 'nothing',
    why: 'Your main leg exercise. Works the thighs and glutes together, and it is the easiest squat to learn because the weight in front keeps you upright.',
    cue: 'Hold one dumbbell against your chest, sit straight down between your feet, chest tall.',
    mistake:
      'Letting the heels lift and the chest fold forward — keep the weight through your whole foot.',
  },

  'incline-pushup': {
    id: 'incline-pushup',
    name: 'Incline push-up',
    shortName: 'Push-ups',
    needs: 'bench-flat',
    why: 'A push-up made easier by raising your hands. As you get stronger the surface gets lower, until you are on the floor.',
    cue: 'Hands on the bench under your shoulders, body one straight line from ear to ankle.',
    mistake:
      'Hips sagging or bum lifting — squeeze your glutes and brace your stomach the whole set.',
    noBench: {
      name: 'Incline push-up',
      cue: 'Hands on the edge of a sofa, worktop or a stair, under your shoulders. Body one straight line from ear to ankle.',
      mistake:
        'Hips sagging or bum lifting — squeeze your glutes and brace your stomach the whole set.',
      note: 'No bench, so use a sofa arm, a kitchen worktop or a stair. Higher is easier — start higher than you think and come down over the weeks.',
    },
  },

  'db-rdl': {
    id: 'db-rdl',
    name: 'Romanian deadlift',
    shortName: 'RDL',
    needs: 'nothing',
    why: 'The main exercise for the back of your legs and your glutes. This is a hinge, not a squat.',
    cue: 'Push your hips back, dumbbells sliding down the front of your thighs, back flat.',
    mistake:
      'Squatting instead of hinging — the knees stay softly bent, the hips do the moving.',
  },

  'seated-shoulder-press': {
    id: 'seated-shoulder-press',
    name: 'Shoulder press',
    needs: 'bench-upright',
    why: 'Direct shoulder work. Shoulders respond quickly and change the look of your whole upper body.',
    cue: 'Sit tall on the upright bench, press the dumbbells up and slightly together.',
    mistake:
      'Arching the lower back off the bench — ribs down, press with the shoulders not the spine.',
    noBench: {
      name: 'Standing shoulder press',
      cue: 'Stand tall, feet hip-width, squeeze your glutes and stomach, press the dumbbells up and slightly together.',
      mistake:
        'Leaning back to get the weight up — ribs down, and use a lighter dumbbell if you have to lean.',
      note: 'No bench, so this is done standing. Standing is slightly harder because you have to hold yourself steady, so it may take a lighter dumbbell at first. That is expected.',
    },
  },

  'db-glute-bridge': {
    id: 'db-glute-bridge',
    name: 'Glute bridge',
    needs: 'nothing',
    why: 'Direct glute work, done on the floor. One of your priority areas.',
    cue: 'Dumbbell across the hips, drive through your heels, squeeze the glutes at the top.',
    mistake:
      'Pushing the hips up with the lower back — finish with a glute squeeze, not a back arch.',
  },

  'dead-bug': {
    id: 'dead-bug',
    name: 'Dead bug',
    needs: 'nothing',
    why: 'Core strength and better posture. It is here for strength, not for burning belly fat — no exercise does that.',
    cue: 'Lower the opposite arm and leg slowly while your lower back stays glued to the floor.',
    mistake:
      'Letting the back arch away from the floor — shorten the range until it stays flat.',
  },
};

/* ---- warm-up and cool-down movements ----------------------------------- */

export type SimpleMove = {
  id: string;
  name: string;
  /** e.g. "8 slow reps", "30 seconds each side" */
  amount: string;
  /** The PDF's reason. Shown inline — she should know why she is doing it. */
  why: string;
  needsBike?: boolean;
  /** Used when there is no bike. */
  noBike?: { name: string; amount: string; note: string };
};

export const WARM_UP: SimpleMove[] = [
  {
    id: 'wu-bike',
    name: 'Bike, easy',
    amount: '5 minutes',
    why: 'Raises your temperature so the first working set is not the warm-up.',
    needsBike: true,
    noBike: {
      name: 'March, step-ups or a brisk walk',
      amount: '5 minutes',
      note: 'No bike, so anything that gets you warm and breathing a little harder works: marching on the spot, up and down the stairs, or a brisk walk.',
    },
  },
  {
    id: 'wu-cat-cow',
    name: 'Cat-cow',
    amount: '8 slow reps',
    why: 'Wakes up the spine.',
  },
  {
    id: 'wu-glute-bridge',
    name: 'Glute bridge, no weight',
    amount: '10 reps, 1 second squeeze',
    why: 'Switches the glutes on before they have to work.',
  },
  {
    id: 'wu-bw-squat',
    name: 'Bodyweight squat',
    amount: '10 reps',
    why: 'Grooves the squat pattern.',
  },
  {
    id: 'wu-arm-circles',
    name: 'Arm circles and shoulder rolls',
    amount: '10 each direction',
    why: 'Preps the shoulders for pressing.',
  },
  {
    id: 'wu-wgs',
    name: "World's greatest stretch",
    amount: '3 each side',
    why: 'Opens the hips and upper back.',
  },
];

export const COOL_DOWN: SimpleMove[] = [
  {
    id: 'cd-bike',
    name: 'Bike, very easy',
    amount: '3 minutes',
    why: 'Brings the heart rate down gradually.',
    needsBike: true,
    noBike: {
      name: 'Easy walking or marching',
      amount: '3 minutes',
      note: 'No bike, so walk it off gently until your breathing settles.',
    },
  },
  {
    id: 'cd-9090',
    name: '90/90 hip stretch',
    amount: '30 seconds each side',
    why: 'Hips.',
  },
  {
    id: 'cd-hamstring',
    name: 'Standing hamstring stretch',
    amount: '30 seconds each side',
    why: 'Back of the thighs.',
  },
  {
    id: 'cd-chest',
    name: 'Doorway chest stretch',
    amount: '30 seconds each side',
    why: 'Chest and front of the shoulder.',
  },
  {
    id: 'cd-childs-pose',
    name: "Child's pose",
    amount: '45 seconds, slow breathing',
    why: 'Back and shoulders — and it tells your body the session is over.',
  },
];

/* ---- resolving an exercise against the kit she actually has ------------- */

export type ResolvedExercise = {
  id: string;
  name: string;
  shortName?: string;
  cue: string;
  mistake: string;
  why?: string;
  /** Set when this is a substitution, explaining the swap. */
  substitutionNote?: string;
};

export function resolveExercise(
  id: string,
  hasBench: boolean,
): ResolvedExercise {
  const ex = EXERCISES[id];
  if (!ex) throw new Error(`Unknown exercise: ${id}`);

  const needsBench = ex.needs !== 'nothing';

  if (needsBench && !hasBench && ex.noBench) {
    return {
      id: ex.id,
      name: ex.noBench.name,
      shortName: ex.shortName,
      cue: ex.noBench.cue,
      mistake: ex.noBench.mistake,
      why: ex.why,
      substitutionNote: ex.noBench.note,
    };
  }

  return {
    id: ex.id,
    name: ex.name,
    shortName: ex.shortName,
    cue: ex.cue,
    mistake: ex.mistake,
    why: ex.why,
  };
}
