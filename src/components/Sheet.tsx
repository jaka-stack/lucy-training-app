import { useEffect, useRef, type ReactNode } from 'react';
import './Sheet.css';

/* A bottom sheet. Used for every explanation in the app: jargon, form cues,
   why an exercise is here. It slides up over whatever she was doing and
   dismisses without changing anything, so opening one mid-set is never a
   risk. */

type Props = {
  open: boolean;
  onClose: () => void;
  /** Small caps label above the title, e.g. "WHAT THIS MEANS". */
  kicker?: string;
  title: string;
  children: ReactNode;
};

export function Sheet({ open, onClose, kicker, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes. Cheap to support and it makes the sheet keyboard-usable.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Move focus into the sheet when it opens so a screen reader announces it.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="sheet-layer">
      {/* Tapping the dimmed area closes. Large, forgiving dismiss target. */}
      <button className="sheet-scrim" onClick={onClose} aria-label="Close" />

      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="sheet-grip" aria-hidden="true" />

        <div className="sheet-body">
          {kicker && <p className="label sheet-kicker">{kicker}</p>}
          <h2 className="sheet-title">{title}</h2>
          <div className="sheet-content">{children}</div>
        </div>

        <button className="sheet-close" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
