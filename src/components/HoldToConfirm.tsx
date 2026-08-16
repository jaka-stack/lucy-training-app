import { useEffect, useRef, useState } from 'react';
import './HoldToConfirm.css';

/* ==========================================================================
   PRESS AND HOLD

   For the one action that can destroy twelve weeks of training.

   A normal button, or even a button behind a yes/no box, can be triggered by
   a mis-tap and a reflex "yes". Holding for a full two seconds cannot happen
   by accident: it needs a deliberate, sustained press, and letting go early
   cancels it and puts the bar back to zero.

   It also works without a keyboard and with one thumb, which the rest of the
   app is built around.
   ========================================================================== */

const HOLD_MS = 2000;

export function HoldToConfirm({
  label,
  holdingLabel,
  onConfirm,
}: {
  label: string;
  holdingLabel: string;
  onConfirm: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(0);
  const firedRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  function stop() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHolding(false);
    setProgress(0);
  }

  function start() {
    if (firedRef.current || rafRef.current !== null) return;
    setHolding(true);
    startedRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedRef.current;
      const p = Math.min(1, elapsed / HOLD_MS);
      setProgress(p);

      if (p >= 1) {
        firedRef.current = true;
        rafRef.current = null;
        setHolding(false);
        onConfirmRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Never leave an animation running if the sheet closes mid-hold.
  useEffect(() => stop, []);

  return (
    <button
      className={`hold ${holding ? 'is-holding' : ''}`}
      // Spelled out, because "press and hold" is not discoverable from a
      // button that looks like any other.
      aria-label={`${label}. Press and hold for two seconds to confirm.`}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // Keyboard: holding Enter or Space repeats keydown, which keeps the
      // timer running; releasing fires keyup and cancels.
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={stop}
      onBlur={stop}
    >
      {/* The bar filling IS the time remaining — the same idea as the rest
          timer's draining ring. */}
      <span
        className="hold-fill"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <span className="hold-label">{holding ? holdingLabel : label}</span>
    </button>
  );
}
