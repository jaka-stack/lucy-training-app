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
