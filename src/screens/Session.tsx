import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { dayById, planForWeek, type BikePlan } from '../data/programme';
import { COOL_DOWN, WARM_UP, videoSearchUrl } from '../data/exercises';
import {
  EFFORTS,
  buildSession,
  countSets,
  isRetestSession,
  setsCompletedBefore,
  type Effort,
  type PlannedSet,
  type Step,
} from '../state/engine';
import { Term } from '../components/Term';
import { Sheet } from '../components/Sheet';
import { ExerciseImage } from '../components/ExerciseImage';
import { cueDone, cueEasy, cueHard, cueRestOver } from '../lib/cues';
import { useWakeLock } from '../lib/useWakeLock';
import './Session.css';

/* ==========================================================================
   THE SESSION

   One thing on screen at a time, start to finish: warm up, the three pairs,
   the bike, the cool-down. She should be able to run the whole thing without
   reading anything, and get an explanation the moment she wants one.
   ========================================================================== */

export function Session({ onExit }: { onExit: () => void }) {
  const { state, dispatch } = useStore();
  const ip = state.inProgress;
  const equipment = state.settings!.equipment;
  const cues = state.settings!.cues;

  // Keep the screen on for the whole session — the phone is on the floor.
  useWakeLock(true);

  const steps = useMemo(() => {
    if (!ip) return [];
    return buildSession(
      dayById(ip.dayId),
      ip.week,
      equipment,
      state.history,
      state.adjustments,
    );
    // Rebuilt only when the session or the kit changes — not when a set is
    // logged, so the plan she started with is the plan she finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip?.dayId, ip?.week, equipment, state.history.length, state.adjustments]);

  if (!ip || steps.length === 0) return null;

  const day = dayById(ip.dayId);

  const index = Math.min(ip.stepIndex, steps.length - 1);
  const step = steps[index];

  const go = (delta: number) =>
    dispatch({
      type: 'setStep',
      index: Math.max(0, Math.min(steps.length - 1, index + delta)),
    });

  const totalSets = countSets(steps);
  const doneSets = setsCompletedBefore(steps, index);

  return (
    <div className="screen">
      <SessionHeader
        week={ip.week}
        dayTitle={day.title}
        doneSets={doneSets}
        totalSets={totalSets}
        onExit={onExit}
      />

      {step.kind === 'warmup' && (
        <WarmUpStep hasBike={equipment.hasBike} onNext={() => go(1)} />
      )}

      {step.kind === 'rampup' && (
        <RampUpStep
          name={step.exercise.name}
          weight={step.weight}
          onNext={() => go(1)}
        />
      )}

      {step.kind === 'set' && (
        <SetStep
          key={`${step.set.slot}-${step.set.setNumber}`}
          set={step.set}
          owned={equipment.dumbbells}
          alreadyLogged={ip.sets.filter(
            (s) => s.exerciseId === step.set.exercise.id,
          )}
          onLog={(reps, weight, effort) => {
            dispatch({
              type: 'logSet',
              set: {
                exerciseId: step.set.exercise.id,
                slot: step.set.slot,
                setNumber: step.set.setNumber,
                reps,
                weight,
                rpe: effort.rpe,
                effortLabel: effort.title,
              },
            });
            go(1);
          }}
        />
      )}

      {step.kind === 'rest' && (
        <RestStep
          seconds={step.seconds}
          nextLabel={step.nextLabel}
          cues={cues}
          lastSet={ip.sets[ip.sets.length - 1]}
          onUndo={() => {
            dispatch({ type: 'undoLastSet' });
            go(-1);
          }}
          onDone={() => go(1)}
        />
      )}

      {step.kind === 'bike' && (
        <BikeStep
          plan={step.plan}
          hasBike={equipment.hasBike}
          cues={cues}
          onNext={() => go(1)}
        />
      )}

      {step.kind === 'retestIntro' && <RetestIntro onNext={() => go(1)} />}

      {step.kind === 'retest' && (
        <RetestStep
          key={step.exerciseId}
          step={step}
          owned={equipment.dumbbells}
          onLog={(reps, weight) => {
            dispatch({
              type: 'logSet',
              set: {
                exerciseId: step.exerciseId,
                slot: 'RETEST',
                setNumber: 1,
                reps,
                weight,
                rpe: 9,
                effortLabel: 'Retest',
              },
            });
            go(1);
          }}
        />
      )}

      {step.kind === 'cooldown' && (
        <CoolDownStep hasBike={equipment.hasBike} onNext={() => go(1)} />
      )}

      {step.kind === 'summary' && (
        <SummaryStep
          week={ip.week}
          dayId={ip.dayId}
          sets={ip.sets}
          cues={cues}
          onFinish={(bike) => {
            dispatch({ type: 'finishSession', bike });
            onExit();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SessionHeader({
  week,
  dayTitle,
  doneSets,
  totalSets,
  onExit,
}: {
  week: number;
  dayTitle: string;
  doneSets: number;
  totalSets: number;
  onExit: () => void;
}) {
  return (
    <header className="hdr">
      <div className="hdr-row">
        <p className="label">
          Week {week} · {dayTitle}
        </p>
        <button className="hdr-pause" onClick={onExit}>
          Pause
        </button>
      </div>
      <div
        className="hdr-track"
        role="progressbar"
        aria-valuenow={doneSets}
        aria-valuemin={0}
        aria-valuemax={totalSets}
        aria-label="Sets completed"
      >
        {Array.from({ length: totalSets }, (_, i) => (
          <span key={i} className={`hdr-seg ${i < doneSets ? 'is-done' : ''}`} />
        ))}
      </div>
    </header>
  );
}

/* --- warm-up -------------------------------------------------------------- */

function WarmUpStep({
  hasBike,
  onNext,
}: {
  hasBike: boolean;
  onNext: () => void;
}) {
  const { state, dispatch } = useStore();
  const done = state.inProgress?.warmUpDone ?? [];

  return (
    <>
      <div className="body">
        <p className="label">Before you lift · about 8 minutes</p>
        <h1 className="h1 step-title">Warm-up</h1>
        <p className="prose step-lead">
          Tick them off as you go. Do not skip this to save time — if the clock
          is tight, drop the last pair of exercises instead.
        </p>

        <ul className="check-list">
          {WARM_UP.map((m) => {
            const sub = m.needsBike && !hasBike ? m.noBike! : null;
            const isDone = done.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  className={`check ${isDone ? 'is-done' : ''}`}
                  aria-pressed={isDone}
                  onClick={() => dispatch({ type: 'toggleWarmUp', id: m.id })}
                >
                  <span className="check-box" aria-hidden="true">
                    {isDone && <Tick />}
                  </span>
                  <span className="check-text">
                    <span className="check-name">{sub ? sub.name : m.name}</span>
                    <span className="check-amount">
                      {sub ? sub.amount : m.amount}
                    </span>
                    <span className="check-why">{sub ? sub.note : m.why}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="footer">
        <button className="btn-primary" onClick={onNext}>
          {done.length === WARM_UP.length ? 'Warmed up — carry on' : 'Carry on'}
        </button>
      </div>
    </>
  );
}

/* --- ramp-up set ---------------------------------------------------------- */

function RampUpStep({
  name,
  weight,
  onNext,
}: {
  name: string;
  weight: number | null;
  onNext: () => void;
}) {
  return (
    <>
      <div className="body body-centre">
        <p className="label">One easy set first</p>
        <h1 className="h1 step-title">
          <Term k="ramp-up set">Ramp-up set</Term>
        </h1>

        <div className="rampup-card">
          <p className="rampup-what">{name}</p>
          <p className="rampup-how">
            8 reps, {weight === null ? 'no weight or very light' : `${weight} kg`}
          </p>
        </div>

        <p className="prose step-lead">
          This one is just to get the movement going. It does not count and it
          does not get logged — the app will not ask you about it.
        </p>
      </div>

      <div className="footer">
        <button className="btn-primary" onClick={onNext}>
          Done — start the first set
        </button>
      </div>
    </>
  );
}

/* --- a working set -------------------------------------------------------- */

function SetStep({
  set,
  owned,
  alreadyLogged,
  onLog,
}: {
  set: PlannedSet;
  owned: number[];
  alreadyLogged: { reps: number }[];
  onLog: (reps: number, weight: number | null, effort: Effort) => void;
}) {
  const [reps, setReps] = useState(set.expectedReps);
  const [weight, setWeight] = useState<number | null>(set.suggestedWeight);
  const [showForm, setShowForm] = useState(false);
  const [landed, setLanded] = useState(false);
  const lockedRef = useRef(false);

  const isHold = set.seconds !== undefined;
  const [lo, hi] = set.seconds ?? set.reps;
  const isPair = set.weightStyle === 'pair';

  // Holds move in 5-second steps; reps move one at a time.
  const stepBy = isHold ? 5 : 1;
  const unit = isHold
    ? set.perSide
      ? 'seconds each side'
      : 'seconds'
    : set.perSide
      ? 'reps each side'
      : 'reps';

  function commit(effort: Effort) {
    // Guard against a double tap logging two sets. A wet thumb bouncing would
    // otherwise record a set she never did — and that corrupts the
    // progression rule, not just the display.
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLanded(true);
    window.setTimeout(() => onLog(reps, weight, effort), 180);
  }

  return (
    <>
      <main className="logger">
        <div className="ex-head">
          <p className="ex-slot">
            <span className="ex-slot-letter">{set.slot}</span>
            <Term k="superset">
              {set.slot.endsWith('1') ? 'then straight into the next one' : 'then rest'}
            </Term>
          </p>

          <button className="ex-name" onClick={() => setShowForm(true)}>
            {set.exercise.name}
            <span className="ex-name-hint">How to do it</span>
          </button>

          <p className="ex-target">
            {lo === hi ? `${lo}` : `${lo}–${hi}`}{' '}
            {isHold ? 'seconds' : <Term k="rep">reps</Term>}
            {set.perSide && ' each side'}
            {weight !== null && (
              <> · {isPair ? `2 × ${weight} kg` : `${weight} kg`}</>
            )}
          </p>

          {set.lastTime && <p className="ex-last">Last time: {set.lastTime}</p>}

          {set.variationNote && (
            <p className="ex-variation">{set.variationNote}</p>
          )}
        </div>

        <ol
          className="pips"
          aria-label={`Set ${set.setNumber} of ${set.totalSets}`}
        >
          {Array.from({ length: set.totalSets }, (_, i) => {
            const prev = alreadyLogged[i];
            const isNow = i + 1 === set.setNumber;
            return (
              <li
                key={i}
                className={`pip ${prev ? 'is-done' : ''} ${isNow ? 'is-now' : ''}`}
              >
                <span className="pip-n">{i + 1}</span>
                <span className="pip-v">
                  {prev ? prev.reps : isNow ? 'now' : '—'}
                </span>
              </li>
            );
          })}
        </ol>

      </main>

      {/* Everything she touches lives here, outside the scrolling area: the
          rep count, the weight, and the effort buttons that log the set. On a
          short screen — or a week with a longer note above — the information
          scrolls and the controls never move. */}
      <section className="console">
        <section className={`stepper ${landed ? 'is-landed' : ''}`}>
          <button
            className="step-btn"
            onClick={() => setReps((r) => Math.max(stepBy, r - stepBy))}
            aria-label={isHold ? 'Five seconds fewer' : 'One fewer rep'}
          >
            <Minus />
          </button>

          <div className="step-value">
            <span className="step-number">{reps}</span>
            <span className="label step-unit">{unit}</span>
          </div>

          <button
            className="step-btn"
            onClick={() => setReps((r) => Math.min(300, r + stepBy))}
            aria-label={isHold ? 'Five seconds more' : 'One more rep'}
          >
            <Plus />
          </button>
        </section>

        {set.weightStyle === 'none' ? (
          <section className="weights">
            <p className="label weights-label">Weight</p>
            <p className="bodyweight">Just you — no dumbbell</p>
          </section>
        ) : (
          <section className="weights">
            <p className="label weights-label">
              {isPair ? 'One in each hand' : 'One dumbbell'}
            </p>
            <div className="chips" role="group" aria-label="Dumbbell weight">
              {owned.map((kg) => (
                <button
                  key={kg}
                  className={`chip ${weight === kg ? 'is-on' : ''}`}
                  onClick={() => setWeight(kg)}
                  aria-pressed={weight === kg}
                  aria-label={`${kg} kilogram${isPair ? ' in each hand' : ''}`}
                >
                  {kg}
                  <span className="chip-unit">kg</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="effort">
        <p className="label effort-label">How did that set feel?</p>
        <div className="effort-grid">
          {EFFORTS.map((e) => (
            <button
              key={e.key}
              className="effort-btn"
              aria-label={`${e.title} — ${e.sub}. Log set ${set.setNumber}: ${
                weight !== null ? `${weight} kilograms, ` : ''
              }${reps} ${isHold ? 'seconds' : 'reps'}.`}
              onClick={() => commit(e)}
            >
              <span className="effort-title">{e.title}</span>
              <span className="effort-sub">{e.sub}</span>
            </button>
          ))}
        </div>
          <p className="effort-foot">Tapping one logs the set.</p>
        </section>
      </section>

      <Sheet
        open={showForm}
        onClose={() => setShowForm(false)}
        kicker="How to do it"
        title={set.exercise.name}
      >
        <ExerciseImage
          exerciseId={set.exercise.id}
          name={set.exercise.name}
        />
        <p className="lead">{set.exercise.cue}</p>

        {set.exercise.substitutionNote && (
          <div className="block">
            <span className="label">Why this version</span>
            <p>{set.exercise.substitutionNote}</p>
          </div>
        )}

        <div className="block">
          <span className="label">The usual mistake</span>
          <p>{set.exercise.mistake}</p>
        </div>

        <div className="block">
          <span className="label">Speed</span>
          <p>
            <Term k="tempo">{set.tempo}</Term>
          </p>
        </div>

        {set.exercise.why && (
          <div className="block">
            <span className="label">Why it's in the programme</span>
            <p>{set.exercise.why}</p>
          </div>
        )}

        <a
          className="watch-link"
          href={videoSearchUrl(set.exercise.name)}
          target="_blank"
          rel="noreferrer"
        >
          Watch a few demonstrations
        </a>
        <p className="sheet-note">
          Watching videos needs an internet connection. Everything above works
          without one.
        </p>
      </Sheet>
    </>
  );
}

/* --- rest ----------------------------------------------------------------- */

function RestStep({
  seconds,
  nextLabel,
  cues,
  lastSet,
  onUndo,
  onDone,
}: {
  seconds: number;
  nextLabel: string;
  cues: boolean;
  lastSet?: { reps: number; weight: number | null };
  onUndo: () => void;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const firedRef = useRef(false);

  useEffect(() => {
    // Count against a real timestamp rather than counting ticks, so the timer
    // stays honest if the phone sleeps or the browser throttles the tab.
    const end = Date.now() + seconds * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        window.clearInterval(id);
        cueRestOver(cues);
        doneRef.current();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [seconds, cues]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;

  return (
    <>
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
          <p className="ring-time">
            {mins}:{String(secs).padStart(2, '0')}
          </p>
        </div>

        <div className="rest-next">
          <p className="label">Next up</p>
          <p className="rest-next-name">{nextLabel}</p>
        </div>
      </main>

      <div className="footer">
        <button className="btn-primary" onClick={onDone}>
          Skip the rest
        </button>
        {lastSet && (
          <p className="rest-logged">
            Logged: {lastSet.weight !== null ? `${lastSet.weight} kg × ` : ''}
            {lastSet.reps} reps
            <button className="undo" onClick={onUndo}>
              Undo
            </button>
          </p>
        )}
      </div>
    </>
  );
}

/* --- bike ----------------------------------------------------------------- */

function BikeStep({
  plan,
  hasBike,
  cues,
  onNext,
}: {
  plan: BikePlan;
  hasBike: boolean;
  cues: boolean;
  onNext: () => void;
}) {
  if (plan.kind === 'none') {
    return (
      <>
        <div className="body body-centre">
          <p className="label">Finisher</p>
          <h1 className="h1 step-title">Nothing hard today</h1>
          <p className="prose step-lead">{plan.note}</p>
        </div>
        <div className="footer">
          <button className="btn-primary" onClick={onNext}>
            Carry on
          </button>
        </div>
      </>
    );
  }

  if (plan.kind === 'steady') {
    return (
      <>
        <div className="body body-centre">
          <p className="label">Finisher · {plan.minutes} minutes</p>
          <h1 className="h1 step-title">Steady ride</h1>

          <div className="rampup-card">
            <p className="rampup-what">{plan.minutes} minutes, constant pace</p>
            <p className="rampup-how">Breathing hard, but in control</p>
          </div>

          <p className="prose step-lead">
            Not intervals — one steady effort the whole way.{' '}
            {hasBike
              ? 'Moderate resistance on the bike.'
              : 'A brisk walk, the stairs, or marching will do the same job.'}{' '}
            Extra energy burned for almost no extra tiredness.
          </p>
        </div>

        <div className="footer">
          <button className="btn-primary" onClick={onNext}>
            Done
          </button>
          <button className="btn-text" onClick={onNext}>
            Skip it today
          </button>
        </div>
      </>
    );
  }

  return (
    <IntervalPlayer plan={plan} hasBike={hasBike} cues={cues} onNext={onNext} />
  );
}

function IntervalPlayer({
  plan,
  hasBike,
  cues,
  onNext,
}: {
  plan: Extract<BikePlan, { kind: 'intervals' }>;
  hasBike: boolean;
  cues: boolean;
  onNext: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'hard' | 'easy'>('hard');
  const [left, setLeft] = useState(plan.hardSeconds);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running || finished) return;
    const end = Date.now() + left * 1000;

    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining > 0) return;

      window.clearInterval(id);
      if (phase === 'hard') {
        setPhase('easy');
        setLeft(plan.easySeconds);
        cueEasy(cues);
      } else if (round < plan.rounds) {
        setRound((r) => r + 1);
        setPhase('hard');
        setLeft(plan.hardSeconds);
        cueHard(cues);
      } else {
        setFinished(true);
      }
    }, 200);

    return () => window.clearInterval(id);
    // duration is only read to seed the interval; left carries the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round, finished, plan, cues]);

  const label = hasBike ? 'bike' : 'fast marching, stairs or a brisk walk';

  if (finished) {
    return (
      <>
        <div className="body body-centre">
          <p className="label">Finisher</p>
          <h1 className="h1 step-title">Intervals done</h1>
          <p className="prose step-lead">
            That is the hard part over. Cool-down next.
          </p>
        </div>
        <div className="footer">
          <button className="btn-primary" onClick={onNext}>
            Cool down
          </button>
        </div>
      </>
    );
  }

  if (!running) {
    return (
      <>
        <div className="body body-centre">
          <p className="label">Finisher · {plan.totalMinutes} minutes</p>
          <h1 className="h1 step-title">Intervals</h1>

          <div className="rampup-card">
            <p className="rampup-what">
              {plan.hardSeconds} seconds hard, {plan.easySeconds} seconds easy
            </p>
            <p className="rampup-how">{plan.rounds} times through</p>
          </div>

          <p className="prose step-lead">
            "Hard" means you could not hold a conversation. You do not need a
            heart-rate monitor — your breathing is the gauge. On the {label}.
          </p>
        </div>

        <div className="footer">
          <button
            className="btn-primary"
            onClick={() => {
              setRunning(true);
              cueHard(cues);
            }}
          >
            Start the intervals
          </button>
          <button className="btn-text" onClick={onNext}>
            Skip the finisher today
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <main className={`interval ${phase === 'hard' ? 'is-hard' : 'is-easy'}`}>
        <p className="label interval-round">
          Round {round} of {plan.rounds}
        </p>
        <p className="interval-phase">{phase === 'hard' ? 'HARD' : 'EASY'}</p>
        <p className="interval-time">{left}</p>
        <p className="interval-hint">
          {phase === 'hard'
            ? 'Too hard to talk in sentences.'
            : 'Spin it out. Get your breath back.'}
        </p>
      </main>

      <div className="footer">
        <button className="btn-quiet" onClick={onNext}>
          Stop the finisher
        </button>
      </div>
    </>
  );
}

/* --- the week 12 retest --------------------------------------------------- */

function RetestIntro({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="body body-centre">
        <p className="label">Week 12 · last session</p>
        <h1 className="h1 step-title">Today you find out.</h1>

        <div className="prose step-lead">
          <p>
            Three lifts. For each one, work up in a few steps to the heaviest
            set of 8 you can do with clean form — then log it.
          </p>
          <p>
            Clean form is the whole test. A heavier number with a rounded back
            or a bounce does not count, and you already know what good looks
            like.
          </p>
          <p>
            Then the usual arm work to finish, and that is twelve weeks done.
          </p>
        </div>
      </div>

      <div className="footer">
        <button className="btn-primary" onClick={onNext}>
          Start with the goblet squat
        </button>
      </div>
    </>
  );
}

function RetestStep({
  step,
  owned,
  onLog,
}: {
  step: Extract<Step, { kind: 'retest' }>;
  owned: number[];
  onLog: (reps: number, weight: number | null) => void;
}) {
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState<number | null>(step.startWeight);
  const [showForm, setShowForm] = useState(false);
  const lockedRef = useRef(false);
  const isPair = step.weightStyle === 'pair';

  function commit() {
    if (lockedRef.current) return;
    lockedRef.current = true;
    onLog(reps, weight);
  }

  return (
    <>
      <main className="logger">
        <div className="ex-head">
          <p className="ex-slot">
            <span className="ex-slot-letter">TEST</span>
            Heaviest clean set of 8
          </p>

          <button className="ex-name" onClick={() => setShowForm(true)}>
            {step.exercise.name}
            <span className="ex-name-hint">How to do it</span>
          </button>

          {/* The honest comparison. Week 1 was a submaximal working set at an
              easy effort, and today is a near-limit set — so the app shows
              both with their context rather than computing a percentage that
              would overstate the gain. */}
          {step.weekOne ? (
            <p className="retest-then">
              Back at the start:{' '}
              <strong>
                {step.weekOne.weight !== null
                  ? `${step.weekOne.weight} kg × ${step.weekOne.reps}`
                  : `${step.weekOne.reps} reps`}
              </strong>{' '}
              — and that was meant to feel easy.
            </p>
          ) : (
            <p className="ex-last">No earlier record of this one to compare.</p>
          )}
        </div>

        <p className="retest-hint">
          Build up in two or three steps rather than jumping straight to your
          heaviest. Log the best clean set you managed.
        </p>
      </main>

      <section className="console">
        <section className="stepper">
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
            onClick={() => setReps((r) => Math.min(30, r + 1))}
            aria-label="One more rep"
          >
            <Plus />
          </button>
        </section>

        {step.weightStyle !== 'none' && (
          <section className="weights">
            <p className="label weights-label">
              {isPair ? 'One in each hand' : 'One dumbbell'}
            </p>
            <div className="chips" role="group" aria-label="Dumbbell weight">
              {owned.map((kg) => (
                <button
                  key={kg}
                  className={`chip ${weight === kg ? 'is-on' : ''}`}
                  onClick={() => setWeight(kg)}
                  aria-pressed={weight === kg}
                  aria-label={`${kg} kilogram${isPair ? ' in each hand' : ''}`}
                >
                  {kg}
                  <span className="chip-unit">kg</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <button className="btn-primary" onClick={commit}>
          Log it and move on
        </button>
      </section>

      <Sheet
        open={showForm}
        onClose={() => setShowForm(false)}
        kicker="How to do it"
        title={step.exercise.name}
      >
        <ExerciseImage
          exerciseId={step.exercise.id}
          name={step.exercise.name}
        />
        <p className="lead">{step.exercise.cue}</p>
        <div className="block">
          <span className="label">The usual mistake</span>
          <p>{step.exercise.mistake}</p>
        </div>
      </Sheet>
    </>
  );
}

/* --- cool-down ------------------------------------------------------------ */

function CoolDownStep({
  hasBike,
  onNext,
}: {
  hasBike: boolean;
  onNext: () => void;
}) {
  const { state, dispatch } = useStore();
  const done = state.inProgress?.coolDownDone ?? [];

  return (
    <>
      <div className="body">
        <p className="label">About 5 minutes</p>
        <h1 className="h1 step-title">Cool-down</h1>
        <p className="prose step-lead">
          The last one tells your body the session is over. Worth doing.
        </p>

        <ul className="check-list">
          {COOL_DOWN.map((m) => {
            const sub = m.needsBike && !hasBike ? m.noBike! : null;
            const isDone = done.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  className={`check ${isDone ? 'is-done' : ''}`}
                  aria-pressed={isDone}
                  onClick={() => dispatch({ type: 'toggleCoolDown', id: m.id })}
                >
                  <span className="check-box" aria-hidden="true">
                    {isDone && <Tick />}
                  </span>
                  <span className="check-text">
                    <span className="check-name">{sub ? sub.name : m.name}</span>
                    <span className="check-amount">
                      {sub ? sub.amount : m.amount}
                    </span>
                    <span className="check-why">{sub ? sub.note : m.why}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="footer">
        <button className="btn-primary" onClick={onNext}>
          Finish the session
        </button>
      </div>
    </>
  );
}

/* --- summary -------------------------------------------------------------- */

function SummaryStep({
  week,
  dayId,
  sets,
  cues,
  onFinish,
}: {
  week: number;
  dayId: string;
  sets: { exerciseId: string; reps: number; weight: number | null }[];
  cues: boolean;
  onFinish: (bike: 'done' | 'skipped' | 'none') => void;
}) {
  const plan = planForWeek(week);
  const day = dayById(dayId);
  const isRetest = isRetestSession(dayId, week);

  useEffect(() => {
    cueDone(cues);
  }, [cues]);

  // Group by exercise, in the order they were done.
  const byExercise = new Map<string, { reps: number; weight: number | null }[]>();
  for (const s of sets) {
    const list = byExercise.get(s.exerciseId) ?? [];
    list.push({ reps: s.reps, weight: s.weight });
    byExercise.set(s.exerciseId, list);
  }

  const totalReps = sets.reduce((n, s) => n + s.reps, 0);

  return (
    <>
      <div className="body">
        <p className="label">
          {isRetest ? 'Twelve weeks · done' : `Week ${week} · done`}
        </p>
        <h1 className="h1 step-title">
          {isRetest
            ? "That's twelve weeks."
            : plan.isDeload
              ? 'Easy week, done properly.'
              : "That's the session."}
        </h1>

        <p className="prose step-lead">
          {isRetest
            ? 'You started this not knowing what a hinge was. Whatever the numbers say, you trained three times a week for twelve weeks — that was the hard part, and most people do not do it.'
            : plan.isDeload
              ? 'That was meant to feel too easy. You have done exactly what the week asked for.'
              : `${sets.length} sets, ${totalReps} reps.`}
        </p>

        <div className="summary-list">
          {[...byExercise.entries()].map(([id, list]) => {
            const name = day.exercises.find((e) => e.exerciseId === id);
            return (
              <div key={id} className="summary-row">
                <p className="summary-name">
                  <span className="summary-slot">{name?.slot}</span>
                  {id.replace(/-/g, ' ')}
                </p>
                <p className="summary-sets">
                  {list[0].weight !== null && (
                    <span className="summary-weight">{list[0].weight} kg</span>
                  )}
                  {list.map((s) => s.reps).join(' · ')}
                </p>
              </div>
            );
          })}
        </div>

        <p className="prose summary-note">
          {isRetest
            ? 'Your numbers from the start are on the Progress screen, next to these. That comparison is the real report card — not the scale.'
            : 'Nothing here is a score. The only thing that matters is that it is written down, so next week the app knows what to put in front of you.'}
        </p>
      </div>

      <div className="footer">
        <button className="btn-primary" onClick={() => onFinish('done')}>
          Save and finish
        </button>
      </div>
    </>
  );
}

/* --- icons ---------------------------------------------------------------- */

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

function Tick() {
  return (
    <svg viewBox="0 0 40 40" className="icon icon-tick" aria-hidden="true">
      <path d="M10 21l7 7 14-16" />
    </svg>
  );
}
