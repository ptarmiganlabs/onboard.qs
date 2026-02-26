# RTL (Right-to-Left) Language Support — Investigation

This document captures the investigation into adding RTL language support to Onboard.qs, covering the current state, available options, and the work required.

## Background

RTL languages (Arabic, Hebrew, Persian/Farsi, Urdu, etc.) require text, layout, and UI controls to flow from right to left. Web standards provide two main mechanisms:

1. **The `dir="rtl"` HTML attribute** — flips the inline base direction of text and layout.
2. **CSS logical properties** — replace physical properties (`left`/`right`) with flow-relative ones (`inline-start`/`inline-end`), so the same CSS works for both LTR and RTL.

## Current state of the extension

Onboard.qs has **no RTL awareness today**. Specific findings:

| Area                                       | Status                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| CSS (`style.css`)                          | Uses physical properties exclusively (`padding-left`, `text-align: left`, `border-left`, `margin-left`, `left: 50%`, etc.) |
| Widget renderer (`widget-renderer.js`)     | Dropdown menu positioned with hardcoded `menu.style.left`                                                                  |
| Tour editor (`tour-editor.js`)             | Panel layout assumes LTR; selected-item indicator uses `border-left`                                                       |
| Tour runner (`tour-runner.js`)             | Popover `side` values (`left`/`right`) are physical, not logical                                                           |
| Markdown output (`markdown.js`)            | Generated HTML is neutral, but relies on CSS for list indentation (`padding-left`)                                         |
| Property panel (`ext.js`)                  | No text-direction property; horizontal alignment uses `left`/`center`/`right` labels                                       |
| Object properties (`object-properties.js`) | No RTL-related defaults                                                                                                    |

## How Qlik Sense exposes RTL

### Detection via layout

Qlik Sense apps have an RTL toggle in app properties. When enabled, the property propagates to extensions through the layout object:

```js
const layout = useLayout();
const isRtl = layout.rtl === true;
```

This boolean is the **primary signal** the extension should use to determine text direction.

### Detection via the DOM

As a fallback (or for defensive coding), the host page's `<html dir="rtl">` attribute or `document.documentElement.dir` can also be checked:

```js
const isRtl =
    document.documentElement.dir === 'rtl' ||
    getComputedStyle(document.documentElement).direction === 'rtl';
```

### Recommended approach

Use `layout.rtl` as the authoritative source. Fall back to DOM detection for edge cases (e.g., nebula.js `serve` during development where no Qlik layout is present).

## Driver.js RTL support

Driver.js **v1.3.x** (the version used by this project) does **not** have built-in RTL support. However, it provides enough hooks to implement it externally:

| Mechanism                  | How it helps                                                                |
| -------------------------- | --------------------------------------------------------------------------- |
| `popoverClass` option      | Add a custom CSS class (e.g., `driver-popover--rtl`) to scope RTL overrides |
| `onPopoverRender` callback | Mutate the popover DOM at render time (e.g., set `dir="rtl"`)               |
| CSS overrides              | Target `.driver-popover` when `[dir="rtl"]` is set on the root              |

### Key driver.js concerns

- **Popover positioning**: `side: 'left'` and `side: 'right'` are physical. In an RTL context, "left" should visually be "end" and "right" should be "start". The extension would need to **swap** these values when RTL is active.
- **Button order**: The "Previous" / "Next" navigation buttons inside popovers should swap position or arrow direction for RTL.
- **Arrow direction**: The popover arrow SVG may need `transform: scaleX(-1)` in RTL.

## Options for implementation

### Option A — CSS logical properties + `dir` attribute (recommended)

**Approach**: Set `dir="rtl"` on the extension's root element when `layout.rtl` is true, and convert all physical CSS properties to their logical equivalents.

**Pros**:

- Clean, standards-based approach.
- CSS logical properties have excellent browser support (all modern browsers).
- A single stylesheet works for both LTR and RTL — no duplication.
- Aligns with how the broader web ecosystem handles RTL.

**Cons**:

- Requires touching most CSS rules in `style.css`.
- Some JavaScript positioning logic (dropdown menu) needs updating.
- Driver.js overrides require additional CSS selectors.

### Option B — Separate RTL stylesheet

**Approach**: Keep current LTR CSS as-is. Add a second stylesheet (`style-rtl.css`) that overrides directional properties when `[dir="rtl"]` is present on the root.

**Pros**:

- No risk of breaking existing LTR behavior.
- Changes are isolated in a separate file.

**Cons**:

- Two files to maintain — easy to drift out of sync.
- Increases bundle size.
- Still requires the same JavaScript changes as Option A.

### Option C — CSS `direction` property only (not recommended)

**Approach**: Set `direction: rtl` on the root element without converting to logical properties.

**Pros**:

- Smallest code change.

**Cons**:

- Does not flip `padding-left`, `margin-left`, `border-left`, or absolute positioning.
- Results in a broken half-RTL layout.
- Not a real solution — would need supplemental overrides anyway.

### Recommendation

**Option A** is the recommended path. It is the most maintainable, aligns with web standards, and avoids stylesheet duplication.

## Detailed work breakdown

### 1. RTL detection and propagation

- Read `layout.rtl` in `src/index.js` and set `dir` attribute on the extension root element.
- Pass the `isRtl` flag to `widget-renderer.js`, `tour-runner.js`, and `tour-editor.js`.

**Estimated scope**: ~10–15 lines across 3–4 files.

### 2. CSS logical property conversion (`style.css`)

Convert all physical directional properties to logical equivalents:

