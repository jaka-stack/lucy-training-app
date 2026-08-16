import { useEffect, useRef, useState } from 'react';
import { Term } from '../components/Term';
import { Sheet } from '../components/Sheet';
import './SetLogger.css';

/* ==========================================================================
   PHASE 0 — the direction screen.

   This is the A-pair of Day 1 as it looks in week 3: goblet squat straight
   into incline push-ups, no rest between them, then a rest, then round again.
   It is the screen she will see more than any other, so it is the one to get
   right before anything else gets built.

   The central design decision here: THE EFFORT BUTTONS ARE THE LOG BUTTON.
   Reps and weight are pre-filled from what she did last time, so the common
   case — she did what the app expected — is a single tap. Effort is the only
   genuinely new information each set, so it is the thing that commits.

   Phase 0 uses hard-coded content. Phase 1 moves all of it into the
   programme data files.
   ========================================================================== */

// --- what this demo is standing in for -------------------------------------

const OWNED_DUMBBELLS = [5, 10, 15, 20]; // from first-run setup, in kg

type Exercise = {
  slot: 'A1' | 'A2';
  name: string;
  /** Shown under the name. Kept short enough to read at arm's length. */
  repRange: [number, number];
  /** null means bodyweight. */
  weight: number | null;
  tempo: string;
  cue: string;
  mistake: string;
  /** What she did the same session last week, per set. */
  lastTime: string;
  /** Pre-fill for the rep stepper. */
  expectedReps: number;
};

const A1: Exercise = {
  slot: 'A1',
  name: 'Goblet squat',
  repRange: [8, 12],
  weight: 15,
  tempo: '2 seconds down',
  cue: 'Hold one dumbbell against your chest, sit straight down between your feet, chest tall.',
  mistake:
    'Letting the heels lift and the chest fold forward — keep the weight through your whole foot.',
  lastTime: '15 kg × 12, 12, 11',
  expectedReps: 12,
};

const A2: Exercise = {
  slot: 'A2',
  name: 'Incline push-up',
  repRange: [6, 12],
  weight: null,
  tempo: '2 seconds down',
  cue: 'Hands on the bench under your shoulders, body one straight line from ear to ankle.',
  mistake:
    'Hips sagging or bum lifting — squeeze your glutes and brace your stomach the whole set.',
  lastTime: '9, 8, 8',
  expectedReps: 9,
};

const TOTAL_SETS = 3; // week 3 is a 3-set week
const REST_SECONDS = 90; // Block 1 rest, taken from the block table

/* The effort scale, in plain words.

   The programme asks for an RPE number. A beginner cannot give a reliable
   one, and asking for a 1–10 number mid-set is exactly the kind of thing
   that makes someone feel stupid in week 1. So we ask the question the RPE
   scale is actually asking — "how many more could you have done?" — and
   convert to RPE ourselves for the progression rule.

   The rpe values map to the definitions on page 3 of the programme:
   6 = 4 more reps, 7 = 3 more, 8 = 2 more, 10 = failure. */
const EFFORTS = [
  { key: 'easy', title: 'Easy', sub: 'lots left', rpe: 5 },
  { key: 'moderate', title: 'Moderate', sub: '3 or 4 more', rpe: 6.5 },
  { key: 'hard', title: 'Hard', sub: '2 more at most', rpe: 8 },
  { key: 'max', title: 'All I had', sub: 'nothing left', rpe: 9.5 },
] as const;

type LoggedSet = {
  slot: 'A1' | 'A2';
  setNumber: number;
  reps: number;
  weight: number | null;
  effort: string;
};

type Phase = 'logging' | 'resting' | 'done';

