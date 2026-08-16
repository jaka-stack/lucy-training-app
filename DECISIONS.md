# Decisions

Every judgement call, and everything that differs from the PDF, with the reasoning.
Newest phase at the bottom.

The rule I am working to: **the training does not change.** Same exercises, same
structure, same progression logic, same block changes. Wording may change for
screen-reading. Anything that even looks like a training change is written down
here and flagged to Jak.

---

## Phase 0 — visual direction

### D1. Resolving the PDF's internal conflicts: the block table wins

The day pages (§6.1–6.3) and the block table (§7) disagree in places. The day
pages prescribe 3 sets, but Block 1 is "2 sets in week 1, then 3". Day 3 lists
60 s rest on the rear-delt fly while the block table says 75–90 s for Block 1.

**Decision:** the block table is the authority for *sets, rest, RPE and tempo*.
The day pages are the authority for *which exercises, rep ranges and starting
weights*.

**Why:** §7 is explicitly the "what changes as the weeks go on" page and says
"the page for each training day shows the Block 1 version". The day pages are a
snapshot of one point in the programme; the block table is the rule. Reading it
the other way round would make week 1 wrong for everybody.

**Not a training change** — it is the only reading under which the document is
self-consistent.

### D2. Plain-language effort instead of an RPE number

The programme asks her to record RPE, a 1–10 scale. The app asks "How did that
set feel?" with four options — Easy / Moderate / Hard / All I had — each
carrying the PDF's own definition as a subtitle ("3 or 4 more", "2 more at
most"). The app converts to RPE internally for the progression rule.

**Why:** the progression rule needs "at or below the target RPE", so a number is
required *somewhere*. But a beginner cannot produce a reliable RPE, and asking
for one mid-set is exactly the sort of thing that makes someone feel stupid in
week 1. The four options ask the question the RPE scale is actually asking. The
term is still defined and reachable on tap wherever it appears.

**Mapping used:** Easy → 5, Moderate → 6.5, Hard → 8, All I had → 9.5.
Taken from p.3: "RPE 6 = you could have done 4 more reps. RPE 7 = 3 more.
RPE 8 = 2 more."

**Flagged:** Moderate maps to 6.5 because the PDF's targets straddle 6 and 7
(Block 1 target is "5–6", Block 2 is "7"). A single button cannot be both. 6.5
sits between them and satisfies "at or below target" for a Block 2 target of 7
but not for a Block 1 target of 6 — which is the conservative direction, i.e. it
will never fire a progression she has not earned. Revisit in Phase 3 when the
progression engine is real.

### D3. The effort buttons are also the log button

Reps and weight are pre-filled from what she did last time. Tapping an effort
option commits the set. There is no separate "save" step.

**Why:** the requirement is that logging a set costs a tap or two, one thumb, no
keyboard. Effort is the only genuinely new information per set — reps and weight
are usually exactly what the app already predicted. Making the new information
the commit means the common case is one tap.

**Safety net:** an Undo appears immediately after every set lands, on the rest
screen. Without that, a one-tap commit would be too easy to trigger by accident.

### D4. No free-text weight entry, anywhere

Weight is chosen from chips showing only the dumbbells she said she owns.

**Why:** required — the app must never offer a weight she does not own — and it
is also what keeps the keyboard shut. A number field is the single most likely
thing to summon a keyboard mid-set.

### D5. The commit action is pinned outside the scrolling area

The exercise details scroll; the effort buttons never do.

**Why:** found by testing at 375×812 and 375×667. The content did not fit on
either, and on the smaller phone the effort buttons fell 125 px below the fold.
Shaving spacing until it fit would have failed again on the next screen size.
Pinning the action means it is in the same place on every phone, every set.

Order of sacrifice on a short screen, in the CSS: never the effort buttons, the
rep number or the weight chips; first the spacing, then the supporting text
("Last week: …"), then heading sizes.

### D6. Double-tap guard on logging

A 500 ms lock after any set is logged.

**Why:** found by testing. Five rapid taps logged five sets. A wet thumb
bouncing, or an impatient second tap while the screen is changing, would
silently record sets she never did — and that corrupts the progression rule, not
just the display.

### D7. Completed work is chalk, never green

Finished sets render in the same off-white as everything else.

**Why:** the moment a completed set turns green, the app has invented a reward
system. The PDF's tone is deliberately unsalesy, and this app has no streaks,
badges or points. A finished set is a fact, not a prize.

