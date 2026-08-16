import { useState } from 'react';
import { useStore } from './state/store';
import { Setup } from './screens/Setup';
import { Today } from './screens/Today';
import { Session } from './screens/Session';

/* Which screen is showing. Deliberately not a router — there are no URLs to
   share and no back button to get wrong, and a session that cannot be
   navigated away from by accident is the point. */
type View = 'today' | 'session';

export function App() {
  const { state } = useStore();
  const [view, setView] = useState<View>('today');

  // Nothing works until we know what kit she has.
  if (!state.settings) return <Setup />;

  if (view === 'session' && state.inProgress) {
    return <Session onExit={() => setView('today')} />;
  }

  return <Today onStart={() => setView('session')} />;
}
