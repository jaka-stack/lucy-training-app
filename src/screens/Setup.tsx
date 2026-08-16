import { useState } from 'react';
import { useStore } from '../state/store';
import type { Equipment } from '../state/types';
import './Setup.css';

/* ==========================================================================
   FIRST RUN

   Three questions, then she trains. The programme was written for one
   person's kit; this is what lets it fit anyone else's.

   Tone matters here more than anywhere. This is the first thing she sees, and
   she may be nervous about the whole idea. Nothing on these screens should
   sound like a fitness app.
   ========================================================================== */

/** Common dumbbell sizes, in kg. Covers fixed sets and most adjustables. */
const DUMBBELL_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 17.5, 20, 22.5, 25, 30];

type Stage = 'welcome' | 'dumbbells' | 'bench' | 'bike';

export function Setup() {
  const { dispatch } = useStore();
  const [stage, setStage] = useState<Stage>('welcome');

  const [dumbbells, setDumbbells] = useState<number[]>([]);
  const [bench, setBench] = useState<'none' | 'flat' | 'incline' | null>(null);
  const [bike, setBike] = useState<boolean | null>(null);

  function finish(hasBike: boolean) {
    const equipment: Equipment = {
      dumbbells: [...dumbbells].sort((a, b) => a - b),
      hasBench: bench === 'flat' || bench === 'incline',
      benchInclines: bench === 'incline',
      hasBike,
    };
    dispatch({
      type: 'finishSetup',
      settings: {
        equipment,
        startedOn: new Date().toISOString(),
        cues: true,
      },
    });
  }

  if (stage === 'welcome') {
    return (
      <div className="screen">
        <div className="body setup-welcome">
          <p className="label">A 12-week plan</p>
          <h1 className="h1 setup-title">
            Three sessions a week.
            <br />
            About 40 minutes each.
          </h1>

          <div className="prose setup-intro">
            <p>
              This app walks you through one session at a time. It tells you what
              to do next, so you never have to work out where you are.
            </p>
            <p>
              Anything you do not recognise will explain itself — tap any word
              with a dotted line under it.
            </p>
            <p>
              Everything stays on this phone. No account, and it works with no
              internet.
            </p>
          </div>
        </div>

        <div className="footer">
          <button className="btn-primary" onClick={() => setStage('dumbbells')}>
            Start
          </button>
          <p className="setup-foot">First, three questions about your kit.</p>
        </div>
      </div>
    );
  }

  if (stage === 'dumbbells') {
    return (
      <div className="screen">
        <div className="body">
          <p className="label">Question 1 of 3</p>
          <h1 className="h2 setup-q">Which dumbbells do you have?</h1>
          <p className="prose setup-help">
            Tap every weight you own a pair of. The app will only ever suggest
            weights from this list.
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

          <p className="prose setup-help">
            Only got one of each rather than pairs? Pick them anyway — the app
            will tell you when an exercise needs two.
          </p>
        </div>

        <div className="footer">
          <button
            className="btn-primary"
            disabled={dumbbells.length === 0}
            onClick={() => setStage('bench')}
          >
            {dumbbells.length === 0
              ? 'Pick at least one'
              : `Next — ${dumbbells.length} selected`}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'bench') {
    return (
      <div className="screen">
        <div className="body">
          <p className="label">Question 2 of 3</p>
          <h1 className="h2 setup-q">Do you have a bench?</h1>
          <p className="prose setup-help">
            If not, that is genuinely fine — a sofa, a chair or the stairs will
            cover everything, and the app will tell you which to use.
          </p>

          <div className="choices">
            <Choice
              label="Yes, and it adjusts"
              detail="The back can be set upright or on a slope"
              on={bench === 'incline'}
              onPick={() => setBench('incline')}
            />
            <Choice
              label="Yes, a flat one"
              detail="It does not adjust"
              on={bench === 'flat'}
              onPick={() => setBench('flat')}
            />
            <Choice
              label="No bench"
              detail="The app will swap in sofa and floor versions"
              on={bench === 'none'}
              onPick={() => setBench('none')}
            />
          </div>
        </div>

        <div className="footer">
          <button
            className="btn-primary"
            disabled={bench === null}
            onClick={() => setStage('bike')}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="body">
        <p className="label">Question 3 of 3</p>
        <h1 className="h2 setup-q">Do you have an exercise bike?</h1>
        <p className="prose setup-help">
          It is used to warm up, to cool down, and for a short burst at the end
          of some sessions. Without one, walking and marching do the same job.
        </p>

        <div className="choices">
          <Choice
            label="Yes"
            detail="Warm-ups and finishers will use it"
            on={bike === true}
            onPick={() => setBike(true)}
          />
          <Choice
            label="No bike"
            detail="Walking, marching or stairs instead"
            on={bike === false}
            onPick={() => setBike(false)}
          />
        </div>
      </div>

      <div className="footer">
        <button
          className="btn-primary"
          disabled={bike === null}
          onClick={() => finish(bike === true)}
        >
          Done — take me to week 1
        </button>
        <p className="setup-foot">You can change any of this later.</p>
      </div>
    </div>
  );
}

function Choice({
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
