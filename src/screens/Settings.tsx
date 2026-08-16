import { useState } from 'react';
import { useStore } from '../state/store';
import { DUMBBELL_OPTIONS } from '../data/kit';
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
    </div>
  );
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
