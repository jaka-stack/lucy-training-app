/* ==========================================================================
   THE PROGRAMME

   This file is the training. It is written to look as much like the tables in
   the PDF as possible, so that changing a rep range means editing one obvious
   line and nothing else.

   IMPORTANT — where the PDF contradicts itself, the BLOCK TABLE (§7) wins for
   sets, rest, effort and tempo; the DAY PAGES (§6.x) win for which exercises,
   rep ranges and starting weights. §7 is explicitly the "what changes as the
   weeks go on" page and says the day pages show the Block 1 version, so the
   day pages are a snapshot and the block table is the rule. This is the only
   reading under which the document is self-consistent. See DECISIONS.md D1.
   ========================================================================== */

export type Group = 'A' | 'B' | 'C';

export type PrescribedExercise = {
  slot: string; // A1, A2, B1, ...
  group: Group;
  exerciseId: string;
  /** Reps, from the day page. */
  reps: [number, number];
  /** True when the rep count is per side, e.g. "8 each side". */
  perSide?: boolean;
  /** For timed holds instead of reps, e.g. planks. Seconds. */
  seconds?: [number, number];
  /**
   * Week 1 starting weight in kg, from the day page.
   * null  = bodyweight
   * 'one' = a single dumbbell (goblet squat, glute bridge)
   * 'pair'= a dumbbell in each hand
   */
  startWeight: number | null;
  weightStyle: 'one' | 'pair' | 'none';
  /**
   * Where the block table names a specific weight for later blocks, it goes
   * here. Blocks not listed carry on from what she actually lifted.
   */
  blockWeight?: Partial<Record<2 | 3 | 4, number>>;
};

export type Day = {
  id: 'day1' | 'day2' | 'day3';
  number: 1 | 2 | 3;
  title: string;
  focus: string;
  /** The coach's note from the bottom of the day page. */
  coachNote: string;
  exercises: PrescribedExercise[];
};

/* --- Day 1 — Squat + Press (§6.1) --------------------------------------- */

export const DAY_1: Day = {
  id: 'day1',
  number: 1,
  title: 'Squat and press',
  focus: 'Thighs, glutes, chest, shoulders, deep core',
  coachNote:
    'This is your heaviest-feeling day. If time runs short, drop the last pair — never the first.',
  exercises: [
    {
      slot: 'A1',
      group: 'A',
      exerciseId: 'goblet-squat',
      reps: [8, 12],
      startWeight: 15,
      weightStyle: 'one',
    },
    {
      slot: 'A2',
      group: 'A',
      exerciseId: 'incline-pushup',
      reps: [6, 12],
      startWeight: null,
      weightStyle: 'none',
    },
    {
      slot: 'B1',
      group: 'B',
      exerciseId: 'db-rdl',
      reps: [8, 12],
      startWeight: 10,
      weightStyle: 'pair',
      // Block table: 2 x 10 kg → 2 x 15 kg → 2 x 20 kg → 2 x 20 kg
      blockWeight: { 2: 15, 3: 20, 4: 20 },
    },
    {
      slot: 'B2',
      group: 'B',
      exerciseId: 'seated-shoulder-press',
      reps: [8, 12],
      startWeight: 5,
      weightStyle: 'pair',
    },
    {
      slot: 'C1',
      group: 'C',
      exerciseId: 'db-glute-bridge',
      reps: [12, 15],
      startWeight: 15,
      weightStyle: 'one',
    },
    {
      slot: 'C2',
      group: 'C',
      exerciseId: 'dead-bug',
      reps: [8, 8],
      perSide: true,
      startWeight: null,
      weightStyle: 'none',
    },
  ],
};

export const DAYS: Day[] = [DAY_1];

/* ==========================================================================
   THE BLOCK TABLE (§7)

   Everything that changes as the weeks go on. Read this alongside page 12 of
   the PDF — it is the same table.
   ========================================================================== */

export type WeekPlan = {
  week: number;
  block: 1 | 2 | 3 | 4;
  /** Working sets for the A pair, the B pair and the C pair. */
  setsA: number;
  setsB: number;
  setsC: number;
  /** Rest after each superset round, in seconds. */
  rest: number;
  /** Target effort, as RPE, from the block table. */
  targetRpe: [number, number];
  /** Tempo instruction for the A and B pairs, in plain words. */
  tempo: string;
  /** True in week 7 only. Changes tone everywhere it is shown. */
  isDeload: boolean;
  /** True in week 12 only. */
  isRetestWeek: boolean;
};

