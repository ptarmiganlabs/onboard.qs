# Onboard.qs logo

The card logo for Onboard.qs and everything derived from it. Ten SVG sources and a `render.sh`
that turns them into every raster the project ships.

**Read [the style guide][guide] first** — `rules/visual/logos.md` in `plabs-house-rules`. These
files are the Ptarmigan Labs card family's geometry with the Onboard.qs glyph in it, and nothing
here explains why the geometry is what it is. This README covers only the decisions specific to
Onboard.qs.

[guide]: https://github.com/ptarmiganlabs/plabs-house-rules/blob/main/rules/visual/logos.md

## The hue: green

|                            | Light card            | On dark               |
| -------------------------- | --------------------- | --------------------- |
| Glyph gradient             | `#00B050` → `#007A38` | `#4FD98E` → `#00B050` |
| Card gradient              | `#EFFAF3` → `#E1F5E8` | `#0E3A22` → `#042011` |
| Wordmark                   | `#007A38`             | `#A7F3CA`             |
| Tagline (og/social/square) | `#007A38`             | —                     |

First tier of the family palette, dark stop at hue 147°.

**Every one of these values was sampled from the committed 140 px PNG, not invented.** Onboard.qs
had a mark before it had a source: the PNG was the only original, and it was drawn in three flat
greens — `#00B050` on the crown, `#009845` on the board, `#007A38` on the board's thickness lip.
All three measure 147° to within half a degree, so the hue was never in question; only which two
tones became the gradient stops.

The lightest and the darkest were taken, which also settles a number the style guide had already
written down without knowing where it came from. Its greyscale table lists green's dark stop at
perceived luminance 78. `#007A38` is 78.0. `#009845` is 97.1 and would have made the family's
value-distribution argument wrong, so the lip tone is the dark stop and the mid tone is not used.

## The glyph: a graduation cap

Onboard.qs walks a user through a Sense app the first time they open it. The cap is the moment
that ends — the point of an onboarding tour is to stop needing one.

It is also the only shape in the family that is not a rectangle, a disc, a document or a bubble,
which is what makes it cheap to keep distinct. Nothing had to be given up to get there, because
the obvious mark for an onboarding tool is a signpost, an arrow or a numbered step, and all three
are shapes a sibling could plausibly want later.

