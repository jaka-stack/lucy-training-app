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
  /**
   * For exercises that want an inclined bench when she only has a flat one.
   * A flat bench is usually a better answer than going to the floor, so this
   * is tried before falling back to noBench.
   */
  flatBench?: {
    name: string;
    cue: string;
    mistake: string;
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

  /* ---- Day 2 — Hinge and pull ------------------------------------------ */

  'hip-thrust': {
    id: 'hip-thrust',
    name: 'Hip thrust',
    needs: 'bench-flat',
    why: 'Your biggest glute exercise, and this is your biggest glute day. One of your priority areas.',
    cue: 'Shoulder blades on the bench, chin tucked, drive the hips up to level and squeeze.',
    mistake:
      'Over-extending at the top so the ribs flare — stop when your body is flat, not arched.',
    noBench: {
      name: 'Hip thrust',
      cue: 'Shoulder blades on the edge of a sofa or a low sturdy chair, chin tucked, drive the hips up to level and squeeze.',
      mistake:
        'Over-extending at the top so the ribs flare — stop when your body is flat, not arched.',
      note: 'No bench, so use a sofa edge or a low sturdy chair — about knee height is right. Make sure it cannot slide.',
    },
  },

  'one-arm-row': {
    id: 'one-arm-row',
    name: 'One-arm row',
    needs: 'bench-flat',
    why: 'Back and rear shoulder. A stronger upper back visibly changes how your waist looks, without losing a gram of fat.',
    cue: 'One hand and knee on the bench, pull the dumbbell to your hip, elbow close in.',
    mistake:
      'Twisting the torso to yank the weight up — shoulders stay square to the floor.',
    noBench: {
      name: 'One-arm row',
      cue: 'One hand on a chair seat or sofa, the other foot back, flat back. Pull the dumbbell to your hip, elbow close in.',
      mistake:
        'Twisting the torso to yank the weight up — shoulders stay square to the floor.',
      note: 'No bench, so brace on a chair seat, a sofa or a windowsill — anything solid at about hip height.',
    },
  },

  'reverse-lunge': {
    id: 'reverse-lunge',
    name: 'Reverse lunge',
    needs: 'nothing',
    why: 'Single-leg work for glutes and thighs. Stepping backwards is much kinder on the knees than stepping forwards.',
    cue: 'Step back, drop the back knee towards the floor, then drive through the front heel.',
    mistake:
      'Short steps that turn it into a knee-only movement — step back far enough to feel the front glute.',
  },

  'incline-press': {
    id: 'incline-press',
    name: 'Incline press',
    needs: 'bench-incline',
    why: 'Chest and front of the shoulder. The slope puts more of the work into the upper chest and shoulders.',
    cue: 'Bench at about 30–45 degrees, lower to your upper chest, press up and slightly in.',
    mistake:
      'Flaring the elbows straight out to the sides — keep them at roughly 45 degrees.',
    flatBench: {
      name: 'Flat dumbbell press',
      cue: 'Lie flat on the bench, lower the dumbbells to your chest, press up and slightly in.',
      mistake:
        'Flaring the elbows straight out to the sides — keep them at roughly 45 degrees.',
      note: 'Your bench does not tilt, so this is the flat version. It works the same muscles with slightly less shoulder involvement.',
    },
    noBench: {
      name: 'Floor press',
      cue: 'Lie on your back on the floor, knees bent. Lower until your upper arms touch the floor, then press up.',
      mistake:
        'Bouncing the elbows off the floor — touch lightly and press from there.',
      note: 'No bench, so this is done on the floor. The floor stops your elbows going as low, which is safer for the shoulders and works well.',
    },
  },

  'lateral-raise': {
    id: 'lateral-raise',
    name: 'Lateral raise',
    needs: 'nothing',
    why: 'The exercise that most changes the shape of your shoulders — and wider shoulders make the waist look smaller.',
    cue: 'Slight bend in the elbows, lift out to the sides to shoulder height, lead with the elbows.',
    mistake:
      'Swinging the body to throw the weight up — if you need momentum, cut the range or the reps.',
  },

  'side-plank': {
    id: 'side-plank',
    name: 'Side plank',
    needs: 'nothing',
    why: 'The sides of your midsection. Here for strength and posture — no exercise burns fat off the area it works.',
    cue: 'Stack the shoulder over the elbow, lift the hips so your body makes one straight line.',
    mistake:
      'Hips drifting backwards or sagging — keep the line and stop the set when it breaks.',
  },

  /* ---- Day 3 — Single leg and arms -------------------------------------- */

  'split-squat': {
    id: 'split-squat',
    name: 'Split squat',
    needs: 'nothing',
    why: 'One leg at a time, which doubles the work on the working leg without a heavier dumbbell.',
    cue: 'Feet in a long stride, drop straight down, most of your weight on the front leg.',
    mistake:
      'Feet on the same tightrope line — set them hip-width apart so you can balance.',
  },

  'chest-supported-row': {
    id: 'chest-supported-row',
    name: 'Chest-supported row',
    needs: 'bench-incline',
    why: 'Back and rear shoulder with your chest resting on the bench, so your lower back does none of the work.',
    cue: 'Lie face down on the inclined bench, pull the dumbbells to your hips, squeeze the shoulder blades.',
    mistake:
      'Shrugging the shoulders up to the ears — think elbows back and down.',
    flatBench: {
      name: 'Bent-over row',
      cue: 'Hinge forward with a flat back, knees softly bent, pull both dumbbells to your hips.',
      mistake:
        'Rounding the back, or standing too upright — hinge until your chest is well forward.',
      note: 'Your bench does not tilt, so there is nothing to rest your chest on. This is the standing version — same muscles, but keep the back flat because it is holding you up.',
    },
    noBench: {
      name: 'Bent-over row',
      cue: 'Hinge forward with a flat back, knees softly bent, pull both dumbbells to your hips.',
      mistake:
        'Rounding the back, or standing too upright — hinge until your chest is well forward.',
      note: 'No bench to rest your chest on, so this is the standing version. Same muscles, but keep the back flat because it is holding you up.',
    },
  },

  'b-stance-rdl': {
    id: 'b-stance-rdl',
    name: 'B-stance deadlift',
    needs: 'nothing',
    why: 'A Romanian deadlift with most of the weight on one leg. The back foot is only there for balance.',
    cue: 'One foot flat, the other back on its toes for balance only, hinge over the front leg.',
    mistake:
      'Sharing the load evenly between the legs — about 80% should sit on the front leg.',
  },

  'rear-delt-fly': {
    id: 'rear-delt-fly',
    name: 'Rear-delt fly',
    needs: 'bench-incline',
    why: 'The back of the shoulder. Along with the rows, this is what changes your posture.',
    cue: 'Chest on the bench, arms slightly bent, sweep the dumbbells out to the sides.',
    mistake:
      'Using the arms like a rowing motion — keep the elbow angle fixed and lead with the little-finger side.',
    flatBench: {
      name: 'Bent-over rear-delt fly',
      cue: 'Hinge forward with a flat back, arms hanging, sweep the dumbbells out to the sides.',
      mistake:
        'Turning it into a row — keep the elbow angle fixed and lead with the little-finger side.',
      note: 'Your bench does not tilt, so this is the hinged-over version. Use a light dumbbell — this one is never meant to be heavy.',
    },
    noBench: {
      name: 'Bent-over rear-delt fly',
      cue: 'Hinge forward with a flat back, arms hanging, sweep the dumbbells out to the sides.',
      mistake:
        'Turning it into a row — keep the elbow angle fixed and lead with the little-finger side.',
      note: 'No bench to lie on, so this is the hinged-over version. Use a light dumbbell — this one is never meant to be heavy.',
    },
  },

  'biceps-curl': {
    id: 'biceps-curl',
    name: 'Biceps curl',
    needs: 'nothing',
    why: 'Direct arm work. Arms often measure the same while looking firmer, because muscle replaces some of the fat.',
    cue: 'Elbows pinned to your sides, curl up under control, lower slowly all the way down.',
    mistake:
      'Swinging the elbows forward and the body back — only the forearm should move.',
  },

  'triceps-extension': {
    id: 'triceps-extension',
    name: 'Overhead triceps extension',
    needs: 'nothing',
    why: 'The back of the upper arm — the part most people mean when they talk about arms.',
    cue: 'Both hands on one dumbbell overhead, elbows pointing forward, lower it behind your head.',
    mistake:
      'Elbows flaring out wide — keep them narrow and pointing at the ceiling.',
  },

  'front-plank': {
    id: 'front-plank',
    name: 'Front plank',
    needs: 'nothing',
    why: 'A stronger, tighter midsection and better posture. It builds the muscle underneath — it does not burn the fat on top.',
    cue: 'Elbows under shoulders, squeeze your glutes, make your body one straight line.',
    mistake:
      'Hips sagging towards the floor — end the set when the line breaks, not when you fail.',
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

export type BenchKind = 'none' | 'flat' | 'incline';

/**
 * Picks the version of an exercise that her kit can actually do.
 *
 * The order is deliberate: get as close to the prescribed movement as
 * possible before falling back. Something that wants an inclined bench, on
 * someone who owns a flat one, should use the flat bench — not go to the
 * floor as though she had no bench at all.
 */
export function resolveExercise(
  id: string,
  bench: BenchKind,
): ResolvedExercise {
  const ex = EXERCISES[id];
  if (!ex) throw new Error(`Unknown exercise: ${id}`);

  const base: ResolvedExercise = {
    id: ex.id,
    name: ex.name,
    shortName: ex.shortName,
    cue: ex.cue,
    mistake: ex.mistake,
    why: ex.why,
  };

  const swap = (v: NonNullable<Exercise['noBench']>): ResolvedExercise => ({
    ...base,
    name: v.name,
    cue: v.cue,
    mistake: v.mistake,
    substitutionNote: v.note,
  });

  // Needs nothing — always fine.
  if (ex.needs === 'nothing') return base;

  // Needs a bench that tilts.
  if (ex.needs === 'bench-incline') {
    if (bench === 'incline') return base;
    if (bench === 'flat' && ex.flatBench) return swap(ex.flatBench);
    if (ex.noBench) return swap(ex.noBench);
    return base;
  }

  // Needs any bench: flat to lie on, or something to sit upright on. A flat
  // bench satisfies both.
  if (bench !== 'none') return base;
  return ex.noBench ? swap(ex.noBench) : base;
}
