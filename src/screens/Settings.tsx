import { useState } from 'react';
import { useStore } from '../state/store';
import { DUMBBELL_OPTIONS } from '../data/kit';
import { downloadBackup, parseBackup } from '../state/storage';
import { Sheet } from '../components/Sheet';
import { HoldToConfirm } from '../components/HoldToConfirm';
import './Setup.css';
import './Settings.css';

/* ==========================================================================
   SETTINGS

   Everything the first-run questions asked, changeable afterwards. The setup
   screen promises "you can change any of this later", and for a while it was
   lying — there was nowhere to change it, and the only way out of a wrong
   answer was clearing the browser's storage, which would have taken every
   logged session with it.

   Changing equipment deliberately does NOT touch anything already logged.
   Past sessions record what she actually lifted; they are history, not a
   prescription, and rewriting them would be dishonest.
   ========================================================================== */

export function Settings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const current = state.settings!;

  const [dumbbells, setDumbbells] = useState<number[]>(
    current.equipment.dumbbells,
  );
  const [bench, setBench] = useState<'none' | 'flat' | 'incline'>(
    current.equipment.benchInclines
      ? 'incline'
      : current.equipment.hasBench
        ? 'flat'
        : 'none',
  );
  const [bike, setBike] = useState(current.equipment.hasBike);
  const [cues, setCues] = useState(current.cues);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showErase, setShowErase] = useState(false);
  const [backedUp, setBackedUp] = useState(false);

  const changed =
    JSON.stringify(dumbbells.slice().sort((a, b) => a - b)) !==
      JSON.stringify(current.equipment.dumbbells.slice().sort((a, b) => a - b)) ||
    bench !==
      (current.equipment.benchInclines
        ? 'incline'
        : current.equipment.hasBench
          ? 'flat'
          : 'none') ||
    bike !== current.equipment.hasBike ||
    cues !== current.cues;

  function save() {
    dispatch({
      type: 'updateSettings',
      settings: {
        ...current,
        cues,
        equipment: {
          dumbbells: [...dumbbells].sort((a, b) => a - b),
          hasBench: bench !== 'none',
          benchInclines: bench === 'incline',
          hasBike: bike,
        },
      },
    });
    onClose();
  }

  const sessionCount = state.history.length;
  const adjustmentCount = Object.keys(state.adjustments).length;

  return (
    <div className="screen">
      <header className="set-hdr">
        <button className="set-back" onClick={onClose}>
          Back
        </button>
        <p className="label">Your kit</p>
      </header>

      <div className="body">
        <section className="set-block">
          <h2 className="h2">Dumbbells</h2>
          <p className="prose setup-help">
            The app only ever suggests weights from this list.
          </p>

          <div className="db-grid">
            {DUMBBELL_OPTIONS.map((kg) => {
              const on = dumbbells.includes(kg);
              return (
                <button
                  key={kg}
                  className={`db-chip ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  aria-label={`${kg} kilogram pair`}
                  onClick={() =>
                    setDumbbells((d) =>
                      on ? d.filter((x) => x !== kg) : [...d, kg],
                    )
                  }
                >
                  {kg}
                  <span className="db-unit">kg</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="set-block">
          <h2 className="h2">Bench</h2>
          <div className="choices">
            <Row
              label="Yes, and it adjusts"
              detail="The back can be set upright or on a slope"
              on={bench === 'incline'}
              onPick={() => setBench('incline')}
            />
            <Row
              label="Yes, a flat one"
              detail="It does not adjust"
              on={bench === 'flat'}
              onPick={() => setBench('flat')}
            />
            <Row
              label="No bench"
              detail="Sofa and floor versions instead"
              on={bench === 'none'}
              onPick={() => setBench('none')}
            />
          </div>
        </section>

        <section className="set-block">
          <h2 className="h2">Bike</h2>
          <div className="choices">
            <Row
              label="Yes"
              detail="Warm-ups and finishers use it"
              on={bike}
              onPick={() => setBike(true)}
            />
            <Row
              label="No bike"
              detail="Walking, marching or stairs instead"
              on={!bike}
              onPick={() => setBike(false)}
            />
          </div>
        </section>

        <section className="set-block">
          <h2 className="h2">Sound and vibration</h2>
          <p className="prose setup-help">
            A tone and a buzz when a rest ends or an interval changes, so you do
            not have to watch the screen.
          </p>
          <div className="choices">
            <Row
              label="On"
              detail="Recommended — the phone is usually on the floor"
              on={cues}
              onPick={() => setCues(true)}
            />
            <Row
              label="Off"
              detail="Silent"
              on={!cues}
              onPick={() => setCues(false)}
            />
          </div>
        </section>

        <section className="set-block">
          <h2 className="h2">Your data</h2>
          <p className="prose setup-help">
            {sessionCount === 0
              ? 'Nothing logged yet.'
              : `${sessionCount} session${sessionCount === 1 ? '' : 's'} logged, stored on this phone only.`}
          </p>
          <p className="prose setup-help">
            Changing your kit above does not alter anything already logged —
            past sessions record what you actually lifted.
          </p>

          {/* There is no cloud behind this app, so a cleared browser would be
              total data loss. This makes that an annoyance instead. */}
          <button
            className="btn-quiet set-action"
            onClick={() => downloadBackup(state)}
          >
            Save a backup file
          </button>

          <label className="btn-quiet set-action set-file">
            Restore from a backup
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = ''; // let the same file be picked again
                if (!file) return;

                const result = parseBackup(await file.text());
                if (!result.ok) {
                  setRestoreError(result.reason);
                  return;
                }
                if (
                  !confirm(
                    'Restoring replaces everything currently in the app — every logged session and setting. Carry on?',
                  )
                )
                  return;

                dispatch({ type: 'replaceAll', state: result.state });
                onClose();
              }}
            />
          </label>

          {restoreError && <p className="set-warn">{restoreError}</p>}

          <p className="prose setup-help">
            Worth doing every few weeks. The file is yours — it goes wherever
            you save it and nowhere else.
          </p>
        </section>

        <section className="set-block">
          <h2 className="h2">Erase everything</h2>
          <p className="prose setup-help">
            Wipes this phone's copy back to the very beginning — every logged
            session, your kit answers, everything. There is no undo, and no
            copy anywhere else.
          </p>
          <button
            className="btn-quiet set-action set-danger"
            onClick={() => setShowErase(true)}
          >
            Erase everything…
          </button>
        </section>

        <section className="set-block">
          <h2 className="h2">This version</h2>
          <p className="prose setup-help">
            Updated {formatBuilt(__BUILT_AT__)}.
          </p>
          <p className="prose setup-help">
            {navigator.onLine
              ? 'Online. Updates arrive by themselves when you open the app.'
              : 'Offline — and working normally, which is how it should be.'}
          </p>
        </section>
      </div>

      <div className="footer">
        <button className="btn-primary" disabled={!changed} onClick={save}>
          {changed ? 'Save changes' : 'Nothing changed'}
        </button>
        {dumbbells.length === 0 && (
          <p className="set-warn">
            Pick at least one dumbbell — most of the programme needs one.
          </p>
        )}
      </div>

      {/* Deliberately effortful. Everything it can destroy is listed by name
          and number, a backup is offered first, and the action itself needs a
          two-second hold rather than a tap. */}
      <Sheet
        open={showErase}
        onClose={() => setShowErase(false)}
        kicker="This cannot be undone"
        title="Erase everything?"
      >
        <p className="lead">You would lose:</p>

        <ul className="erase-list">
          <li>
            <strong>{sessionCount}</strong> logged{' '}
            {sessionCount === 1 ? 'session' : 'sessions'}
          </li>
          <li>
            <strong>{state.checkIns.length}</strong> weight and waist{' '}
            {state.checkIns.length === 1 ? 'reading' : 'readings'}
          </li>
          <li>
            every step up the ladder you have earned
            {adjustmentCount > 0 && <> ({adjustmentCount} so far)</>}
          </li>
          <li>your dumbbells, bench and bike answers</li>
        </ul>

        <p>
          The app would go back to the first-run questions, as though it had
          never been opened. Nothing is kept anywhere else — not on GitHub, not
          in any account — so there is nothing to restore from afterwards.
        </p>

        <div className="block">
          <span className="label">Take the backup first</span>
          <p>
            Thirty seconds now, and everything above can be put back later.
          </p>
          <button
            className="btn-quiet set-action"
            onClick={() => {
              downloadBackup(state);
              setBackedUp(true);
            }}
          >
            {backedUp ? 'Backup saved — save another' : 'Save a backup file'}
          </button>
        </div>

        <div className="erase-action">
          <HoldToConfirm
            label="Hold to erase everything"
            holdingLabel="Keep holding…"
            onConfirm={() => {
              dispatch({ type: 'eraseEverything' });
            }}
          />
          <button className="btn-text" onClick={() => setShowErase(false)}>
            Keep my data — go back
          </button>
        </div>
      </Sheet>
    </div>
  );
}

/** "16 August 2026, 14:32" — readable, and precise enough to tell two builds
    on the same day apart. */
function formatBuilt(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}, ${d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return iso;
  }
}

function Row({
  label,
  detail,
  on,
  onPick,
}: {
  label: string;
  detail: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      className={`choice ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      onClick={onPick}
    >
      <span className="choice-label">{label}</span>
      <span className="choice-detail">{detail}</span>
    </button>
  );
}
