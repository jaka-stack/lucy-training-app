import { useState } from 'react';
import { lookUp } from '../data/glossary';
import { Sheet } from './Sheet';
import './Term.css';

/* A word that explains itself.

   Wrap any jargon in <Term k="superset">A1</Term> and it gets a dotted
   underline and opens its definition on tap — every time it appears, not
   just the first. The dotted underline is the app's one consistent signal
   for "there is more here if you want it". */

type Props = {
  /** Key into the glossary. */
  k: string;
  /** What to show. Defaults to the glossary term itself. */
  children?: React.ReactNode;
};

export function Term({ k, children }: Props) {
  const [open, setOpen] = useState(false);
  const entry = lookUp(k);

  // If a term is missing from the glossary, show the text plainly rather than
  // rendering a dead control. Silent degradation is right here — a missing
  // definition shouldn't break a set she is halfway through.
  if (!entry) return <>{children ?? k}</>;

  return (
    <>
      <button
        className="term"
        onClick={() => setOpen(true)}
        aria-label={`${entry.term} — what does this mean?`}
      >
        {children ?? entry.term}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        kicker="What this means"
        title={entry.term}
      >
        <p className="lead">{entry.short}</p>
        {entry.more && <p>{entry.more}</p>}
      </Sheet>
    </>
  );
}
