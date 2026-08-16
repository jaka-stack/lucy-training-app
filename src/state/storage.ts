import { INITIAL_STATE, type AppState } from './types';

/* ==========================================================================
   SAVING

   Everything lives in the phone's own storage. Nothing is sent anywhere, there
   is no account, and the app works with no connection.

   A NOTE ON THE CHOICE (changed from the plan — see DECISIONS.md D11):
   The plan said IndexedDB, on the grounds that async writes never block the
   screen mid-set. In the code that turned out to be the wrong trade. The whole
   save file is a few kilobytes, so a write is far too small to be felt — and
   localStorage writes SYNCHRONOUSLY, which means a set is on disk before the
   next line of code runs. With IndexedDB there is a real window, however
   small, where she taps "log set", the phone is killed, and the write never
   lands. For an app whose main job is not to lose her sets, that certainty is
   worth more than the microseconds.

   The 5 MB localStorage limit is not a concern: twelve weeks of training is
   around 50 kB.
   ========================================================================== */

const KEY = 'trainer.v1';

export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return INITIAL_STATE;

    const parsed = JSON.parse(raw) as Partial<AppState>;

    // Merge onto the defaults rather than trusting the file. If a future
    // version adds a field, an older save file still opens instead of
    // crashing on a missing property.
    return {
      ...INITIAL_STATE,
      ...parsed,
      history: parsed.history ?? [],
    };
  } catch {
    // A corrupt or unreadable save should not stop her training. Start clean
    // rather than showing an error she cannot act on.
    return INITIAL_STATE;
  }
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private browsing). Nothing useful to do
    // mid-set; the session continues in memory.
  }
}

/** Everything she has, as a file she can keep. The backup for a device with
    no cloud behind it. */
export function exportBlob(state: AppState): Blob {
  return new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  });
}
