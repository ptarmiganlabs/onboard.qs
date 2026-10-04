#!/usr/bin/env bash
#
# Renders every derived logo file from the SVG sources in this directory.
# Run it after editing any SVG; never hand-edit a PNG.
#
#   docs/logo/render.sh
#
# Needs rsvg-convert and ImageMagick. Both are outside npm on purpose: nothing
# here is needed to build, test or run the thing being shipped, and the
# dependency list is short deliberately.
#
#   macOS:    brew install librsvg imagemagick
#   Windows:  winget install ImageMagick.ImageMagick  (rsvg-convert ships with
#             the GTK runtime; magick alone can do everything below, less
#             faithfully on text)
#
# This script is IDEMPOTENT: running it twice leaves the tree clean. That is
# how you prove no PNG was touched by hand -- run it, then `git status`. Output
# that is not reproducible from a source does not belong in the repository.
set -euo pipefail

for cmd in rsvg-convert magick; do
    command -v "$cmd" >/dev/null || {
        echo "missing $cmd -- see the comment at the top of this file" >&2
        exit 1
    }
done

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
cd "$HERE"

# --- Work out the tool's file prefix ---------------------------------------
# Everything is named <prefix>-<variant>.svg. Rather than hard-code the prefix
# in twenty places, derive it from the one file that must exist.
shopt -s nullglob
logos=(*-logo.svg)
shopt -u nullglob

if [ "${#logos[@]}" -eq 0 ]; then
    echo "no *-logo.svg in $HERE -- nothing to render" >&2
    exit 1
fi
if [ "${#logos[@]}" -gt 1 ]; then
    echo "more than one *-logo.svg in $HERE: ${logos[*]}" >&2
    echo "one logo per directory; the prefix is derived from it" >&2
    exit 1
fi

NAME="${logos[0]%-logo.svg}"

if [ "$NAME" = "TOOL" ]; then
    cat >&2 <<'MSG'
The template files are still called TOOL-*.svg.

Rename all ten to your tool's own prefix first -- the prefix is what every
output file is named after, and TOOL-logo.png is not a filename anyone wants
in a release. For a tool called Widget.qs:

  for f in TOOL-*.svg; do mv "$f" "widget-qs${f#TOOL}"; done

Then replace the placeholder name and the six palette values inside them. See
the style guide: rules/visual/logos.md in plabs-house-rules.
MSG
    exit 1
fi

# A soft check, not a hard one: a tool could in principle choose these values,
# though it should not -- slate is unclaimed but reads as disabled.
if grep -lq '#94A3B8\|#475569' *.svg 2>/dev/null; then
    echo "warning: the template's placeholder palette is still present." >&2
    echo "         Replace the six values -- see rules/visual/logos.md." >&2
    echo >&2
fi

ASSETS="$ROOT/assets/logo"
DOCSITE="$ASSETS/docs-site"
mkdir -p "$ASSETS" "$DOCSITE"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# --- docs/logo: the light rasters, committed next to their sources ----------
for s in 128 256 512; do
    rsvg-convert -w $s -h $s "$NAME-logo.svg" -o "$NAME-logo-$s.png"
done
for s in 128 256; do
    rsvg-convert -w $s -h $s "$NAME-mark.svg" -o "$NAME-mark-$s.png"
done

# --- assets/logo: the heavy rasters, blog and social ------------------------
rsvg-convert -w 1200 -h 630  "$NAME-og.svg"       -o "$ASSETS/$NAME-og.png"
rsvg-convert -w 1280 -h 640  "$NAME-social.svg"   -o "$ASSETS/$NAME-social.png"
rsvg-convert -w 1200 -h 1200 "$NAME-square.svg"   -o "$ASSETS/$NAME-square.png"
rsvg-convert -w 800          "$NAME-lockup.svg"   -o "$ASSETS/$NAME-lockup-800.png"
rsvg-convert -w 1600         "$NAME-lockup.svg"   -o "$ASSETS/$NAME-lockup-1600.png"
rsvg-convert -w 1024 -h 1024 "$NAME-logo.svg"     -o "$ASSETS/$NAME-logo-1024.png"
rsvg-convert -w 512  -h 512  "$NAME-on-dark.svg"  -o "$ASSETS/$NAME-on-dark-512.png"
rsvg-convert -w 1024 -h 1024 "$NAME-fullbleed.svg" -o "$ASSETS/$NAME-fullbleed-1024.png"

