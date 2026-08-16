# Training app

A phone app built from the 12-week home dumbbell programme. It works offline,
keeps everything on the phone, and needs no account.

**Right now this is Phase 0** — one screen, to agree the look before the rest
gets built. See [What's here so far](#whats-here-so-far).

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
3. Run two commands I will give you, to upload the code.
4. In the repository: **Settings → Pages → Source → "GitHub Actions"**.

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
| Colours, text sizes, spacing, the whole look | `src/styles/tokens.css` |
| What a word like "superset" or "RPE" means | `src/data/glossary.ts` |
| The session screen itself | `src/screens/SetLogger.tsx` |

In `tokens.css`, every colour and size the app uses is defined once at the top
with a plain-English comment. Change a value there and it changes everywhere,
consistently. That file is worth a read even if you change nothing — it explains
the reasoning behind the design.

**From Phase 1 onward** the exercises, sets, reps, rest times and block changes
move into their own file (`src/data/programme.ts`), written to look as much like
the PDF's tables as possible, so changing a rep range means editing one obvious
line.

After any change, the browser updates by itself while `npm run dev` is running.

---

## What's here so far

**Phase 0: one screen** — the set logger, which is the screen she will see more
than any other. It shows the A-pair of Day 1 in week 3: goblet squat straight
into incline push-ups, no rest between them, then a 90-second rest, then round
again, three times.

Things worth trying:

- **Tap an effort button.** That logs the set — there is no separate save step.
  Reps and weight are already filled in from last week, so the normal case is one
  tap.
- **Notice it goes straight to the push-ups** with no rest, then rests after
  those. That is what a superset is, and the app just does it rather than
  explaining it.
- **Tap the exercise name.** The form cue and the usual mistake, at the moment
  you would want them.
- **Tap any dotted-underlined word** — "superset", "Block 1", "reps". Every piece
  of jargon explains itself where it appears, every time.
- **Watch the rest timer.** The ember ring draining *is* the time remaining.

The content on this screen is written into the screen file for now. Phase 1
moves it all into proper data files and builds the whole of Day 1.

### Not built yet

Days 2 and 3, the other three blocks, the progression engine, saving anything
between refreshes, first-run equipment setup, the bike player, progress, and
offline installation. All of that is Phases 1–4.

Right now, **refreshing the page starts over** — there is no saving yet. That
arrives in Phase 1.

---

## The fonts

Two typefaces, Archivo and Public Sans, both free and open licensed. They are
included as files inside the app rather than loaded from the internet, because
the app has to look right with no connection and nothing may leave the device.
Licences are in `src/fonts/`.
