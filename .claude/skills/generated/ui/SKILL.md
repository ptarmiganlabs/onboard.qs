---
name: ui
description: 'Skill for the Ui area of onboard.qs. 69 symbols across 12 files.'
---

# Ui

69 symbols | 12 files | Cohesion: 78%

## When to Use

- Working with code in `src/`
- Understanding how resolveTheme, applyThemeToElement, renderWidget work
- Modifying ui-related functionality

## Key Files

| File                               | Symbols                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/ui/tour-editor.js`            | wrapIfExpression, unwrapExpression, extractExpression, wrapExpressions, overlayExpressions (+22) |
| `src/ui/toolbar-injector.js`       | injectToolbarButton, waitAndInject, tryInject, cleanup, watchForRemoval (+10)                    |
| `src/ui/widget-renderer.js`        | renderWidget, openAboutModal, close, onKey, buildButtonSizeStyle (+5)                            |
| `src/ui/markdown-editor-dialog.js` | hasPendingChanges, guardedClose, onKeyDown, openMarkdownEditorDialog, updateCounter (+1)         |
| `src/ui/confirm-discard.js`        | confirmDiscardChanges, cleanup, onKey                                                            |
| `src/theme/resolve.js`             | resolveTheme, applyThemeToElement                                                                |
| `src/util/sanitize.js`             | sanitizeIconName                                                                                 |
| `src/tour/tour-io.js`              | exportToursAndTheme                                                                              |
| `src/index.js`                     | onClose                                                                                          |
| `src/ext/tours-section.js`         | onSave                                                                                           |

## Entry Points

Start here when exploring this area:

- **`resolveTheme`** (Function) — `src/theme/resolve.js:80`
- **`applyThemeToElement`** (Function) — `src/theme/resolve.js:130`
- **`renderWidget`** (Function) — `src/ui/widget-renderer.js:25`
- **`openAboutModal`** (Function) — `src/ui/widget-renderer.js:253`
- **`close`** (Function) — `src/ui/widget-renderer.js:294`

## Key Symbols

| Symbol                      | Type     | File                               | Line |
| --------------------------- | -------- | ---------------------------------- | ---- |
| `resolveTheme`              | Function | `src/theme/resolve.js`             | 80   |
| `applyThemeToElement`       | Function | `src/theme/resolve.js`             | 130  |
| `renderWidget`              | Function | `src/ui/widget-renderer.js`        | 25   |
| `openAboutModal`            | Function | `src/ui/widget-renderer.js`        | 253  |
| `close`                     | Function | `src/ui/widget-renderer.js`        | 294  |
| `onKey`                     | Function | `src/ui/widget-renderer.js`        | 303  |
| `sanitizeIconName`          | Function | `src/util/sanitize.js`             | 10   |
| `openTourEditor`            | Function | `src/ui/tour-editor.js`            | 174  |
| `render`                    | Function | `src/ui/tour-editor.js`            | 216  |
| `attachInnerListeners`      | Function | `src/ui/tour-editor.js`            | 232  |
| `attachStepDetailListeners` | Function | `src/ui/tour-editor.js`            | 464  |
| `attachTourDetailListeners` | Function | `src/ui/tour-editor.js`            | 580  |
| `exportToursAndTheme`       | Function | `src/tour/tour-io.js`              | 29   |
| `confirmDiscardChanges`     | Function | `src/ui/confirm-discard.js`        | 22   |
| `cleanup`                   | Function | `src/ui/confirm-discard.js`        | 83   |
| `onKey`                     | Function | `src/ui/confirm-discard.js`        | 105  |
| `hasPendingChanges`         | Function | `src/ui/markdown-editor-dialog.js` | 109  |
| `guardedClose`              | Function | `src/ui/markdown-editor-dialog.js` | 115  |
| `onKeyDown`                 | Function | `src/ui/markdown-editor-dialog.js` | 164  |
| `registerToolbarTours`      | Function | `src/ui/toolbar-injector.js`       | 103  |

## Execution Flows

| Flow                                  | Type            | Steps |
| ------------------------------------- | --------------- | ----- |
| `Render → Notify`                     | cross_community | 8     |
| `RenderWidget → GetStepDialogSize`    | cross_community | 7     |
| `RenderWidget → ClampDialogDimension` | cross_community | 7     |
| `RenderWidget → FilterMediaUris`      | cross_community | 7     |
| `RegisterToolbarTours → Cleanup`      | cross_community | 7     |
| `OpenTourEditor → EscapeAttr`         | cross_community | 6     |
| `RenderWidget → IsVisible`            | cross_community | 6     |
| `RenderWidget → StripHtml`            | cross_community | 6     |
| `ClickHandler → GetStepDialogSize`    | cross_community | 6     |
| `ClickHandler → ClampDialogDimension` | cross_community | 6     |

## Connected Areas

| Area     | Connections |
| -------- | ----------- |
| Tour     | 5 calls     |
| Util     | 2 calls     |
| Platform | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "resolveTheme"})` — see callers and callees
2. `gitnexus_query({query: "ui"})` — find related execution flows
3. Read key files listed above for implementation details