# The blog hero is optional: the newest set in the family has one, the older
# sets do not. Render it only if the source is there.
if [ -f "$NAME-hero.svg" ]; then
    rsvg-convert -w 1200 -h 600 "$NAME-hero.svg" -o "$ASSETS/$NAME-hero.png"
fi

# --- 300 PPI print assets ---------------------------------------------------
# For conference handouts, stickers, posters and anything else that leaves a
# screen. 1200 x 1200 at 300 PPI is a 4 inch square, which covers everything
# the family has actually needed.
#
# THE TRAP, and the reason this is a function rather than two more one-liners:
# `-strip` removes the density along with the timestamp, and setting -density
# afterwards does not reach the output. A stripped print asset still looks
# perfect and still measures 1200 x 1200 -- it has simply lost the metadata
# that makes it print at 4 inches instead of 16. Nothing downstream complains;
# it just comes out of the printer the wrong size.
#
# So these files drop the date properties by name instead, which leaves the
# density alone and still keeps regeneration byte-identical. Ported from
# guide.qs, which found this the hard way.
render_print() {
    local src="$1" out="$2"
    rsvg-convert -w 1200 -h 1200 "$src" -o "$tmp/print-src.png"
    magick "$tmp/print-src.png" \
        -colorspace sRGB -units PixelsPerInch -density 300 \
        -define png:color-type=6 \
        +set date:create +set date:modify +set date:timestamp \
        "$out"
}

render_print "$NAME-logo.svg"      "$ASSETS/$NAME-logo-print-1200.png"
render_print "$NAME-fullbleed.svg" "$ASSETS/$NAME-fullbleed-print-1200.png"

# --- The Qlik Sense extension's own preview ---------------------------------
# src/meta.json names preview.png, and `nebula sense` copies it into the
# generated extension folder, so this is what the Sense asset panel shows.
# 280 x 280 matches audit.qs and QvsView.qs. The SVG sits beside it as the
# editable original -- Sense never reads it.
#
# Guarded on src/meta.json: a tool that is not a Sense extension has no asset
# panel to show a preview in, and should not carry a stray preview.png.
if [ -f "$ROOT/src/meta.json" ]; then
    cp "$NAME-logo.svg" "$ROOT/preview.svg"
    rsvg-convert -w 280 -h 280 "$NAME-logo.svg" -o "$ROOT/preview.png"
fi

# --- Documentation site -----------------------------------------------------
# The web favicon set. It lives under assets/ so the doc site can copy it; this
# stays the single place the mark is rendered from, so the doc site repository
# holds no SVG sources of its own.
for s in 16 24 32 48 180 192 512; do
    rsvg-convert -w $s -h $s "$NAME-fullbleed.svg" -o "$tmp/i-$s.png"
done
cp "$tmp/i-16.png"  "$DOCSITE/favicon-16x16.png"
cp "$tmp/i-32.png"  "$DOCSITE/favicon-32x32.png"
cp "$tmp/i-180.png" "$DOCSITE/apple-touch-icon.png"
cp "$tmp/i-192.png" "$DOCSITE/android-chrome-192x192.png"
cp "$tmp/i-512.png" "$DOCSITE/android-chrome-512x512.png"
cp "$NAME-fullbleed.svg" "$DOCSITE/favicon.svg"
# Stopping at 48: ImageMagick writes ICO frames as uncompressed BMP, so a single
# 256 frame costs 262 KB -- more than every other file here put together.
magick "$tmp/i-16.png" "$tmp/i-32.png" "$tmp/i-48.png" -strip "$DOCSITE/favicon.ico"