**The V is the form.** The board's lower edges cutting across the crown are what make the shape a
cap seen from slightly above, rather than a diamond resting on a bowl. Every file in the set has
to produce that V somehow, and they do not all do it the same way — see
[What differs between the files](#what-differs-between-the-files).

The 140 px PNG got it from two flat tones. The card gets it from the family's single `iconGrad`:
because that gradient is `objectBoundingBox`, the board and the crown each ramp across their own
box, so the board arrives dark exactly where the crown restarts light. No knocked-out gap is
needed and the family's "one gradient, no second gradient" holds.

## Siblings, and why the shapes do not collide

Rendered at 16, 24 and 32 px against the mark nearest in hue, in colour and again in greyscale,
because at those sizes and for roughly one man in twelve the colour is not doing any work:

| Sibling     | Hue distance | Its silhouette                                                             | Against the cap                                                                                              |
| ----------- | ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Persona     | 30°          | Filled rounded panel, hazard bar across its top, head-and-shoulders inside | A peaked angular form against a filled rectangle. One has a point at the top; the other has a straight edge. |
| Textview.qs | 61°          | Stack of horizontal bars, two struck by a band                             | Converging diagonals against parallel horizontals.                                                           |
| Audit.qs    | 115°         | Upright document with a disc low and right                                 | Wide and top-heavy against tall with a satellite.                                                            |

Persona is the one the style guide names, and it is the easy one. At 16 px the cap is still a
peak with a notch under it and Persona is still a white rectangle with a dark figure in it; there
is no size at which they trend towards each other, because one silhouette is angular and the
other is orthogonal. Checked as fullbleeds, which is where both are most compressed.

## What differs between the files

The style guide allows `-fullbleed.svg` to depart from the logo's geometry. Here it has to, and
`-mono.svg` has to as well, for the same underlying reason: **both are one colour, and the V
cannot survive on a tonal difference that no longer exists.**

| File                                                                          | How it makes the V                                     | Tassel |
| ----------------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| `-logo`, `-mark`, `-on-dark`, `-lockup`, `-og`, `-social`, `-square`, `-hero` | Two shapes, each ramping across its own `iconGrad` box | kept   |
| `-fullbleed`                                                                  | One `evenodd` path; board ∩ crown is a hole            | kept   |
| `-mono`                                                                       | One `evenodd` path; board ∩ crown is a hole            | kept   |

The `evenodd` trick is worth stating plainly, because it is not obvious and it is what makes the
single-colour files work: with the board and the crown as two subpaths of one `fill-rule="evenodd"`
path, the region they overlap is covered twice and is therefore knocked out. That region is the V.
It falls out of the geometry already there — no slot has to be drawn, and nothing has to be
positioned by hand.

**The merged alternative was tried and rejected.** Knocking board and crown out as one plain white
shape — which is what `-fullbleed.svg` would do without `evenodd` — produces something that reads
as a house or an arrow, at 32 px as plainly as at 16. That is not a small-size failure to be
weighed against convenience; it is simply not the mark.

**The tassel is kept everywhere, which was not the expectation.** Its cord is sub-pixel at 16 px,
and the family's precedent — Chatbox.qs's three dots, Find.qs's interior bars — is to drop fine
repeated detail from the fullbleed. It survives here because it is _detached_: it has nothing to
smear across, so it fades to a soft tick on the right rather than reading as damage, and it is
fully legible at 24 and 32. Dropped and kept were rendered side by side at all three sizes before
choosing; `render.sh` regenerates the sheet that decided it.

**The fullbleed ground keeps the declared `iconGrad` rather than deepening it.** White on
`#00B050` is 2.87:1 and on `#007A38` is 5.47:1, so the top stop sits a shade under the 3:1 the
family adopted as its floor when Textview.qs deepened lime. The contact sheet is the test rather
than the number, and it shows no wash-out: the top of this mark is the board, the boldest and
widest thing in it, where lime's problem was fine detail high in the frame. Re-check if the glyph
ever grows fine detail near the top.

## The lockup is 358 wide

Measured, not guessed, by the procedure in the scaffold's own README. "Onboard.qs" sets 227 px of
ink from x=121 at 42 px/600, so `121 + 227 + 10 = 358`. The three derived centring offsets are
242 (`-og`), 282 (`-social`) and 206 (`-square`); all three were verified by trimming the rendered
cards, and the ink sits symmetric to within a pixel.

Worth noting against the temptation to count characters: "Onboard.qs" is ten characters and sets
227 px, while Textview.qs is eleven and sets 224.

## What changed from the 140 px PNG

The silhouette is the same cap, measured off the committed PNG row by row and scaled into the
family's glyph box. Three things did change, all deliberate:

1. **Geometry moved to the family box.** The glyph was 100 × 78 at x 20–120, y 32–110, with the
   wordmark baseline at y≈130. It is now 88 × 78 at x 26–114, y 18–96, with the baseline at
   y=112 — which is where the rest of the family puts it.
2. **Flat tones became the family gradient.** Described above.
3. **The board's 3D thickness lip was dropped.** The old mark drew a `#007A38` edge under the
   board's left and right corners. It is detail that reads at 512 px and is gone by 32, which the
   style guide is explicit about not keeping. Its colour survives as the gradient's dark stop.

## Rendering

```bash
brew install librsvg imagemagick   # once
docs/logo/render.sh
```

Never hand-edit a PNG. `render.sh` is idempotent: run it, then `git status`. A clean tree means
every raster here is reproducible from a source; a dirty one means either an unrendered change or
a hand-edited file, and tells you which.

## Where the output goes

| Path                           | What                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| `docs/logo/*.png`              | Light rasters beside their sources — READMEs, docs, slides            |
| `assets/logo/*.png`            | Social cards, blog hero, high-resolution                              |
| `assets/logo/*-print-1200.png` | 300 PPI, 4 inch square; density verified by `render.sh`               |
| `assets/logo/docs-site/*`      | Documentation-site favicons                                           |
| `preview.svg`, `preview.png`   | 280 × 280, named by `src/meta.json`; what the Sense asset panel shows |

`docs/logo/legibility-check.png` is written on every run and is gitignored. It is for looking at,
not for shipping.
