/* Shared shapes for everything the app stores. */

export type Equipment = {
  /** Dumbbell pairs she owns, in kg, ascending. */
  dumbbells: number[];
  /** A bench she can sit upright on / lie on. */
  hasBench: boolean;
  /** Whether the bench can be set to an incline (affects Day 2/3 later). */
  benchInclines: boolean;
  hasBike: boolean;
};

export type Settings = {
  equipment: Equipment;
  /** ISO date of the first session. Used to suggest which week she is on. */
  startedOn: string;
  /** Sound and vibration on rest/interval transitions. */
  cues: boolean;
  /**
   * The weekly weight and waist log. OFF by default, and deliberately so —
   * it is the one part of this app that can turn into a daily habit of
   * checking a number, which the programme itself warns against.
   */
  checkInEnabled?: boolean;
};

/**
 * One weigh-in or measurement. Several can share a week; the app only ever
 * shows the weekly average, because §9 is explicit that "a single morning's
 * weight is close to meaningless" and only weekly averages should be compared.
 */
export type CheckIn = {
  /** ISO date, day resolution. */
  date: string;
  week: number;
  weightKg?: number;
  waistCm?: number;
};

/** One logged working set. */
export type SetRecord = {
  exerciseId: string;
  slot: string;
  setNumber: number;
  reps: number;
  /** kg, or null for bodyweight. */
  weight: number | null;
  /** Our internal RPE, converted from the plain-language buttons. */
  rpe: number;
  /** The plain-language label she actually chose. */
  effortLabel: string;
};

/** A finished session. */
export type SessionRecord = {
  id: string;
  dayId: string;
  week: number;
  /** ISO datetime. */
  finishedAt: string;
  sets: SetRecord[];
  /** Whether the bike finisher was done, skipped, or not prescribed. */
  bike: 'done' | 'skipped' | 'none';
};

/** A session that is currently underway, saved so it survives a crash. */
export type InProgress = {
  dayId: string;
  week: number;
  startedAt: string;
  /** How far through the ordered plan she is. */
  stepIndex: number;
  sets: SetRecord[];
  /** Warm-up items already ticked. */
  warmUpDone: string[];
  coolDownDone: string[];
};

/** Steps of the progression ladder already applied to one exercise. */
export type Adjustments = {
  /** A dumbbell she has agreed to move up to but not yet lifted. */
  targetWeight?: number;
  /** Extra reps allowed above the top of the range, up to 5. */
  bonusReps?: number;
  tempo?: boolean;
  pause?: boolean;
  unilateral?: boolean;
  set?: boolean;
  /**
   * How many sessions were in the history when she last said "not yet".
   * Lets the app wait for new evidence instead of asking again immediately.
   */
  declinedAt?: number;
};

export type AppState = {
  /** null until first-run setup is finished. */
  settings: Settings | null;
  /** Which week she is on. Advanced manually, never automatically. */
  currentWeek: number;
  history: SessionRecord[];
  inProgress: InProgress | null;
  /** Ladder steps applied per exercise, keyed by exercise id. */
  adjustments: Record<string, Adjustments>;
  /** Weekly weigh-ins and measurements. Empty unless she turns them on. */
  checkIns: CheckIn[];
};

export const INITIAL_STATE: AppState = {
  settings: null,
  currentWeek: 1,
  history: [],
  inProgress: null,
  adjustments: {},
  checkIns: [],
};