# --- The legibility contact sheet -------------------------------------------
# Small-size legibility is tested, not assumed. Chatbox.qs shipped a glyph whose
# three dots broke into a checkerboard at 16 px, and nobody noticed until it was
# on a browser tab.
#
# The three real sizes, each also blown up 8x with no interpolation so the
# actual pixels are visible. Nearest-neighbour matters: a smooth upscale hides
# exactly the mush you are looking for.
#
# This file is deliberately NOT written into assets/ -- it is a tool for looking
# at, not an asset to ship, and it is gitignored.
#
# -strip on every magick call. Without it ImageMagick writes a date:create and
# date:modify chunk into the PNG, so the file differs on every run and the
# idempotency claim at the top of this script is quietly false -- which was
# caught by checksumming two consecutive runs, not by reading the code.
for s in 16 24 32; do
    magick "$tmp/i-$s.png" -filter point -resize 800% -strip "$tmp/big-$s.png"
done
#
# -background white -gravity center +append, then -alpha remove: NOT -flatten.
# `-flatten` composites onto the virtual canvas of the FIRST image, which here
# is 128x128, so the 24 and 32 px cells are silently cropped away and the sheet
# looks like a single blurry icon. Caught by checking the output's dimensions.
magick "$tmp/big-16.png" "$tmp/big-24.png" "$tmp/big-32.png" \
    -background white -gravity center +append -alpha remove -alpha off \
    -strip "$HERE/legibility-check.png"

# --- Verify the print assets kept their density -----------------------------
# The whole point of the section above is metadata that is invisible when you
# look at the file, so it is checked rather than trusted. A print asset that
# silently lost its density is the exact failure this guards.
for f in "$ASSETS/$NAME-logo-print-1200.png" "$ASSETS/$NAME-fullbleed-print-1200.png"; do
    read -r dx dy unit <<<"$(magick identify -format '%x %y %U' "$f")"
    case "$unit" in
        PixelsPerInch)
            ok=$(awk -v x="$dx" -v y="$dy" 'BEGIN { print (x == 300 && y == 300) ? "yes" : "no" }')
            ;;
        PixelsPerCentimeter)
            ok=$(awk -v x="$dx" -v y="$dy" \
                'BEGIN { print (x*2.54 > 299.9 && x*2.54 < 300.1 && y*2.54 > 299.9 && y*2.54 < 300.1) ? "yes" : "no" }')
            ;;
        *) ok=no ;;
    esac
    if [ "$ok" != "yes" ]; then
        echo "$(basename "$f") lost its 300 PPI density (got $dx x $dy $unit)" >&2
        echo "  something in this script stripped it -- see the comment on render_print" >&2
        exit 1
    fi
done

echo "wrote:"
echo "  docs/logo/*.png              README, docs, slides"
echo "  assets/logo/*.png            social cards, blog hero, high-res"
echo "  assets/logo/*-print-1200.png 300 PPI, 4 inch square, density verified"
echo "  assets/logo/docs-site/*      documentation site favicons"
if [ -f "$ROOT/src/meta.json" ]; then
    echo "  preview.svg, preview.png     the extension's asset-panel preview"
fi
echo
echo "  docs/logo/legibility-check.png   <- LOOK AT THIS ONE."
echo "      16, 24 and 32 px left to right, each blown up 8x with no"
echo "      interpolation. If the glyph is mush, or repeated elements have"
echo "      merged into each other, fix it in the fullbleed source before"
echo "      shipping. Not committed; regenerated every run."
echo
echo "      (The cells are unlabelled on purpose: labelling them needs a"
echo "      configured font, and ImageMagick on macOS frequently has none.)"
