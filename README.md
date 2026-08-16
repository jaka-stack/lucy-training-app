# Training app

A phone app built from the 12-week home dumbbell programme. It works offline,
keeps everything on the phone, and needs no account.

**This is now complete** — all twelve weeks, all three days, the progression
rule, the week 12 retest, progress, backup, and it works offline. See
[What's here so far](#whats-here-so-far).

---

## Seeing it on your computer

You need [Node.js](https://nodejs.org) installed once. Get the "LTS" version and
click through the installer.

Then open a terminal in this `trainer` folder and run:

```bash
npm install
```

That downloads the bits the app is built from. You only do it once.

```bash
npm run dev
```

That starts it. The terminal prints a web address like `http://localhost:5180` —
open that in a browser.

**To see it as a phone:** in Chrome or Edge press `F12`, then click the little
phone/tablet icon in the panel that appears (top-left of it). Pick "iPhone SE"
or "iPhone 12 Pro" from the dropdown at the top. That is the size it is designed
for; on a full-size desktop window it will look like a narrow strip down the
middle, which is correct.

To stop it, click the terminal and press `Ctrl + C`.

---

## Seeing it on your actual phone, on your wifi

With `npm run dev` running, the terminal also prints a "Network" address like
`http://192.168.1.42:5180`. Type that into your phone's browser, as long as the
phone and the computer are on the same wifi.

This is for a quick look. It needs the computer switched on. Getting it onto the
phone *properly*, so it works forever with no computer and no internet, is the
GitHub step below.

---

## Putting it on a phone for real

**This is already set up and live at:**

https://jaka-stack.github.io/lucy-training-app/

Open that on the phone and use **Add to Home Screen** (iPhone: the Share
button; Android: the ⋮ menu → *Install app*). After that it behaves like a
normal app — its own icon, no browser bars, and it works in aeroplane mode.

To publish a change, run `git push` from this folder. GitHub rebuilds it in
about a minute, and the phone picks it up next time the app is opened.

<details>
<summary>How it was set up, if it ever needs doing again</summary>

1. Make a free account at [github.com](https://github.com).
2. Make a new empty **public** repository.
3. **Switch Pages on first:** in the repository, go to **Settings → Pages**, and
   under "Build and deployment" set **Source** to **"GitHub Actions"**. Do this
   before pushing — the publishing job cannot turn it on for you, and it fails
   if Pages is off.
4. Push the code up (`git push`).

</details>

**Why it has to be on the internet once:** phone browsers refuse to install an
app like this from a plain local address; it has to come from a secure web
address at least once. Only the *app itself* lives on GitHub. No training data
ever goes there — none of it ever leaves the phone.

**A note for iPhones:** if you only bookmark the page instead of using "Add to
Home Screen", iPhones can delete the app's saved data after about a week of not
opening it. Adding it to the home screen avoids that. There is also a backup
button (Settings → Save a backup file), so nothing need ever be in one place
only.

---

## Changing things

You do not need to be a programmer to change the training content. Everything
lives in plain lists that read like the tables in the PDF.

| To change… | Open this file |
|---|---|
| Exercises, sets, reps, starting weights | `src/data/programme.ts` |
| What changes in each block, and in week 7 | `src/data/programme.ts` |
| Form cues, common mistakes, no-bench swaps | `src/data/exercises.ts` |
| The warm-up and cool-down lists | `src/data/exercises.ts` |
| What a word like "superset" or "RPE" means | `src/data/glossary.ts` |
| Colours, text sizes, spacing, the whole look | `src/styles/tokens.css` |
| The rules that decide today's session | `src/state/engine.ts` |

In `tokens.css`, every colour and size the app uses is defined once at the top
with a plain-English comment. Change a value there and it changes everywhere,
consistently. That file is worth a read even if you change nothing — it explains
the reasoning behind the design.

`programme.ts` is written to look as much like the PDF's tables as possible, so
changing a rep range means editing one obvious line. If you change something the
programme depends on, `npm test` will tell you.

After any change, the browser updates by itself while `npm run dev` is running.

---

## What's here so far

**All three training days work**, for any of the twelve weeks, adapted to
whatever kit you tell it you have — and the app now applies the programme's
progression rule for you.

The first time you open it, it asks three questions — which dumbbells, whether
you have a bench, whether you have a bike — and then builds every session around
the answers. A session runs start to finish: warm-up, the three pairs of
exercises, the bike finisher, the cool-down, and a summary.

Things worth trying:

- **Tap an effort button.** That logs the set — there is no separate save step.
  Reps and weight are already filled in from last time, so the normal case is
  one tap and no keyboard, ever.
- **Notice it goes straight from the squat into the push-ups** with no rest,
  then rests after those. That is what a superset is, and the app just does it
  rather than explaining it.
- **Tap the exercise name** for the form cue and the usual mistake.
- **Tap any dotted-underlined word** — "superset", "Block 1", "reps". Every
  piece of jargon explains itself where it appears, every time.
- **Tap the big week number** on the front screen to jump around. Try week 7
  (the easy week) and week 10 (the hardest) and watch the session change — sets,
  rests, and notes about what is different.
- **"Different day"** on the session card swaps between the three days. The app
  suggests the next one you have not done, but the order is yours.
- **Close the browser mid-session and open it again.** It picks up on the exact
  set you were on.
- **"Settings"**, top right, changes your equipment answers afterwards without
  touching anything you have logged.
- **Say you have no bench and no bike**, and watch the exercises swap to sofa,
  floor and standing versions, each explaining the swap.

### The progression rule

This is the part the PDF asks you to do by hand. When you hit the top of the rep
range on every set, at the right effort, two sessions running, the app says so
and offers the next step — and picks *which* step based on the dumbbells you
actually own.

If your next dumbbell up is a small jump, it says take the weight. If it is a
big jump — 15 kg to 20 kg is a third heavier — it offers more reps first, then
slower lowering, then a pause, exactly as the programme's ladder says. There is
always a "not yet", and only one exercise is ever moved at a time.

### Progress

**"Progress"** on the front screen leads with what she can lift now that she
could not lift before — because that is what actually moves in the early weeks,
and the programme is blunt that the scale can go *up* for the first three weeks
while everything is going right.

The weight and waist log is **off unless she turns it on**. When it is on, the
app only ever shows a **weekly average**, and refuses to average a week with
only one reading — because a single morning's weight is close to meaningless,
which the programme says in as many words. There is no goal weight, no
projection and no daily chart.

### Week 12

The last session of week 12 becomes a retest: three lifts worked up to the
heaviest clean set of 8, with her week 1 numbers alongside — and a plain note
that week 1 was meant to feel easy, so the comparison flatters her slightly.

### Backup

**Settings → Save a backup file.** There is no cloud, so this is the only way
data moves between devices or survives a cleared browser. Worth doing every few
weeks. The file goes wherever you save it and nowhere else.

**Settings → Restore from a backup** puts it all back. It refuses any file that
did not come from this app rather than half-applying something it does not
understand.

### Starting over

**Settings → Erase everything.** Deliberately awkward: it lists exactly what
will be lost with live counts, offers the backup first, and then needs a
two-second press and hold rather than a tap. A tap does nothing, and letting go
early cancels it. Afterwards the app is back to the first-run questions.

### Deliberately not built

Streaks, badges, calories burned, body-fat estimates, weight projections,
before/after photo comparison, and nagging notifications. Every one of them
would push toward the pressure the programme's own tone avoids. Reasons are in
`DECISIONS.md`.

Hand-drawn exercise illustrations were planned and dropped — a vague drawing of
a hinge is worse than the sentence describing it. **Photographs, however, drop
straight in — see below.**

---

## Adding videos or photos to the exercises

Put a file in **`src/exercise-images/`**, named after the exercise, and it
appears at the top of that exercise's "How to do it" panel — the one that opens
when you tap an exercise name mid-session. **No code editing.**

1. Get a short clip, or a photo, of the movement.
2. Rename it to match the exercise exactly, all lower case with the dashes:
   `goblet-squat.mp4`
3. Drop it in `src/exercise-images/`
4. `git push`. Live a minute later.

**A short video is the best option.** These are movements rather than
positions, and a clip shows the whole rep. It plays automatically, silently, on
a loop — it behaves like an animation rather than a video to be operated.

| Type | Extensions | Aim for |
|---|---|---|
| Video (best) | `.mp4`, `.webm` | 2–5 seconds, under ~1 MB |
| Photo | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` | under ~300 KB |

**Use `.mp4`.** iPhones record `.mov`, which many Android browsers refuse to
play — convert those first. If you add both a video and a photo for the same
exercise, the video is used and the photo becomes its holding image.

**The full list of filenames is in `src/exercise-images/README.txt`**, grouped
by training day. There are 19. You do not have to do all of them — any exercise
without a file just shows the written cue as it does now, and nothing looks
broken or unfinished.

**Size matters** because these are downloaded onto the phone so they work with
no internet. Nineteen clips at 1 MB is about 19 MB, which is fine; nineteen
straight off a phone camera could be 400 MB, which would make the app take an
age to install. Trimming to a few seconds and dropping to 720p is plenty for a
phone screen.

Someone who has asked their phone for reduced motion gets the clip paused with
play controls rather than an automatic loop.

**Don't use pictures taken from someone else's website or app.** Either shoot
them yourself or use a source that clearly allows reuse — linking to a YouTube
search, as the app already does, is a different thing from copying someone's
photographs into it.

### Checking it still works

```bash
npm test
```

234 automated checks on the parts where a mistake would be invisible: that every
week has the right number of sets and the right rest, that week 7 is a genuine
deload, that the bike plan matches each block and each day, that the app never
suggests a dumbbell you do not own, that every kit combination produces a
complete session rather than gaps, that the progression rule fires exactly when
the programme says and never during the easy week, that it never tells you to
pick up a heavier dumbbell for a press-up, and that every piece of jargon on
screen has a definition behind it, that the week 12 retest contains the right
lifts, that a backup survives a round trip, and that a single weigh-in is never
displayed as a weekly average.

These also run automatically on GitHub before anything is published, so a broken
version cannot reach the phone.

---

## The fonts

Two typefaces, Archivo and Public Sans, both free and open licensed. They are
included as files inside the app rather than loaded from the internet, because
the app has to look right with no connection and nothing may leave the device.
Licences are in `src/fonts/`.
