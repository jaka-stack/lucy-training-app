import { useState } from 'react';
import { useStore } from '../state/store';
import { DAY_1, blockIntro, planForWeek } from '../data/programme';
import { resolveExercise } from '../data/exercises';
import { Term } from '../components/Term';
import { Sheet } from '../components/Sheet';
import { primeAudio } from '../lib/cues';
import './Today.css';

/* ==========================================================================
   TODAY

   One card that answers one question: what am I doing now? Everything else on
   this screen is secondary to the Start button.
   ========================================================================== */

export function Today({ onStart }: { onStart: () => void }) {
  const { state, dispatch } = useStore();
  const [showWeeks, setShowWeeks] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const week = state.currentWeek;
  const plan = planForWeek(week);
  const intro = blockIntro(week);
  const equipment = state.settings!.equipment;

  const resumable = state.inProgress;
  const doneThisWeek = state.history.filter((h) => h.week === week).length;

  const exerciseNames = DAY_1.exercises.map(
    (e) => resolveExercise(e.exerciseId, equipment.hasBench).name,
  );

  function start() {
    // Unlocks sound on iOS while she is definitely touching the screen, so
    // the rest-over tone works later when she is not.
    primeAudio();
    if (!resumable) {
      dispatch({ type: 'startSession', dayId: DAY_1.id, week });
    }
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

        <div className="today-card">
          <p className="label">
            {resumable ? 'Half finished' : `Day ${DAY_1.number}`}
          </p>
          <h1 className="h1 today-name">{DAY_1.title}</h1>
          <p className="today-focus">{DAY_1.focus}</p>

          <ol className="today-list">
            {exerciseNames.map((n, i) => (
              <li key={i} className="today-list-item">
                <span className="today-list-slot">
                  {DAY_1.exercises[i].slot}
                </span>
                {n}
              </li>
            ))}
          </ol>

          <p className="today-meta">
            {plan.setsA} <Term k="set">sets</Term> on the first pair ·{' '}
            {plan.rest} seconds <Term k="rest">rest</Term>
          </p>
        </div>

        {doneThisWeek > 0 && (
          <p className="today-done">
            {doneThisWeek} session{doneThisWeek > 1 ? 's' : ''} logged this week.
          </p>
        )}
      </div>

      <div className="footer">
        <button className="btn-primary" onClick={start}>
          {resumable ? 'Carry on where you left off' : 'Start the session'}
        </button>

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
            return (
              <button
                key={w}
                className={`week-cell ${w === week ? 'is-on' : ''} ${
                  p.isDeload ? 'is-deload' : ''
                }`}
                onClick={() => {
                  dispatch({ type: 'setWeek', week: w });
                  setShowWeeks(false);
                }}
              >
                <span className="week-cell-n">{w}</span>
                <span className="week-cell-b">
                  {p.isDeload ? 'easy' : p.isRetestWeek ? 'last' : `b${p.block}`}
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
    </div>
  );
}
