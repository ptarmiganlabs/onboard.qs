# The Onboard.qs asset panel tile is sharp now, and the logo has a source

_Applies to Onboard.qs 1.8.3 and later. Check the version number before publishing — see the notes
at the end._

## What changed

The image Qlik Sense shows for Onboard.qs in the asset panel was 140 × 140. Every other extension
in the family ships 280 × 280, so Sense was scaling the Onboard.qs tile up and it looked soft
beside its siblings. It is now 280 × 280 and renders crisply.

**The mark itself is the same graduation cap it has always been** — a green cap on a pale green
card with the name beneath. It has been redrawn rather than resized, because there was nothing to
resize from: the 140 px PNG was the only original anyone had, and a PNG cannot be enlarged without
going soft. The new drawing is a vector source, so it can be rendered at any size from now on.

Three things about the drawing did change, and they are visible if you put the two side by side:

- The cap and the name sit where the rest of the family puts them, which lifts both slightly.
- The cap is shaded with a top-to-bottom gradient instead of two flat greens. The notch where the
  mortarboard crosses the crown is still there — it is what makes the shape a cap rather than a
  diamond on a bowl — but it now comes from the shading rather than from a hard colour change.
- The thin 3D lip under the mortarboard's left and right corners is gone. It was detail that only
  resolved at large sizes and disappeared in the asset panel anyway.

Onboard.qs is one of a family of Ptarmigan Labs Qlik Sense extensions that share a card shape and
take one colour each — Audit.qs amber, Chatbox.qs rose, QvsView.qs purple, Find.qs orange,
Onboard.qs green. Side by side in the asset panel they read as a set.

## What it does not change

- **Nothing about how the extension behaves.** This is artwork. No tour, step, setting or
  selector is affected.
- **No upgrade step, and nothing to reconfigure.** The new tile appears when the extension is
  reinstalled, like any other part of the package.
- **The screenshots in the documentation are untouched.** They show what Onboard.qs actually
  produces, which the tile has never tried to do and should not.

## Assets, for whoever builds the site

Every image is rendered from an SVG source in `docs/logo/` by `docs/logo/render.sh`. **Never
hand-edit one of the PNGs**: the script is idempotent and will silently overwrite it on the next
run, and the change is then unreproducible.

| Need                                        | Use                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Favicons for the site                       | `assets/logo/docs-site/` — a complete set, 16 px through 512 px, plus `favicon.ico` and `favicon.svg` |
| Logo in a page or a README                  | `docs/logo/onboard-qs-logo-256.png`                                                                   |
| Beside a heading that already says the name | `docs/logo/onboard-qs-mark-256.png`                                                                   |
| Link preview / OpenGraph card               | `assets/logo/onboard-qs-og.png`, 1200 × 630                                                           |
| Blog header                                 | `assets/logo/onboard-qs-hero.png`, 1200 × 600                                                         |
| Dark background                             | `assets/logo/onboard-qs-on-dark-512.png` — the light card's wordmark is unreadable on dark            |
| Print, stickers, handouts                   | `assets/logo/onboard-qs-logo-print-1200.png`, 300 PPI, a 4 inch square                                |

[`docs/logo/README.md`](../docs/logo/README.md) explains the palette, where its values were
sampled from, and what differs between the files.

---

## Notes for the publishing pass — remove before publishing

- Probably not a page of its own. The assets table is the part with lasting value and belongs
  wherever the site keeps its own build notes; the rest is at most a line in a release note.
- The favicon set is the actionable item: the site should take `assets/logo/docs-site/` verbatim
  rather than keeping SVG sources of its own, so the mark is rendered from one place.
- The version gate says 1.8.3 because 1.8.2 is the released version this lands on top of and the
  change is a `fix:`. There was no open release-please pull request when this was written, so
  check what the number actually ships as before publishing.
- Worth deciding whether this is interesting to a reader at all. Unlike Find.qs's logo change,
  which replaced a screenshot with a mark, this one is the same mark drawn properly — the user
  benefit is "it is not blurry any more", which may not warrant a page.
