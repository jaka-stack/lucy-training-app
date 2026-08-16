import { useEffect } from 'react';

/* Keeps the screen awake during a session.

   Without this, the phone locks between sets while it is sitting on the floor,
   and she has to unlock it with wet hands every 90 seconds. This is a small
   piece of code that removes one of the most irritating things about training
   with a phone.

   Not supported everywhere (notably older iOS). Where it is missing the app
   simply behaves as it would have anyway. */

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    type Sentinel = { release: () => Promise<void> };
    let sentinel: Sentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const wl = (
          navigator as unknown as {
            wakeLock?: { request: (t: 'screen') => Promise<Sentinel> };
          }
        ).wakeLock;
        if (!wl) return;
        const s = await wl.request('screen');
        if (cancelled) {
          void s.release();
          return;
        }
        sentinel = s;
      } catch {
        // Denied or unsupported. Nothing to do and nothing worth telling her.
      }
    };

    void request();

    // The lock is dropped when the app goes to the background, so take it
    // again when she comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, [active]);
}