### D8. Ember means one thing

The single accent colour is used only for "this is the thing you do next" — the
live set, the draining timer, the effort prompt. Never for success, error,
branding or decoration.

**Why:** it lets her find the action from across the room without reading, which
is the actual use case: phone on the floor, viewed from standing.

### D9. Fonts are bundled, not fetched

Archivo (display) and Public Sans (body) ship as files inside the app.

**Why:** the app has to look right in aeroplane mode, and no request may leave
the device. Google Fonts would break both.

**Gotcha recorded for future me:** Fontsource ships several variable cuts of
Archivo and the default one carries only the weight axis. This app's display
type uses the **width** axis. Importing the default package appeared to work —
text rendered fine — but every `font-variation-settings: 'wdth'` was silently
ignored, so nothing was actually condensed. Caught by measuring the same string
at two width settings and finding identical widths. The app now vendors the
`wdth` file directly and only the latin subset, which also dropped ~72 kB of
characters the app never shows.

### D10. Body-fat figures from the client brief are not carried into the app

The PDF's cover page states a starting body-fat percentage, and the
expectations page gives a target range for week 12. (The actual figures are
deliberately not repeated here — see below.)

**Decision:** keep the honest prose about what to expect; leave the numbers out.

**Why:** those figures are fine in a coach's private document, read once. In an
app they become a number to check, and the PDF itself says home body-fat
readings are "unreliable — treat the exact number as noise". Rendering a figure
the source calls noise would contradict the document's own position.

**This is a content omission, flagged deliberately.** Jak can overrule it.

**Second reason, added when the GitHub repository was set up:** this repository
is public, because free GitHub Pages hosting requires it, and it is named after
the person the programme is for. Personal measurements must therefore not appear
anywhere in this codebase — including in documentation explaining why they are
not in the app. The figures live in the PDF, which stays off GitHub entirely.

**Standing rule:** no personal data of any kind in this repository. Not in code,
not in comments, not in sample data, not in these notes. Her training data lives
only on her phone; the source PDF lives only on Jak's computer.

---

## Phase 1 — first run, and all of Day 1

### D11. localStorage, not IndexedDB — a reversal of the plan

The plan said IndexedDB, reasoning that async writes never block the screen
mid-set. In the code that turned out to be the wrong trade, so I changed it.

The whole save file is a couple of kilobytes — a single session is about
1.8 kB, so twelve weeks lands near 50 kB against a 5 MB limit. A write that
small is far too fast to feel. And localStorage writes **synchronously**, which
means a logged set is on disk before the next line of code runs. With IndexedDB
there is a real window, however small, where she taps an effort button, the
phone is killed, and the write never lands.

For an app whose main job is not to lose her sets, that certainty is worth more
than microseconds that nobody could perceive. Flagged rather than done quietly,
because it contradicts what I said at plan stage.

### D12. The engine is the single source of truth for "what am I doing today"

Sets, rest, effort target, tempo, weights and block variations are all computed
in one place (`src/state/engine.ts`) from the week number and her kit.

**Why:** the alternative is each screen answering "how many sets is it this
week" for itself, and the answers drifting apart. It also makes the programme
logic testable without a browser, which is where the 80 automated checks come
from.

### D13. Weights are snapped to the rack she actually owns

The PDF prescribes 15 kg for the goblet squat. Someone who owns 4, 8 and 12 kg
gets 12 kg — the heaviest she owns that is not heavier than prescribed. If she
owns nothing that light, she gets the lightest she has.

**Why:** required — the app must never offer a weight she does not own. The
programme's *intent* (start about here, progress from there) survives; only the
number changes, and it has to, because the alternative is a number she cannot
lift.

**Once she has logged a set, what she actually lifted always wins** over what
the page says. The prescription is a starting point, not a standing order.

### D14. Substitutions when there is no bench

| Programme exercise | Without a bench |
|---|---|
| Incline push-up (hands on bench) | Hands on a sofa arm, worktop or stair |
| Seated shoulder press | Standing shoulder press |

Each substitution states, in the app, that it is a swap and why. The standing
press carries an explicit note that it may need a lighter dumbbell because you
are holding yourself steady — so that a drop in weight reads as expected rather
than as failure.

**These are additions to the PDF**, which assumed one person's kit. Same
movement pattern, same muscles, same place in the session.

