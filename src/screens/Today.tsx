import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { DAYS, blockIntro, dayById, planForWeek } from '../data/programme';
import { resolveExercise } from '../data/exercises';
import { benchKind } from '../state/engine';
import { completedWeeks } from '../state/progress';
import { progressionOffers } from '../state/progression';
import { Term } from '../components/Term';
import { Sheet } from '../components/Sheet';
import { primeAudio } from '../lib/cues';
import './Today.css';

/* ==========================================================================
   TODAY

   One card that answers one question: what am I doing now? Everything else on
   this screen is secondary to the Start button.
   ========================================================================== */

export function Today({
  onStart,
  onSettings,
  onProgress,
}: {
  onStart: () => void;
  onSettings: () => void;
  onProgress: () => void;
}) {
  const { state, dispatch } = useStore();
  const [showWeeks, setShowWeeks] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showDays, setShowDays] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const week = state.currentWeek;
  const plan = planForWeek(week);
  const intro = blockIntro(week);
  const equipment = state.settings!.equipment;
  const bench = benchKind(equipment);

  const resumable = state.inProgress;

  // Which days are already done this week. Used to suggest the next one —
  // never to mark a day as missed.
  const doneThisWeek = useMemo(
    () =>
      new Set(
        state.history.filter((h) => h.week === week).map((h) => h.dayId),
      ),
    [state.history, week],
  );

  const weekComplete = doneThisWeek.size === DAYS.length;
  const completed = useMemo(
    () => completedWeeks(state.history),
    [state.history],
  );

  // Once every session in the week is logged, the next thing is week N+1 —
  // not Day 1 again. Before that, suggest the first day not yet done.
  const nextWeek = week < 12 ? week + 1 : null;
  const allTwelveDone = completed.size === 12;
  const suggested =
    DAYS.find((d) => !doneThisWeek.has(d.id))?.id ?? DAYS[0].id;

  // While a session is half-finished, that is the day — she cannot be doing
  // two at once.
  const [chosenDay, setChosenDay] = useState<string | null>(null);
  const dayId = resumable?.dayId ?? chosenDay ?? suggested;
  const day = dayById(dayId);

  const exerciseNames = day.exercises.map(
    (e) => resolveExercise(e.exerciseId, bench).name,
  );

  // Has she earned a step up the ladder on this day's work?
  const offers = useMemo(
    () =>
      progressionOffers(
        day,
        equipment,
        state.history,
        state.adjustments,
        (id) => resolveExercise(id, bench).name,
      ),
    [day, equipment, state.history, state.adjustments, bench],
  );
  const offer = resumable ? undefined : offers[0];

  function start() {
    // Unlocks sound on iOS while she is definitely touching the screen, so
    // the rest-over tone works later when she is not.
    primeAudio();
    if (!resumable) {
      dispatch({ type: 'startSession', dayId: day.id, week });
    }
    onStart();
  }

  /** Move to the next week and start its first session. */
  function startNextWeek() {
    if (nextWeek === null) return;
    primeAudio();
    dispatch({ type: 'setWeek', week: nextWeek });
    setChosenDay(null);
    dispatch({ type: 'startSession', dayId: DAYS[0].id, week: nextWeek });
    onStart();
  }

  return (
    <div className="screen">
      <div className="body today">
        <header className="today-top">
          <button className="today-week" onClick={() => setShowWeeks(true)}>
            <span className="label">Week</span>
            <span className="today-week-n">{week}</span>
            <span className="today-week-of">of 12</span>
          </button>

          <div className="today-block">
            <p className="label">
              <Term k="block">Block {plan.block}</Term>
            </p>
            {plan.isDeload && <p className="today-tag is-deload">Easy week</p>}
            {plan.isRetestWeek && <p className="today-tag">Final week</p>}
            <div className="today-links">
              <button className="today-settings" onClick={onProgress}>
                Progress
              </button>
              <button className="today-settings" onClick={onSettings}>
                Your kit
              </button>
            </div>
          </div>
        </header>

        {intro && (
          <button
            className={`today-intro ${intro.tone === 'deload' ? 'is-deload' : ''}`}
            onClick={() => setShowIntro(true)}
          >
            <span className="label">What's different this week</span>
            <span className="today-intro-title">{intro.title}</span>
            <span className="today-intro-more">Read it — one tap</span>
          </button>
        )}

        {/* The progression rule, running itself. This is the thing the PDF
            asks her to do by hand every week. */}
        {offer && (
          <div className="levelup">
            <p className="label levelup-kicker">You've earned a step up</p>
            <p className="levelup-ex">{offer.exerciseName}</p>
            <p className="levelup-head">{offer.headline}</p>
            <button className="levelup-why" onClick={() => setShowWhy(true)}>
              Why this, and not just more weight?
            </button>

            <div className="levelup-actions">
              <button
                className="btn-primary"
                onClick={() =>
                  dispatch({
                    type: 'applyProgression',
                    exerciseId: offer.exerciseId,
                    step: offer.step,
                    newWeight: offer.newWeight,
                  })
                }
              >
                Do it
              </button>
              <button
                className="btn-text"
                onClick={() =>
                  dispatch({
                    type: 'declineProgression',
                    exerciseId: offer.exerciseId,
                  })
                }
              >
                Not yet — keep it the same
              </button>
            </div>
          </div>
        )}

        <div className="today-card">
          <div className="today-card-top">
            <p className="label">
              {resumable ? 'Half finished' : `Day ${day.number}`}
            </p>
            {!resumable && (
              <button className="today-swap" onClick={() => setShowDays(true)}>
                Different day
              </button>
            )}
          </div>

          <h1 className="h1 today-name">{day.title}</h1>
          <p className="today-focus">{day.focus}</p>

          <ol className="today-list">
            {exerciseNames.map((n, i) => (
              <li key={i} className="today-list-item">
                <span className="today-list-slot">{day.exercises[i].slot}</span>
                {n}
              </li>
            ))}
          </ol>

          <p className="today-meta">
            {plan.setsA} <Term k="set">sets</Term> on the first pair ·{' '}
            {plan.rest} seconds <Term k="rest">rest</Term>
          </p>
        </div>

        {/* Where you are this week, at a glance. */}
        <div className="daytrack" aria-label={`${doneThisWeek.size} of ${DAYS.length} sessions done this week`}>
          {DAYS.map((d) => {
            const isDone = doneThisWeek.has(d.id);
            const isNow = !isDone && d.id === dayId;
            return (
              <div
                key={d.id}
                className={`daytrack-cell ${isDone ? 'is-done' : ''} ${isNow ? 'is-now' : ''}`}
              >
                <span className="daytrack-mark" aria-hidden="true">
                  {isDone ? <Tick /> : d.number}
                </span>
                <span className="daytrack-label">
                  {isDone ? 'done' : isNow ? 'next' : `day ${d.number}`}
                </span>
              </div>
            );
          })}
        </div>

        {weekComplete && !resumable && (
          <p className="today-done">
            {nextWeek === null
              ? 'Twelve weeks, finished. Nothing owed and nothing outstanding.'
              : 'All three sessions logged. Nothing owed — move on whenever you are ready.'}
          </p>
        )}
      </div>

      <div className="footer">
        {/* A finished week must not leave her staring at "Start the session"
            for a session she has already done. The next thing becomes the
            next week — one tap, but still her decision, because repeating a
            week is a legitimate choice the programme explicitly allows. */}
        {allTwelveDone && !resumable ? (
          /* The end of the programme. The payoff is the comparison, not
             another session — so that is what the button does. */
          <>
            <button className="btn-primary" onClick={onProgress}>
              See what changed
            </button>
            <button className="btn-text" onClick={start}>
              Or train again — the programme says this is probably the first of
              several blocks
            </button>
          </>
        ) : weekComplete && !resumable && nextWeek !== null ? (
          <>
            <button className="btn-primary" onClick={startNextWeek}>
              Start week {nextWeek}
            </button>
            <button className="btn-text" onClick={start}>
              Or do a week {week} session again
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={start}>
            {resumable ? 'Carry on where you left off' : 'Start the session'}
          </button>
        )}

        {resumable && (
          <button
            className="btn-text"
            onClick={() => {
              if (
                confirm(
                  'Throw away the half-finished session and start again from the beginning?',
                )
              ) {
                dispatch({ type: 'abandonSession' });
              }
            }}
          >
            Start again from the beginning
          </button>
        )}
      </div>

      {/* Which day. The programme says days can move around the week, so she
          picks; the app only suggests. */}
      <Sheet
        open={showDays}
        onClose={() => setShowDays(false)}
        kicker="Pick a day"
        title="Which session?"
      >
        <p className="lead">
          The order is up to you. The only rule the programme gives is to leave
          at least one full day between sessions, and not to do all three back
          to back.
        </p>

        <div className="day-list">
          {DAYS.map((d) => {
            const isDone = doneThisWeek.has(d.id);
            return (
              <button
                key={d.id}
                className={`day-row ${d.id === dayId ? 'is-on' : ''} ${isDone ? 'is-done' : ''}`}
                onClick={() => {
                  setChosenDay(d.id);
                  setShowDays(false);
                }}
              >
                <span className="day-row-n">Day {d.number}</span>
                <span className="day-row-name">{d.title}</span>
                {isDone && (
                  <span className="day-row-state">
                    <Tick /> done this week
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* Which week am I on? She controls this — the app never silently moves
          her on, because a missed week should not become a missed block. */}
      <Sheet
        open={showWeeks}
        onClose={() => setShowWeeks(false)}
        kicker="Where you are"
        title="Which week are you on?"
      >
        <p className="lead">
          You choose this. The app will not move you on by itself, and there is
          no penalty for repeating a week — the programme says a bad week is
          worth repeating rather than pushing through.
        </p>

        <div className="week-grid">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
            const p = planForWeek(w);
            const isDone = completed.has(w);
            return (
              <button
                key={w}
                className={`week-cell ${w === week ? 'is-on' : ''} ${
                  p.isDeload ? 'is-deload' : ''
                } ${isDone ? 'is-done' : ''}`}
                aria-label={`Week ${w}${isDone ? ', all three sessions done' : ''}`}
                onClick={() => {
                  dispatch({ type: 'setWeek', week: w });
                  setShowWeeks(false);
                }}
              >
                <span className="week-cell-n">{w}</span>
                <span className="week-cell-b">
                  {isDone ? (
                    <Tick />
                  ) : p.isDeload ? (
                    'easy'
                  ) : p.isRetestWeek ? (
                    'last'
                  ) : (
                    `b${p.block}`
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {intro && (
        <Sheet
          open={showIntro}
          onClose={() => setShowIntro(false)}
          kicker="What's different this week"
          title={intro.title}
        >
          {intro.lines.map((l, i) => (
            <p key={i} className={i === 0 ? 'lead' : undefined}>
              {l}
            </p>
          ))}
        </Sheet>
      )}

      {offer && (
        <Sheet
          open={showWhy}
          onClose={() => setShowWhy(false)}
          kicker="Why this step"
          title={offer.headline}
        >
          <p className="lead">{offer.because}</p>
          <p>
            You hit the top of the rep range on every set, at the right effort,
            two sessions running. That is the programme's rule for making an
            exercise harder.
          </p>
          <p>
            Weight is only the first rung of the ladder. Where the jump to your
            next dumbbell is too big, slowing the lowering, pausing, working one
            side at a time or adding reps all make the same dumbbell harder —
            and they are often the better choice.
          </p>
          <p className="sheet-note">
            Only one exercise moves up at a time, so if something gets sore you
            know what caused it.
          </p>
        </Sheet>
      )}
    </div>
  );
}

/* A tick, drawn rather than an emoji so it inherits colour and matches the
   stroke weight of the rest of the interface. */
function Tick() {
  return (
    <svg className="tick" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 13l4.5 4.5L19 7" />
    </svg>
  );
}