export function SetLogger() {
  const [slot, setSlot] = useState<'A1' | 'A2'>('A1');
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState<Phase>('logging');
  const [log, setLog] = useState<LoggedSet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [landed, setLanded] = useState(false);

  /* Blocks a second log while the screen is still changing. A ref rather than
     state, because it must take effect immediately — state would not update
     until the next render, which is exactly the window we are guarding. */
  const lockedRef = useRef(false);

  const exercise = slot === 'A1' ? A1 : A2;

  const [reps, setReps] = useState(exercise.expectedReps);
  const [weight, setWeight] = useState<number | null>(exercise.weight);

  // When we move to a different exercise, re-prime the controls from what she
  // is expected to do. She should almost never have to touch them.
  useEffect(() => {
    setReps(exercise.expectedReps);
    setWeight(exercise.weight);
  }, [slot, exercise.expectedReps, exercise.weight]);

  function logSet(effort: (typeof EFFORTS)[number]) {
    // Guard against a double tap logging two sets. A wet thumb bouncing on
    // the button, or an impatient second tap while the screen is still
    // changing, would otherwise silently record a set she never did — and
    // that corrupts the progression rule, not just the display.
    if (lockedRef.current) return;
    lockedRef.current = true;
    window.setTimeout(() => {
      lockedRef.current = false;
    }, 500);

    setLog((l) => [
      ...l,
      { slot, setNumber, reps, weight, effort: effort.title },
    ]);

    // A short, firm confirmation. Motion that says "that landed", not a
    // celebration — she has two more sets to do.
    setLanded(true);
    window.setTimeout(() => setLanded(false), 420);

    if (slot === 'A1') {
      // No rest inside a superset. Straight to the second exercise — this is
      // the single most confusing thing about supersets on paper, so the app
      // simply does it.
      setSlot('A2');
    } else if (setNumber < TOTAL_SETS) {
      setPhase('resting');
    } else {
      setPhase('done');
    }
  }

  function undoLast() {
    const last = log[log.length - 1];
    if (!last) return;
    setLog((l) => l.slice(0, -1));
    setSlot(last.slot);
    setSetNumber(last.setNumber);
    setPhase('logging');
  }

  function finishRest() {
    setSetNumber((n) => n + 1);
    setSlot('A1');
    setPhase('logging');
  }

  if (phase === 'done') {
    return <PairDone log={log} onUndo={undoLast} />;
  }

  if (phase === 'resting') {
    return (
      <Rest
        seconds={REST_SECONDS}
        onDone={finishRest}
        nextLabel={`Goblet squat · set ${setNumber + 1} of ${TOTAL_SETS}`}
        lastLogged={log[log.length - 1]}
        onUndo={undoLast}
      />
    );
  }

  const [lo, hi] = exercise.repRange;
  const completedForThisExercise = log.filter((l) => l.slot === slot);

  return (
    <div className="screen">
      <Header setNumber={setNumber} slot={slot} />

      <main className="logger">
        {/* --- which exercise, and what it is part of --- */}
        <div className="ex-head">
          <p className="ex-slot">
            <span className="ex-slot-letter">{exercise.slot}</span>
            <Term k="superset">
              {slot === 'A1' ? 'then straight into push-ups' : 'then rest'}
            </Term>
          </p>

          <button className="ex-name" onClick={() => setShowForm(true)}>
            {exercise.name}
            <span className="ex-name-hint" aria-hidden="true">
              How to do it
            </span>
          </button>

          <p className="ex-target">
            Aim for {lo}–{hi} <Term k="rep">reps</Term>
            {exercise.weight !== null && <> · {exercise.weight} kg</>} ·{' '}
            <Term k="tempo">{exercise.tempo}</Term>
          </p>

          <p className="ex-last">Last week: {exercise.lastTime}</p>
        </div>

        {/* --- how far through this exercise she is --- */}
        <ol className="pips" aria-label={`Set ${setNumber} of ${TOTAL_SETS}`}>
          {Array.from({ length: TOTAL_SETS }, (_, i) => {
            const done = completedForThisExercise[i];
            const isNow = i + 1 === setNumber;
            return (
              <li
                key={i}
                className={`pip ${done ? 'is-done' : ''} ${isNow ? 'is-now' : ''}`}
              >
                <span className="pip-n">{i + 1}</span>
                <span className="pip-v">
                  {done ? `${done.reps}` : isNow ? 'now' : '—'}
                </span>
              </li>
            );
          })}
        </ol>

        {/* --- reps: pre-filled, adjusted only if she did something else --- */}
        <section className={`stepper ${landed ? 'is-landed' : ''}`}>
          <button
            className="step-btn"
            onClick={() => setReps((r) => Math.max(1, r - 1))}
            aria-label="One fewer rep"
          >
            <Minus />
          </button>

          <div className="step-value">
            <span className="step-number">{reps}</span>
            <span className="label step-unit">reps</span>
          </div>

          <button
            className="step-btn"
            onClick={() => setReps((r) => Math.min(50, r + 1))}
            aria-label="One more rep"
          >
            <Plus />
          </button>
        </section>

        {/* --- weight: only what she actually owns --- */}
        {exercise.weight !== null ? (
          <section className="weights">
            <p className="label weights-label">Dumbbell</p>
            <div className="chips" role="group" aria-label="Dumbbell weight">
              {OWNED_DUMBBELLS.map((kg) => (
                <button
                  key={kg}
                  className={`chip ${weight === kg ? 'is-on' : ''}`}
                  onClick={() => setWeight(kg)}
                  aria-pressed={weight === kg}
                  aria-label={`${kg} kilogram dumbbell`}
                >
                  {kg}
                  <span className="chip-unit">kg</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="weights">
            <p className="label weights-label">Weight</p>
            <p className="bodyweight">Just you — no dumbbell</p>
          </section>
        )}

      </main>

      {/* --- effort, which is also the commit ---
          Deliberately OUTSIDE the scrolling area. On a short phone the
          exercise details scroll; the thing she has to tap never does. The
          action is always in the same place under her thumb. */}
      <section className="effort">
        <p className="label effort-label">How did that set feel?</p>
        <div className="effort-grid">
          {EFFORTS.map((e) => (
            <button
              key={e.key}
              className="effort-btn"
              /* Spelled out, because the button does two things and only one
                 of them is visible: it rates the set AND logs it. A screen
                 reader user should know that before they activate it. */
              aria-label={`${e.title} — ${e.sub}. Log set ${setNumber}: ${
                weight !== null ? `${weight} kilograms, ` : ''
              }${reps} reps.`}
              onClick={() => logSet(e)}
            >
              <span className="effort-title">{e.title}</span>
              <span className="effort-sub">{e.sub}</span>
            </button>
          ))}
        </div>
        <p className="effort-foot">Tapping one logs the set.</p>
      </section>

      {/* --- form cues, one tap from the exercise name --- */}
      <Sheet
        open={showForm}
        onClose={() => setShowForm(false)}
        kicker="How to do it"
        title={exercise.name}
      >
        <p className="lead">{exercise.cue}</p>

        <div className="block">
          <span className="label">The usual mistake</span>
          <p>{exercise.mistake}</p>
        </div>

        <p className="sheet-note">
          Watching demonstrations needs an internet connection. The cues above
          always work.
        </p>
      </Sheet>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Header({ setNumber, slot }: { setNumber: number; slot: string }) {
  // Six segments: three sets of two exercises. Fills as she works through.
  const doneCount = (setNumber - 1) * 2 + (slot === 'A2' ? 1 : 0);

  return (
    <header className="hdr">
      <div className="hdr-row">
        <p className="label">
          Week 3 · Day 1 · <Term k="block">Block 1</Term>
        </p>
        <button className="hdr-pause" aria-label="Pause session">
          Pause
        </button>
      </div>
      <div className="hdr-track" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`hdr-seg ${i < doneCount ? 'is-done' : ''}`} />
        ))}
      </div>
    </header>
  );
}

function Rest({
  seconds,
  onDone,
  nextLabel,
  lastLogged,
  onUndo,
}: {
  seconds: number;
  onDone: () => void;
  nextLabel: string;
  lastLogged?: LoggedSet;
  onUndo: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    // Count from a real timestamp rather than counting ticks, so the timer
    // stays honest if the phone sleeps or the browser throttles the tab.
    const end = Date.now() + seconds * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        doneRef.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [seconds]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;

  return (
    <div className="screen">
      <main className="rest">
        <p className="label rest-label">Resting</p>

        <div className="ring-wrap">
          <svg className="ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle className="ring-track" cx="100" cy="100" r="90" />
            <circle
              className="ring-fill"
              cx="100"
              cy="100"
              r="90"
              style={{ animationDuration: `${seconds}s` }}
            />
          </svg>
          <p className="ring-time" role="timer" aria-live="off">
            {mins}:{String(secs).padStart(2, '0')}
          </p>
        </div>

        <div className="rest-next">
          <p className="label">Next up</p>
          <p className="rest-next-name">{nextLabel}</p>
        </div>

        <button className="btn-primary" onClick={onDone}>
          Skip the rest
        </button>

        {lastLogged && (
          <p className="rest-logged">
            Logged: {lastLogged.weight ? `${lastLogged.weight} kg × ` : ''}
            {lastLogged.reps} reps
            <button className="undo" onClick={onUndo}>
              Undo
            </button>
          </p>
        )}
      </main>
    </div>
  );
}

function PairDone({ log, onUndo }: { log: LoggedSet[]; onUndo: () => void }) {
  return (
    <div className="screen">
      <main className="rest">
        <p className="label rest-label">First pair done</p>
        <h1 className="done-h">
          Squats and push-ups
          <br />
          are behind you.
        </h1>
        <p className="done-sub">
          {log.length} sets logged. Next: Romanian deadlift and shoulder press.
        </p>
        <button className="btn-primary" onClick={onUndo}>
          Undo last set
        </button>
        <p className="rest-logged">
          This is where Phase 1 continues into the B pair.
        </p>
      </main>
    </div>
  );
}

/* Icons drawn as SVG rather than emoji or an icon font: they inherit colour,
   stay crisp, and the stroke weight matches the type. */
function Minus() {
  return (
    <svg viewBox="0 0 40 40" className="icon" aria-hidden="true">
      <path d="M10 20h20" />
    </svg>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 40 40" className="icon" aria-hidden="true">
      <path d="M20 10v20M10 20h20" />
    </svg>
  );
}