### D15. Substitutions when there is no bike

The warm-up's 5-minute bike becomes "march, step-ups or a brisk walk"; the
cool-down spin becomes easy walking; interval finishers become the same
intervals on foot or stairs. The PDF already blesses this on its own bike page
— it says walking counts, and that steps are "at least as good for fat loss and
easier to sustain".

### D16. Rest is taken after the last round of a pair too

The PDF says "75 s, then back to A1", which describes rest *between* rounds and
is silent about the gap between finishing one pair and starting the next.

**Decision:** rest after every round, including the last one of a pair.

**Why:** going straight from the last push-up of the A pair into a heavy
Romanian deadlift with no pause is not what the programme intends, and no coach
would run it that way. Low confidence that this is what the author meant, high
confidence it is what the author would want. Flagged for Jak.

### D17. Week 7 pauses the progression counter rather than resetting it

Not yet implemented — the progression engine is Phase 3 — but recorded now
because it falls out of this phase's work: the deload caps everything at
RPE 5, so nobody can hit the top of a rep range at target effort. Treating that
as a broken streak would punish her for following the plan. Week 7 will make
the two-session counter neutral: it neither advances nor resets.

The deload also drops the harder block-3 variations (the floor push-up
progression, the 3-second lowering). Week 7 is "same exercises, roughly half
the sets, nothing above RPE 5" — the harder variations belong to weeks 8-9.
Covered by a test.

### D18. The controls she touches never scroll

The rep count, the weight chips and the effort buttons are pinned below the
scrolling area. Only the information — exercise name, target, last time, and
any note about what changed this block — can scroll.

**Why:** found by testing, twice. First the effort buttons fell below the fold
on a small phone; the fix was to pin them. Then in week 10 — four sets, plus a
note about the new pause — the *weight chips* ended up hidden behind the pinned
bar on a 375×812 screen. Shaving spacing would have failed again on the next
screen or the next week's content. Pinning all three controls means the layout
cannot be broken by content growing above it.

### D19. Effort buttons commit; a 500 ms lock stops double taps

Carried over from Phase 0 and now applied to the real logger. Five rapid taps
advance exactly one set.

### D20. She chooses which week she is on. The app never advances it

There is a week picker; nothing moves her on automatically.

**Why:** the PDF is explicit that a bad week should be repeated rather than
pushed through, that days can move around the week, and that an extra deload
costs nothing. An app that silently advanced the week would quietly contradict
all three. It also means missing a week is not an event the app has an opinion
about — she picks up where she wants to.

### D21. What the summary screen does and does not say

It lists what she did, and says plainly: "Nothing here is a score."

**Why:** this is the natural place a fitness app would put a celebration, a
total, a streak or a comparison. The PDF's tone is that logging exists to make
the progression rule work, not to grade her. In the deload week the summary
says the easy week was done *properly*, so week 7 cannot read as a bad week.

### D22. A session with nothing logged is not recorded as a session

If she starts, does the warm-up, and stops before the first set, that is
discarded rather than saved as an empty session.

**Why:** a list of "failed" sessions is exactly the kind of pressure this app
is meant not to create. Nothing was trained, so there is nothing to record.

---

## Phase 2 — settings, Days 2 and 3, and the progression rule

### D23. The settings screen exists because the app was lying

The first-run screen said "you can change any of this later". There was no
later. The only way out of a wrong answer was clearing the browser's storage,
which would also have deleted every logged session.

Now fixed. Changing equipment deliberately does **not** rewrite anything
already logged — past sessions record what she actually lifted, and they are
history rather than a prescription.

### D24. Which version of an exercise her kit can do

Resolution order, most faithful first:

| Exercise wants | She has a tilting bench | She has a flat bench | She has no bench |
|---|---|---|---|
| Nothing | as written | as written | as written |
| Any bench | as written | as written | sofa / chair version |
| A tilting bench | as written | flat-bench version | floor / standing version |

**Why the middle column exists:** a flat bench is a much better answer than the
floor for someone who owns one. Sending her to a floor press when she has a
bench would be treating "no incline" as "no equipment".

### D25. Day 2's finisher is a steady ride, not intervals

Straight from the bike plan (§8): intervals end Days 1 and 3; Day 2 ends with
8–12 minutes steady. Neither happens in block 1 or in week 7.

### D26. Week 7 uses the block 2 version of each exercise

