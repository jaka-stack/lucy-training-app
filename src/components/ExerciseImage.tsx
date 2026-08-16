import './ExerciseImage.css';

/* ==========================================================================
   EXERCISE ILLUSTRATIONS

   Drop a file into src/exercise-images/ named after the exercise — for
   example src/exercise-images/goblet-squat.jpg — and it appears at the top of
   that exercise's "How to do it" panel. No code change needed.

   The list below is built by Vite when the app is built, by looking at what
   is actually in that folder. That matters for three reasons:

     - No guessing. The app knows exactly which pictures exist, so an exercise
       without one makes no failed requests at all. (An earlier version tried
       each file extension in turn, which meant five 404s per exercise for
       every picture that had not been added yet.)
     - They are bundled like any other asset, so they are stored on the phone
       and work with no internet — which is the whole point of having them.
     - A file that is added but misnamed simply will not appear, rather than
       half-working.

   If there is no picture, nothing is rendered and the written cue stands on
   its own. A missing image must never leave a broken-image icon or a gap in
   front of someone mid-set.
   ========================================================================== */

const FILES = import.meta.glob('../exercise-images/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** { 'goblet-squat': '/assets/goblet-squat-a1b2c3.png', … } */
const BY_EXERCISE: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => {
    const file = path.split('/').pop() ?? '';
    const id = file.replace(/\.[^.]+$/, '');
    return [id, url];
  }),
);

/** Whether a given exercise has a picture. Used by the tests. */
export function hasImage(exerciseId: string): boolean {
  return exerciseId in BY_EXERCISE;
}

export function ExerciseImage({
  exerciseId,
  name,
}: {
  exerciseId: string;
  /** Used for the alt text, so a screen reader says something useful. */
  name: string;
}) {
  const src = BY_EXERCISE[exerciseId];
  if (!src) return null;

  return (
    <img
      className="ex-image"
      src={src}
      alt={`Demonstration of the ${name}`}
      decoding="async"
    />
  );
}
