---
name: ext
description: 'Skill for the Ext area of onboard.qs. 16 symbols across 8 files.'
---

# Ext

16 symbols | 8 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how aboutSection, ext, securitySection work
- Modifying ext-related functionality

## Key Files

| File                          | Symbols                                              |
| ----------------------------- | ---------------------------------------------------- |
| `src/ext/theme-helpers.js`    | toPickerObj, presetVal, themePlaceholder, themeLabel |
| `src/ext/theme-section.js`    | themeSection, change, placeholder, label             |
| `src/ext/tours-section.js`    | toursSection, getObjectList, getCurrentSheetId       |
| `src/ext/about-section.js`    | aboutSection                                         |
| `src/ext/index.js`            | ext                                                  |
| `src/ext/security-section.js` | securitySection                                      |
| `src/ext/widget-section.js`   | widgetSection                                        |
| `src/index.js`                | supernova                                            |

## Entry Points

Start here when exploring this area:

- **`aboutSection`** (Function) — `src/ext/about-section.js:10`
- **`ext`** (Function) — `src/ext/index.js:16`
- **`securitySection`** (Function) — `src/ext/security-section.js:8`
- **`toPickerObj`** (Function) — `src/ext/theme-helpers.js:31`
- **`themeSection`** (Function) — `src/ext/theme-section.js:11`

## Key Symbols

| Symbol              | Type     | File                          | Line |
| ------------------- | -------- | ----------------------------- | ---- |
| `aboutSection`      | Function | `src/ext/about-section.js`    | 10   |
| `ext`               | Function | `src/ext/index.js`            | 16   |
| `securitySection`   | Function | `src/ext/security-section.js` | 8    |
| `toPickerObj`       | Function | `src/ext/theme-helpers.js`    | 31   |
| `themeSection`      | Function | `src/ext/theme-section.js`    | 11   |
| `change`            | Function | `src/ext/theme-section.js`    | 40   |
| `toursSection`      | Function | `src/ext/tours-section.js`    | 158  |
| `widgetSection`     | Function | `src/ext/widget-section.js`   | 10   |
| `supernova`         | Function | `src/index.js`                | 85   |
| `presetVal`         | Function | `src/ext/theme-helpers.js`    | 43   |
| `themePlaceholder`  | Function | `src/ext/theme-helpers.js`    | 72   |
| `placeholder`       | Function | `src/ext/theme-section.js`    | 68   |
| `themeLabel`        | Function | `src/ext/theme-helpers.js`    | 61   |
| `label`             | Function | `src/ext/theme-section.js`    | 59   |
| `getObjectList`     | Function | `src/ext/tours-section.js`    | 11   |
| `getCurrentSheetId` | Function | `src/ext/tours-section.js`    | 32   |

## Execution Flows

| Flow                          | Type            | Steps |
| ----------------------------- | --------------- | ----- |
| `Supernova → ToPickerObj`     | intra_community | 4     |
| `Placeholder → PresetVal`     | intra_community | 3     |
| `Supernova → WidgetSection`   | intra_community | 3     |
| `Supernova → SecuritySection` | intra_community | 3     |
| `Supernova → ToursSection`    | intra_community | 3     |

## How to Explore

1. `gitnexus_context({name: "aboutSection"})` — see callers and callees
2. `gitnexus_query({query: "ext"})` — find related execution flows
3. Read key files listed above for implementation details