The deload sits inside block 3, but block 3's harder variations (the hip
thrust's higher reps, the 3-second lowering, the rear foot on the bench) belong
to weeks 8–9. Week 7 is "same exercises, roughly half the sets, nothing above
RPE 5", so the app serves the block 2 version — exactly what she was already
doing in weeks 4–6. Covered by tests.

### D27. The progression rule, and how it picks a rung

The rule as written: top of the rep range on **every** working set, at or below
the target effort, **two sessions in a row**. Implemented literally, plus three
judgement calls the PDF leaves open:

**Which rung.** The PDF says take the weight "when the jump is manageable".
That is a judgement about her actual dumbbells, so the app computes it: if the
next dumbbell up is **20% or less** of what she is lifting, take it; otherwise
climb the other rungs first. Someone with 2.5 kg increments will almost always
just add weight; someone with 5 kg gaps on a 15 kg lift gets reps, then tempo,
then a pause — which is exactly why the ladder exists.

**Time-based and fixed-rep exercises.** Planks use the top of their *time*
range. Exercises with no weight can never be offered the weight rung.

**Incomplete sessions do not qualify.** If she stopped after two sets of a
prescribed three, that session is not evidence — otherwise stopping early
would look like success.

**One at a time.** Only ever one offer, per §4: "Progress one exercise at a
time. Don't jump three exercises in the same session or you won't know what
caused the soreness."

**She can decline.** "Not yet — keep it the same" is a first-class option, and
the app then waits for a new session before asking again rather than putting
the same card up every time she opens it.

### D28. The deload is neutral for the progression counter

Week 7 caps effort at RPE 5 and halves the sets, so nobody can qualify.
Treating that as a broken run would punish her for following the plan. Deload
sessions are skipped entirely when looking for two qualifying sessions in a
row, so a run spanning week 7 survives it. Covered by a test.

### D29. The progression offer appears on the day it applies to

It shows on the Today screen when the day containing that exercise is the one
she is about to do — not the moment it is earned. Telling her the goblet squat
has earned a step while she is about to do Day 2 is noise.

### D30. The split squat gets an escape hatch

Block 3 moves the rear foot onto the bench. That is a balance-limited movement,
and at week 8 of a first-ever programme a fall is a worse outcome than a
slightly easier set.

**The programme is unchanged** — the app still prescribes it. The note adds:
if it is your *balance* that gives out rather than your leg, keep both feet on
the floor and slow the lowering instead. That is the PDF's own ladder (step 3)
applied to the person in front of it.

### D31. Where the ladder's steps actually land

Accepting a step changes the next session, not a note somewhere:

| Rung | What the app then does |
|---|---|
| Weight | Suggests the heavier dumbbell and drops reps back to the bottom of the range. Stops once she has lifted it — history takes over again. |
| Reps | Raises the top of the range by 5. Both the screen and the progression check use the new top. |
| Tempo | Switches that exercise to 3 seconds down. |
| Pause | Adds a 1-second pause note to every set of it. |
| One side | Switches the exercise to per-side. |
| Add a set | One more working set, capped at 4 as the programme requires. |

---

## Phase 3 — progress, the retest, check-ins and backup

### D32. The week 12 retest — resolving the source's conflict

§7 says week 12's third session is a retest on the goblet squat, one-arm row
and shoulder press. **None of those three is a Day 3 exercise** — two are Day 1,
one is Day 2. Meanwhile the check-in log on p.21 asks for five lifts, adding
the hip thrust and the push-up.

**Decision:** week 12's Day 3 becomes a retest session containing the three
lifts §7 names, at Block 1 rest periods as §7 requires, followed by Day 3's arm
work so the last session is not three heavy attempts and a walk home.

The hip thrust and push-up are **shown from her logs** rather than retested.
Block 4 has her doing single-leg hip thrusts with 5 kg, so a heavy bilateral
retest would measure something she has not trained for three weeks.

### D33. The retest comparison is presented honestly, not flatteringly

Week 1 sets were submaximal at RPE 5–6 — deliberately easy. The retest is a
near-limit set of 8. Those are not like for like, and computing a percentage
gain from them would overstate it.

So the app shows both numbers with their context — "Back at the start: 15 kg ×
10, and that was meant to feel easy" — and says outright on the Progress screen
that the comparison flatters her slightly.