export function planForWeek(week: number): WeekPlan {
  const block: 1 | 2 | 3 | 4 =
    week <= 3 ? 1 : week <= 6 ? 2 : week <= 9 ? 3 : 4;

  // Block 1 — weeks 1-3. Learn the movements.
  if (block === 1) {
    return {
      week,
      block,
      // "2 in wk 1, then 3"
      setsA: week === 1 ? 2 : 3,
      setsB: week === 1 ? 2 : 3,
      setsC: 2,
      rest: 90, // "75-90 s"
      targetRpe: [5, 6],
      tempo: 'Controlled, about 2 seconds down',
      isDeload: false,
      isRetestWeek: false,
    };
  }

  // Block 2 — weeks 4-6. Start pushing.
  if (block === 2) {
    return {
      week,
      block,
      setsA: 3,
      setsB: 3,
      setsC: 2,
      rest: 75, // "60-75 s"
      targetRpe: [7, 7],
      tempo: 'Controlled, 2 seconds down',
      isDeload: false,
      isRetestWeek: false,
    };
  }

  // Block 3 — weeks 7-9. Deload, then get harder.
  if (block === 3) {
    if (week === 7) {
      return {
        week,
        block,
        setsA: 2,
        setsB: 2,
        setsC: 1,
        rest: 90, // "60 s (90 s in wk 7)"
        targetRpe: [5, 5],
        tempo: 'Controlled and easy — nothing hard this week',
        isDeload: true,
        isRetestWeek: false,
      };
    }
    return {
      week,
      block,
      setsA: 3,
      setsB: 3,
      setsC: 2,
      rest: 60,
      targetRpe: [7, 8],
      tempo: '3 seconds down on the first four exercises',
      isDeload: false,
      isRetestWeek: false,
    };
  }

  // Block 4 — weeks 10-12. Peak.
  return {
    week,
    block,
    setsA: 4, // "4 on the A pair, 3 on B"
    setsB: 3,
    setsC: 2, // table says "2-3"; we use 2 and let the ladder add the third
    rest: 60, // "45-60 s"
    targetRpe: [8, 8],
    tempo: '3 seconds down, then pause 1 second at the bottom',
    isDeload: false,
    isRetestWeek: week === 12,
  };
}

/** What changed this week, in her words. Shown when a block starts. */
export function blockIntro(week: number): {
  title: string;
  lines: string[];
  tone: 'normal' | 'deload' | 'retest';
} | null {
  if (week === 1)
    return {
      title: 'Week 1 — learning the movements',
      tone: 'normal',
      lines: [
        'Two sets of everything this week, not three. That is on purpose.',
        'Nothing should feel hard. You should finish thinking you could have done more.',
        'Log what you actually lift — that is what makes everything later work.',
      ],
    };

  if (week === 2)
    return {
      title: 'Week 2 — the third set arrives',
      tone: 'normal',
      lines: [
        'Same exercises, same weights, one extra set on the first four.',
        'Still nothing hard. Technique first.',
      ],
    };

  if (week === 4)
    return {
      title: 'Block 2 — start pushing',
      tone: 'normal',
      lines: [
        'Sets now go closer to hard: about 3 reps left in the tank, not 4 or 5.',
        'Shorter rests, and the bike finisher starts at the end of this session.',
        'This is where your first real weight increases happen.',
      ],
    };

  if (week === 7)
    return {
      title: 'Week 7 — the easy week',
      tone: 'deload',
      lines: [
        'This week is meant to feel too easy. That is the entire point of it.',
        'Half the sets, nothing above "easy", longer rests, no bike finisher.',
        'You are not going backwards. Letting tiredness drain away now is what lets you set new bests in weeks 8 and 9.',
      ],
    };

  if (week === 8)
    return {
      title: 'Back to work',
      tone: 'normal',
      lines: [
        'Full sets again, and this is where the lowering slows to 3 seconds on the first four exercises.',
        'Slow lowering makes a light dumbbell feel heavy. Expect fewer reps than week 6 — that is correct, not a step back.',
      ],
    };

  if (week === 10)
    return {
      title: 'Block 4 — the last stretch',
      tone: 'normal',
      lines: [
        'A fourth set on the first pair, and a 1-second pause at the bottom of squats, deadlifts and presses.',
        'Shorter rests. This is the hardest block, and it is the last one.',
      ],
    };

  if (week === 12)
    return {
      title: 'Week 12 — the last week',
      tone: 'retest',
      lines: [
        'Last week of the block. Your third session is a retest, where you find out what you can actually lift now.',
        'Whatever the number says, you have trained for twelve weeks. That was the hard part.',
      ],
    };

  return null;
}

/* ==========================================================================
   THE BIKE PLAN (§8)
   ========================================================================== */

export type BikePlan =
  | { kind: 'none'; note: string }
  | {
      kind: 'intervals';
      hardSeconds: number;
      easySeconds: number;
      rounds: number;
      totalMinutes: number;
    };

/** Day 1's finisher. "Hard" means you cannot talk in full sentences. */
export function bikeFinisherForWeek(week: number): BikePlan {
  const plan = planForWeek(week);

  // Block 1: none. Week 7: none ("none in wk 7").
  if (plan.block === 1)
    return {
      kind: 'none',
      note: 'No finisher in the first three weeks — just an easy spin to cool down.',
    };
  if (plan.isDeload)
    return {
      kind: 'none',
      note: 'No finisher in the easy week. Keep the bike gentle.',
    };

  if (plan.block === 2)
    return {
      kind: 'intervals',
      hardSeconds: 30,
      easySeconds: 60,
      rounds: 4,
      totalMinutes: 6,
    };
  if (plan.block === 3)
    return {
      kind: 'intervals',
      hardSeconds: 40,
      easySeconds: 60,
      rounds: 5,
      totalMinutes: 8,
    };
  return {
    kind: 'intervals',
    hardSeconds: 45,
    easySeconds: 60,
    rounds: 6,
    totalMinutes: 10,
  };
}