| Physical property                | Logical equivalent                            |
| -------------------------------- | --------------------------------------------- |
| `margin-left` / `margin-right`   | `margin-inline-start` / `margin-inline-end`   |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right`   | `border-inline-start` / `border-inline-end`   |
| `text-align: left` / `right`     | `text-align: start` / `end`                   |
| `left` / `right` (positioning)   | `inset-inline-start` / `inset-inline-end`     |
| `float: left` / `right`          | `float: inline-start` / `inline-end`          |

**Identified instances in `style.css`**:

| Line(s)   | Current property                         | Required change                                        |
| --------- | ---------------------------------------- | ------------------------------------------------------ |
| ~19–21    | `padding-left` / `padding-right`         | `padding-inline-start` / `padding-inline-end`          |
| ~152      | `text-align: left`                       | `text-align: start`                                    |
| ~301      | `margin-left: auto`                      | `margin-inline-start: auto`                            |
| ~348      | `text-align: right`                      | `text-align: end`                                      |
| ~416, 421 | `border-right` / `border-left`           | `border-inline-end` / `border-inline-start`            |
| ~488, 546 | `border-left` (selection indicator)      | `border-inline-start`                                  |
| ~666      | `margin-left: 4px`                       | `margin-inline-start: 4px`                             |
| ~678, 702 | `left: 50%; transform: translateX(-50%)` | `inset-inline-start: 50%` (keep `translateX(-50%)` — the transform is direction-neutral for centering) |
| ~886      | `padding-left: 20px` (blockquote)        | `padding-inline-start: 20px`                           |
| ~892      | `border-left: 3px solid` (blockquote)    | `border-inline-start: 3px solid`                       |

**Estimated scope**: ~20–30 property changes in one file.

### 3. Widget renderer (`widget-renderer.js`)

- **Dropdown menu positioning** (~line 196): Currently uses `menu.style.left = rect.left`. For RTL, calculate from `rect.right` and use `right` positioning, or use `inset-inline-start`.
- **Horizontal alignment class mapping**: The `--h-left` and `--h-right` CSS classes map to flexbox `justify-content`. If CSS is converted to logical properties, these should continue working. Verify with testing.

**Estimated scope**: ~5–10 lines.

### 4. Tour runner (`tour-runner.js`)

- **Popover side swapping**: When RTL is active, swap `side: 'left'` ↔ `side: 'right'` before passing to driver.js. Vertical sides (`top`/`bottom`) are unaffected.
- **Popover align swapping**: When RTL is active, swap `align: 'start'` ↔ `align: 'end'`. The `center` value is unaffected.
- **Popover class**: Add a `driver-popover--rtl` class via `popoverClass` when RTL is active.

**Estimated scope**: ~10–15 lines.

### 5. Driver.js CSS overrides

Add RTL-specific overrides for the driver.js popover:

```css
[dir='rtl'] .driver-popover {
    direction: rtl;
    text-align: start;
}

[dir='rtl'] .driver-popover-navigation-btns {
    flex-direction: row-reverse;
}
```

**Estimated scope**: ~15–25 lines of CSS.

### 6. Tour editor (`tour-editor.js`)

- The editor modal is only visible in **edit mode** and is rendered as a full-screen overlay.
- The flex-based panel layout should reverse automatically when `dir="rtl"` is set on the modal root, but needs verification.
- Selection indicators (`border-left`) will be handled by the CSS logical property conversion.
- Up/down movement buttons are vertical, so no RTL concern.

**Estimated scope**: Minimal — mostly covered by CSS changes. ~5 lines for `dir` attribute propagation.

### 7. Property panel (`ext.js`)

- Consider whether to add an explicit **text direction override** property (e.g., `Auto / LTR / RTL`). This would let users force a direction independently of the Qlik app setting.
- The horizontal alignment options (`left`/`center`/`right`) are **user-facing labels** — they describe visual intent and should remain as-is. The underlying CSS will handle the actual direction.

**Estimated scope**: Optional — 0 lines if relying solely on `layout.rtl`, ~20 lines if adding a manual override property.

### 8. Markdown output (`markdown.js`)

- The generated HTML (`<ul>`, `<ol>`, `<blockquote>`) is semantically neutral and inherits direction from the parent `dir` attribute.
- No code changes needed in the markdown parser. The CSS changes in step 2 (logical properties for padding/border on lists and blockquotes) cover this.

**Estimated scope**: 0 lines.

### 9. Testing

- **Visual testing**: Verify widget button, dropdown menu, tour editor, and driver.js popovers render correctly in both LTR and RTL modes.
- **Functional testing**: Confirm tour step navigation, popover positioning, and menu interactions work in RTL.
- **Edge cases**: Mixed-direction content (e.g., English text inside an RTL tour step), bidirectional URLs in markdown links.

## Summary

| Work item                          | Files affected                                                       | Estimated lines changed |
| ---------------------------------- | -------------------------------------------------------------------- | ----------------------- |
| RTL detection & propagation        | `index.js`, `widget-renderer.js`, `tour-runner.js`, `tour-editor.js` | ~15                     |
| CSS logical properties             | `style.css`                                                          | ~30                     |
| Widget dropdown positioning        | `widget-renderer.js`                                                 | ~10                     |
| Tour popover side/align swap       | `tour-runner.js`                                                     | ~15                     |
| Driver.js CSS overrides            | `style.css`                                                          | ~25                     |
| Tour editor `dir` attribute        | `tour-editor.js`                                                     | ~5                      |
| Property panel override (optional) | `ext.js`, `object-properties.js`                                     | ~20                     |
| Markdown parser                    | `markdown.js`                                                        | 0                       |
| **Total**                          | **6–8 files**                                                        | **~100–120 lines**      |

The recommended approach (Option A — CSS logical properties + `dir` attribute) provides a clean, maintainable solution. The total scope is moderate: primarily CSS property conversions, a handful of JavaScript positioning fixes, and driver.js RTL overrides.