**Caught in testing:** the first version coloured every retest row as an
improvement and said "a real change, and a big one" underneath. On a lift that
did not move, that reads as either a lie or a rebuke. Now only genuine
improvements are marked, and the note adds that a lift which did not move is
not a failure.

### D34. Weight is only ever shown as a weekly average, and never below two readings

§9: "only compare the weekly average to the previous weekly average. A single
morning's weight is close to meaningless."

Taken literally. She can log a weight any day. The app **never shows a single
day's number back to her** — not in a list, not in a chart, not as a "latest".
A week with only one reading displays "one reading — not enough to average",
because an average of one number is just the daily number wearing a hat.

No goal weight, no projection, no trend arrow, no daily chart. Each of those
turns a weekly check into a daily habit.

Waist is shown from a single reading, deliberately: it does not swing with food,
salt and water the way the scale does.

### D35. The weight log is off by default and has to be turned on

It is the one part of this app that can become a compulsion. It sits at the
bottom of the Progress screen, below the training, and when off it says why she
does not need it.

### D36. Progress leads with strength, not the scale

§9 says strength climbs fastest for a beginner, fitness shows by week 3–4, and
the scale can rise for the first three weeks while everything is going right.
So the Progress screen leads with what she can lift now that she could not
lift before, and the scale is a footnote.

Improvement is marked in ember, not green — this is the news, not a reward.

### D37. A gap in training is stated as a fact and nothing else

"Last session was 11 days ago. Pick up wherever you like — nothing is lost, and
there is nothing to make up." No warning colour, no broken streak, no "get back
on track". Shown only after 7 days, and never as a notification.

### D38. Backup is a file she owns

With no cloud, a cleared browser is total data loss. Export writes a plain JSON
file; restore reads one back, but refuses anything without the app's marker
rather than half-applying a file it does not understand, and never restores
straight into a half-finished session because the file could be weeks old.

### D39. Exercise illustrations: not shipped, and why

Promised at plan stage with the caveat that I would say so if they came out
worse than the words.

**They would have.** Twenty hand-coded SVG figures that are anatomically
legible enough to correct someone's form is not something I can do to a
standard worth shipping — a vague drawing of a hinge is worse than the sentence
"push your hips back, dumbbells sliding down the front of your thighs, back
flat", because it invites her to copy a shape that is not quite right.

What is there instead: the written cue and the common mistake, always offline,
one tap from the exercise name at the moment she is standing over it, plus the
video search link the PDF itself uses when she has a connection.

If illustrations are wanted, the right answer is photographs or a short clip of
someone actually performing the movement — which is a content job, not a code
job.

---

## Phase 4 — finishing a week, and showing what is finished

Both from Jak's feedback after using it.

### D40. A finished week is no longer a dead end

**The bug:** after logging all three sessions of a week, the app suggested Day
1 of the *same* week again and the button still read "Start the session". The
week never advanced, so the obvious next step was to redo a session already
done.

**The fix:** when every session in the week is logged, the primary button
becomes **"Start week N+1"**, which moves the week on and opens Day 1. A
smaller "or do a week N session again" sits underneath.

**Why one tap rather than fully automatic:** the app still does not advance the
week by itself, and that is deliberate (see D20). The programme is explicit
that repeating a week is a legitimate choice, that days move around, and that
an extra deload costs nothing — so a week that rolls over on its own would
quietly overrule her. What was wrong before was not that it asked, but that it
offered nothing. Now the next week is the default action and takes one tap.

If Jak would rather it advanced with no tap at all, it is a two-line change.

### D41. Week 12 ends on the comparison, not another session

With all twelve weeks logged, the primary action becomes **"See what changed"**
and goes to Progress, because at that point the payoff is the week 1 against
week 12 comparison, not a thirteenth week. Underneath, "or train again — the
programme says this is probably the first of several blocks", which is the
PDF's own line from the spot-reduction page.

### D42. Green, introduced deliberately and confined to the calendar

Jak asked for completed weeks to be marked, suggesting green ticks. This runs
into D7, which says finished work is chalk and never green because colouring it
green invents a reward system.

**Both are right, about different things.** D7 is about a *set* inside a
session — there, green would turn logging into scoring. A week or a day in a
twelve-week grid is a different question: it is navigational. "Which weeks have
I finished" needs to be answerable at a glance across twelve cells, and a grey
tick reads as *disabled* rather than *done*.

