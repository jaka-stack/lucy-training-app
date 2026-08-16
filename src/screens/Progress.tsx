import { useState } from 'react';
import { useStore } from '../state/store';
import { EXERCISES } from '../data/exercises';
import { RETEST_LIFTS } from '../data/programme';
import {
  daysSinceLastSession,
  exerciseProgress,
  trainingTotals,
} from '../state/progress';
import { weekOnWeek, weeklySummaries } from '../state/checkins';
import { Sheet } from '../components/Sheet';
import './Progress.css';

/* ==========================================================================
   PROGRESS

   The brief asked how this stays motivating in the weeks when the scale does
   not move. The programme answers that itself: strength climbs fast for a
   beginner, and the scale can go UP for the first three weeks while nothing
   at all is wrong.

   So the top of this screen is what she can lift now that she could not lift
   before. The weight and waist log, if she has turned it on at all, sits at
   the bottom, shows weekly averages only, and has no goal line.
   ========================================================================== */

export function Progress({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showScaleNote, setShowScaleNote] = useState(false);

  const totals = trainingTotals(state.history);
  const progress = exerciseProgress(state.history).filter((p) => p.sentence);
  const sinceLast = daysSinceLastSession(state.history);
  const checkInOn = state.settings?.checkInEnabled ?? false;
  const summaries = weeklySummaries(state.checkIns);
  const change = weekOnWeek(state.checkIns);

  const nameFor = (id: string) => EXERCISES[id]?.name ?? id;

  const retestDone = state.history.some((h) =>
    h.sets.some((s) => s.slot === 'RETEST'),
  );

  return (
    <div className="screen">
      <header className="set-hdr">
        <button className="set-back" onClick={onClose}>
          Back
        </button>
        <p className="label">Progress</p>
      </header>

      <div className="body">
        {state.history.length === 0 ? (
          <div className="prog-empty">
            <h1 className="h2">Nothing to show yet.</h1>
            <p className="prose">
              After a couple of sessions this page will show what has changed —
              starting with what you can lift.
            </p>
          </div>
        ) : (
          <>
            <section>
              <p className="label">So far</p>
              <div className="prog-totals">
                <Stat n={totals.sessions} label="sessions" />
                <Stat n={totals.weeksTrained} label="weeks trained" />
                <Stat n={totals.sets} label="sets logged" />
              </div>
              {sinceLast !== null && sinceLast >= 7 && (
                <p className="prog-gap">
                  Last session was {sinceLast} days ago. Pick up wherever you
                  like — nothing is lost, and there is nothing to make up.
                </p>
              )}
            </section>

            {/* The main event: what has actually changed. */}
            <section className="prog-section">
              <p className="label">What has changed</p>

              {progress.length === 0 ? (
                <p className="prose prog-note">
                  Nothing to compare yet — this fills in once you have done the
                  same exercise twice.
                </p>
              ) : (
                <ul className="prog-list">
                  {progress.map((p) => (
                    <li key={p.exerciseId} className="prog-row">
                      <span className="prog-ex">{nameFor(p.exerciseId)}</span>
                      <span
                        className={`prog-change ${p.improved ? 'is-up' : ''}`}
                      >
                        {p.sentence}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="prose prog-note">
                Strength is the thing that moves first and fastest for a
                beginner. It is also the most honest measure of the training
                itself.
              </p>
            </section>

            {retestDone && (
              <section className="prog-section">
                <p className="label">Week 1 against week 12</p>
                <ul className="prog-list">
                  {RETEST_LIFTS.map((id) => {
                    const p = progress.find((x) => x.exerciseId === id)
                      ?? exerciseProgress(state.history).find(
                        (x) => x.exerciseId === id,
                      );
                    if (!p) return null;
                    // Only claim an improvement where there is one. A lift
                    // that did not move is stated flatly rather than dressed
                    // up — the whole point of this page is that it is honest.
                    const wentUp =
                      (p.latest.weight ?? 0) > (p.first.weight ?? 0) ||
                      ((p.latest.weight ?? 0) === (p.first.weight ?? 0) &&
                        p.latest.reps > p.first.reps);
                    return (
                      <li key={id} className="prog-row">
                        <span className="prog-ex">{nameFor(id)}</span>
                        <span
                          className={`prog-change ${wentUp ? 'is-up' : ''}`}
                        >
                          {p.first.weight ?? '–'} kg × {p.first.reps} →{' '}
                          {p.latest.weight ?? '–'} kg × {p.latest.reps}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="prose prog-note">
                  Worth being straight about the comparison: your week 1 sets
                  were meant to feel easy, and the retest was near your limit,
                  so the two are not quite like for like.
                </p>
                <p className="prose prog-note">
                  A lift that did not move is not a failure either. Strength
                  moves in fits and starts, and one number on one day is a
                  worse measure than twelve weeks of showing up.
                </p>
              </section>
            )}

            {/* Weight and waist. Opt-in, understated, weekly averages only. */}
            <section className="prog-section">
              <p className="label">Weight and waist</p>

              {!checkInOn ? (
                <>
                  <p className="prose prog-note">
                    Off. You do not need it — the programme is clear that
                    training changes the shape and nutrition decides the fat
                    loss, and that the scale can rise for the first three weeks
                    while everything is going right.
                  </p>
                  <button
                    className="btn-quiet prog-enable"
                    onClick={() =>
                      dispatch({
                        type: 'updateSettings',
                        settings: { ...state.settings!, checkInEnabled: true },
                      })
                    }
                  >
                    Turn the weekly log on
                  </button>
                </>
              ) : (
                <>
                  {summaries.length === 0 && (
                    <p className="prose prog-note">
                      Nothing logged yet. Weigh yourself at the same time of
                      day, a couple of times a week.
                    </p>
                  )}

                  {summaries.length > 0 && (
                    <ul className="prog-list">
                      {summaries.map((s) => (
                        <li key={s.week} className="prog-row">
                          <span className="prog-ex">Week {s.week}</span>
                          <span className="prog-change">
                            {s.weightKg !== undefined
                              ? `${s.weightKg} kg avg`
                              : s.weightTooFew
                                ? 'one reading — not enough to average'
                                : '—'}
                            {s.waistCm !== undefined && ` · ${s.waistCm} cm`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {change && (
                    <p className="prose prog-note">
                      Week {change.from} to week {change.to}:{' '}
                      {change.change === 0
                        ? 'no change in the weekly average'
                        : `${change.change > 0 ? 'up' : 'down'} ${Math.abs(change.change)} kg on the weekly average`}
                      .
                    </p>
                  )}

                  <button
                    className="btn-quiet prog-enable"
                    onClick={() => setShowAdd(true)}
                  >
                    Add a reading
                  </button>

                  <button
                    className="prog-why"
                    onClick={() => setShowScaleNote(true)}
                  >
                    Why only weekly averages?
                  </button>
                </>
              )}
            </section>
          </>
        )}
      </div>

      <AddReading
        open={showAdd}
        week={state.currentWeek}
        onClose={() => setShowAdd(false)}
        onSave={(weightKg, waistCm) => {
          dispatch({ type: 'addCheckIn', weightKg, waistCm });
          setShowAdd(false);
        }}
      />

      <Sheet
        open={showScaleNote}
        onClose={() => setShowScaleNote(false)}
        kicker="About the scale"
        title="Why only weekly averages?"
      >
        <p className="lead">
          A single morning's weight is close to meaningless. Food, salt, water
          and your cycle move it by more than a week of fat loss does.
        </p>
        <p>
          New training also makes muscles hold extra water, so the number can
          rise by half a kilo to a kilo and a half in the first three weeks
          while everything is going exactly right.
        </p>
        <p>
          That is why this app never shows you a single day's number back, and
          why it wants at least two readings before it will average a week.
          Compare a week to the week before, and nothing else.
        </p>
        <p className="sheet-note">
          Waist, clothes, and what you can lift are all better signals than the
          scale. So are photos every four weeks — keep those in your camera
          roll; this app does not want them.
        </p>
      </Sheet>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stat">
      <span className="stat-n">{n}</span>
      <span className="stat-l">{label}</span>
    </div>
  );
}

function AddReading({
  open,
  week,
  onClose,
  onSave,
}: {
  open: boolean;
  week: number;
  onClose: () => void;
  onSave: (weightKg?: number, waistCm?: number) => void;
}) {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');

  const w = parseFloat(weight);
  const c = parseFloat(waist);
  const anything = Number.isFinite(w) || Number.isFinite(c);

  return (
    <Sheet open={open} onClose={onClose} kicker={`Week ${week}`} title="Add a reading">
      <p className="lead">
        Morning, after the loo, before food — and the same conditions each
        time. Fill in either, or both.
      </p>

      <label className="field">
        <span className="label">Weight (kg)</span>
        <input
          className="field-input"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="—"
        />
      </label>

      <label className="field">
        <span className="label">Waist at the navel (cm)</span>
        <input
          className="field-input"
          type="number"
          inputMode="decimal"
          step="0.5"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          placeholder="—"
        />
      </label>

      <button
        className="btn-primary field-save"
        disabled={!anything}
        onClick={() => {
          onSave(
            Number.isFinite(w) ? w : undefined,
            Number.isFinite(c) ? c : undefined,
          );
          setWeight('');
          setWaist('');
        }}
      >
        Save it
      </button>

      <p className="sheet-note">
        You will not see this number again on its own — only as part of a
        weekly average.
      </p>
    </Sheet>
  );
}
