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

export type AppState = {
  /** null until first-run setup is finished. */
  settings: Settings | null;
  /** Which week she is on. Advanced manually, never automatically. */
  currentWeek: number;
  history: SessionRecord[];
  inProgress: InProgress | null;
};

export const INITIAL_STATE: AppState = {
  settings: null,
  currentWeek: 1,
  history: [],
  inProgress: null,
};