So a single desaturated green (`--finished`) is now in the palette, with a hard
rule written into the tokens file: it appears **only** on week and day
completion marks, never on a set, a rep or an exercise. It is deliberately
muted so it never competes with ember, which still means "the thing you do
next".

Where it appears: the three day cells on the Today screen, the twelve-week
grid, and the day picker. The current week still overrides the finished
styling, so "where am I" stays the loudest thing in the grid.

### D43. Erasing everything: press and hold, not a yes/no box

Jak asked for a clear-data option guarded against accidents.

**Why not a confirm box:** a yes/no dialog is dismissed by reflex. The muscle
memory for "tap the right-hand button" is strong enough that people confirm
things they did not read, and the cost here is twelve weeks of her training
with no copy anywhere.

**What it does instead**, three obstacles deep:

1. The button in Settings only *opens* something. It never erases.
2. The sheet lists what will be lost **by name and live count** — "4 logged
   sessions, 1 reading, 1 step up the ladder, your kit answers" — rather than a
   vague "all data". It also states plainly that nothing is kept anywhere else,
   so there is nothing to restore from.
3. A **backup button sits above the destructive one**, so the safe option is
   the one she meets first.
4. The action itself needs a **two-second press and hold**. A tap does nothing.
   Releasing early cancels and resets the bar.

The filling bar is driven frame by frame from real elapsed time, so it can
never disagree with when the action fires. It also means a hold does not
progress while the app is in the background, which is the right behaviour.

**One more colour, and the last:** `--danger` red, used *only* here. Ember means
"the thing you do next" and is deliberately inviting; the one action that can
destroy her training must not look inviting, and must not look like every other
button. Like `--finished`, the restriction is written into the tokens file.

**Verified:** a plain tap leaves everything intact; an 800 ms hold cancels and
resets; a full hold erases and returns to the first-run questions.

---

## Acceptance tests — final state

All verified. The offline test was the last one outstanding and could not be
checked from the development machine, because the browser used for testing
blocks service worker registration; Jak confirmed it on a real Android phone
on 16 August 2026.

| Test | State |
|---|---|
| A complete session logged one-handed, no keyboard | Passes, all three days |
| Everything survives a full app restart | Passes, verified mid-set |
| Every jargon term explained one tap from where it appears | Passes, enforced by a test |
| The programme changes correctly between all four blocks, including week 7 | Passes |
| The progression prompt fires exactly when the PDF's rule says | Passes |
| Nothing breaks with no internet | **Passes — confirmed on device** |
| A different set of dumbbells, and no bench, produce a sensible programme | Passes |

---

## Open questions carried into Phase 1

These were raised at plan stage and answered "pick what you think is best".
Recording the picks so they are visible rather than buried in chat:

| Question | Decision |
|---|---|
| Week 12 retest vs Day 3 | Week 12 Day 3 becomes the retest (goblet squat, one-arm row, shoulder press worked up to a heaviest clean set of 8), then the Day 3 arm work. Hip thrust and push-up are shown as "your best logged" rather than retested, so the day does not become four max efforts. |
| Retest comparison honesty | Week 1 was submaximal (RPE 5–6); week 12 is a max-ish set of 8. The app will show both with their context rather than computing a percentage that overstates the gain. |
| Weekly check-in | Opt-in, off by default. Weekly averages only, no daily-weight line, no goal, no projection. |
| Progress photos | Reminder only. Never stored in the app. |
| Ladder and dumbbell increments | Computed from the kit she actually owns. Small next jump → take the weight. Big next jump → climb the ladder first. Same logic as the PDF, arithmetic instead of an assumption. |
| Exercise illustrations | Yes, Phase 4. If they come out worse than the written cues, I will say so rather than ship them. |
| Audio | Minimal — a tone and a vibration at rest-end and interval switches. No spoken voice. Toggleable. |

---

## Things deliberately not built

Recorded so it is clear they were considered and rejected, not forgotten.

- **Streaks and chains.** Create pressure to train while ill or injured. The PDF
  explicitly allows days to move around the week.
- **Badges, points, levels.** A nervous beginner does not need a game; a
  competent week-11 lifter finds them insulting.
- **Calories burned.** Unknowable to better than about ±40%, and §10 spends a
  page arguing that training is not the fat-loss lever.
- **Body-fat estimates.** See D10.
- **Weight-loss projections or goal weights.**
- **Before/after photo comparison.**
- **Nagging notifications.**
- **Anything social or shareable.**
