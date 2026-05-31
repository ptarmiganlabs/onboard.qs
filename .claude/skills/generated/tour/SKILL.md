---
name: tour
description: 'Skill for the Tour area of onboard.qs. 33 symbols across 12 files.'
---

# Tour

33 symbols | 12 files | Cohesion: 68%

## When to Use

- Working with code in `src/`
- Understanding how buildDriverSteps, tours, tours work
- Modifying tour-related functionality

## Key Files

| File                         | Symbols                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/tour/tour-runner.js`    | getStepDialogSize, clampDialogDimension, getStepDialogSettings, buildDriverSteps, onDestroyed (+6) |
| `src/tour/tour-storage.js`   | buildKey, hasSeenTour, markTourSeen, resetTourSeen                                                 |
| `src/tour/tour-io.js`        | importFromFile, validateImportData, sanitizeImportData, mergeTours                                 |
| `src/util/tab-switcher.js`   | getTabInfo, ensureTabVisibleSync, waitForElement, ensureTabVisible                                 |
| `src/util/markdown.js`       | markdownToHtml, filterMediaUris, stripHtml                                                         |
| `src/ui/toolbar-injector.js` | tours                                                                                              |
| `src/ui/widget-renderer.js`  | tours                                                                                              |
| `src/util/visibility.js`     | isVisible                                                                                          |
| `src/tour/tour-helpers.js`   | handleAutoStart                                                                                    |
| `src/index.js`               | tours                                                                                              |

## Entry Points

Start here when exploring this area:

- **`buildDriverSteps`** (Function) — `src/tour/tour-runner.js:86`
- **`tours`** (Function) — `src/ui/toolbar-injector.js:105`
- **`tours`** (Function) — `src/ui/widget-renderer.js:27`
- **`markdownToHtml`** (Function) — `src/util/markdown.js:43`
- **`isVisible`** (Function) — `src/util/visibility.js:19`

## Key Symbols

| Symbol                 | Type     | File                         | Line |
| ---------------------- | -------- | ---------------------------- | ---- |
| `buildDriverSteps`     | Function | `src/tour/tour-runner.js`    | 86   |
| `tours`                | Function | `src/ui/toolbar-injector.js` | 105  |
| `tours`                | Function | `src/ui/widget-renderer.js`  | 27   |
| `markdownToHtml`       | Function | `src/util/markdown.js`       | 43   |
| `isVisible`            | Function | `src/util/visibility.js`     | 19   |
| `handleAutoStart`      | Function | `src/tour/tour-helpers.js`   | 28   |
| `onDestroyed`          | Function | `src/tour/tour-runner.js`    | 294  |
| `hasSeenTour`          | Function | `src/tour/tour-storage.js`   | 33   |
| `markTourSeen`         | Function | `src/tour/tour-storage.js`   | 54   |
| `resetTourSeen`        | Function | `src/tour/tour-storage.js`   | 78   |
| `importFromFile`       | Function | `src/tour/tour-io.js`        | 71   |
| `runTour`              | Function | `src/tour/tour-runner.js`    | 207  |
| `stripHtml`            | Function | `src/util/markdown.js`       | 29   |
| `tours`                | Function | `src/index.js`               | 173  |
| `mergeTours`           | Function | `src/tour/tour-io.js`        | 209  |
| `generateUUID`         | Function | `src/util/uuid.js`           | 5    |
| `element`              | Function | `src/tour/tour-runner.js`    | 146  |
| `highlightStep`        | Function | `src/tour/tour-runner.js`    | 328  |
| `getTabInfo`           | Function | `src/util/tab-switcher.js`   | 116  |
| `ensureTabVisibleSync` | Function | `src/util/tab-switcher.js`   | 227  |

## Execution Flows

| Flow                                  | Type            | Steps |
| ------------------------------------- | --------------- | ----- |
| `RenderWidget → GetStepDialogSize`    | cross_community | 7     |
| `RenderWidget → ClampDialogDimension` | cross_community | 7     |
| `RenderWidget → FilterMediaUris`      | cross_community | 7     |
| `RenderWidget → IsVisible`            | cross_community | 6     |
| `RenderWidget → StripHtml`            | cross_community | 6     |
| `ClickHandler → GetStepDialogSize`    | cross_community | 6     |
| `ClickHandler → ClampDialogDimension` | cross_community | 6     |
| `ClickHandler → FilterMediaUris`      | cross_community | 6     |
| `ClickHandler → IsVisible`            | cross_community | 6     |
| `ShowToolbarMenu → GetStepDialogSize` | cross_community | 6     |

## Connected Areas

| Area     | Connections |
| -------- | ----------- |
| Platform | 5 calls     |
| Ui       | 2 calls     |

## How to Explore

1. `gitnexus_context({name: "buildDriverSteps"})` — see callers and callees
2. `gitnexus_query({query: "tour"})` — find related execution flows
3. Read key files listed above for implementation details
