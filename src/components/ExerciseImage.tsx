import { useEffect, useRef, useState } from 'react';
import './ExerciseImage.css';

/* ==========================================================================
   EXERCISE DEMONSTRATIONS

   Drop a file into src/exercise-images/ named after the exercise — for
   example src/exercise-images/goblet-squat.mp4 — and it appears at the top of
   that exercise's "How to do it" panel. No code change needed.

   Video or a still both work. A short clip is usually better, because these
   are movements rather than positions, and where both exist the clip wins.

   The list is built by Vite from the folder contents at build time rather
   than guessed at runtime. That matters for three reasons:

     - No guessing. The app knows exactly which files exist, so an exercise
       without one makes no failed requests at all.
     - They are bundled like any other asset, so they are stored on the phone
       and play with no internet — which is the point of having them.
     - A file that is added but misnamed simply will not appear, rather than
       half-working.

   If there is nothing for an exercise, nothing is rendered and the written
   cue stands on its own. A missing file must never leave a broken icon or a
   gap in front of someone mid-set.
   ========================================================================== */

const VIDEOS = import.meta.glob('../exercise-images/*.{mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const STILLS = import.meta.glob('../exercise-images/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function byExerciseId(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, url]) => {
      const file = path.split('/').pop() ?? '';
      return [file.replace(/\.[^.]+$/, ''), url];
    }),
  );
}

const VIDEO_BY_ID = byExerciseId(VIDEOS);
const STILL_BY_ID = byExerciseId(STILLS);

export function ExerciseImage({
  exerciseId,
  name,
}: {
  exerciseId: string;
  /** Used for the description, so a screen reader says something useful. */
  name: string;
}) {
  const video = VIDEO_BY_ID[exerciseId];
  const still = STILL_BY_ID[exerciseId];

  if (video) return <Demo src={video} name={name} poster={still} />;
  if (still)
    return (
      <img
        className="ex-image"
        src={still}
        alt={`Demonstration of the ${name}`}
        decoding="async"
      />
    );
  return null;
}

function Demo({
  src,
  name,
  poster,
}: {
  src: string;
  name: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  /* Someone who has asked their phone for less motion has asked this app too.
     For them the clip does not loop on its own — it gets controls and waits to
     be played deliberately. Everyone else gets the silent loop, which behaves
     like an animation rather than a video to be operated. */
  const [reduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  );

  const [paused, setPaused] = useState(reduceMotion);

  // Some browsers reject autoplay even when muted. If that happens, fall back
  // to showing controls rather than a frozen frame with no way to start it.
  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    void el.play().catch(() => setPaused(true));
  }, [reduceMotion]);

  return (
    <video
      ref={ref}
      className="ex-image"
      src={src}
      poster={poster}
      // muted + playsInline are what allow a clip to loop silently on a phone
      // without going full screen.
      muted
      playsInline
      loop
      autoPlay={!reduceMotion}
      controls={paused}
      preload="auto"
      aria-label={`Demonstration of the ${name}`}
    />
  );
}
