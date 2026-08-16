# Training app

A phone app built from the 12-week home dumbbell programme. It works offline,
keeps everything on the phone, and needs no account.

**Right now this is Phase 3 of 4** — all three training days work, for all
twelve weeks, and the app applies the progression rule itself. See
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

This comes later, once there is more than one screen. The short version, so you
know what is coming:

1. Make a free account at [github.com](https://github.com).
2. Make a new empty **public** repository.
3. **Switch Pages on first:** in the repository, go to **Settings → Pages**, and
   under "Build and deployment" set **Source** to **"GitHub Actions"**. Do this
   before pushing — the publishing job cannot turn it on for you, and it fails
   if Pages is off.
4. Push the code up (`git push`).

GitHub then gives you a web address. Open it on the phone once, and use the
browser's **Add to Home Screen** option. After that it behaves like a normal app
— its own icon, no browser bars, and it works in aeroplane mode.

**Why it has to be on the internet once:** phone browsers refuse to install an
app like this from a plain local address; it has to come from a secure web
address at least once. Only the *app itself* lives on GitHub. No training data
ever goes there — none of it ever leaves the phone.

**A note for iPhones:** if you only bookmark the page instead of using "Add to
Home Screen", iPhones can delete the app's saved data after about a week of not
opening it. Adding it to the home screen avoids that. There will also be a
backup/export button, so nothing is ever only in one place.

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
- **"Your kit"**, top right, changes your equipment answers afterwards without
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

### Not built yet

- **Progress screens and the weekly check-in** — Phase 4.
- **Backup/export, exercise illustrations, the week 12 retest** — Phase 4.

### Checking it still works

```bash
npm test
```

207 automated checks on the parts where a mistake would be invisible: that every
week has the right number of sets and the right rest, that week 7 is a genuine
deload, that the bike plan matches each block and each day, that the app never
suggests a dumbbell you do not own, that every kit combination produces a
complete session rather than gaps, that the progression rule fires exactly when
the programme says and never during the easy week, that it never tells you to
pick up a heavier dumbbell for a press-up, and that every piece of jargon on
screen has a definition behind it.

These also run automatically on GitHub before anything is published, so a broken
version cannot reach the phone.

---

## The fonts

Two typefaces, Archivo and Public Sans, both free and open licensed. They are
included as files inside the app rather than loaded from the internet, because
the app has to look right with no connection and nothing may leave the device.
Licences are in `src/fonts/`.
