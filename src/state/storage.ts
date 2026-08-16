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
      adjustments: parsed.adjustments ?? {},
      checkIns: parsed.checkIns ?? [],
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

/* --- backup ---------------------------------------------------------------
   There is no cloud behind this app, so a cleared browser is total data loss.
   These two make that an annoyance rather than a catastrophe.               */

const FILE_MARKER = 'trainer-backup';

/** Everything she has, as a file she can keep. */
export function downloadBackup(state: AppState): void {
  const payload = {
    marker: FILE_MARKER,
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const day = new Date().toISOString().slice(0, 10);
  a.download = `training-backup-${day}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release the blob on the next tick, once the download has started.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ImportResult =
  | { ok: true; state: AppState }
  | { ok: false; reason: string };

/**
 * Reads a backup file. Deliberately strict: restoring overwrites everything
 * she has, so a file we do not recognise is refused rather than half-applied.
 */
export function parseBackup(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'That file is not readable.' };
  }

  const p = parsed as { marker?: string; state?: Partial<AppState> };
  if (p?.marker !== FILE_MARKER || !p.state) {
    return {
      ok: false,
      reason: 'That does not look like a backup from this app.',
    };
  }

  const s = p.state;
  if (!s.settings || !Array.isArray(s.history)) {
    return { ok: false, reason: 'That backup is missing its contents.' };
  }

  return {
    ok: true,
    state: {
      ...INITIAL_STATE,
      ...s,
      history: s.history,
      adjustments: s.adjustments ?? {},
      checkIns: s.checkIns ?? [],
      // Never restore straight back into a half-finished session — the file
      // could be weeks old.
      inProgress: null,
    } as AppState,
  };
}
