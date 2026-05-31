---
name: util
description: 'Skill for the Util area of onboard.qs. 20 symbols across 3 files.'
---

# Util

20 symbols | 3 files | Cohesion: 81%

## When to Use

- Working with code in `src/`
- Understanding how createTabbedMarkdownEditor, updatePreview, applyBold work
- Modifying util-related functionality

## Key Files

| File                             | Symbols                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `src/util/markdown-shortcuts.js` | notify, wrapSelection, insertLink, applyBold, applyItalic (+10) |
| `src/ui/markdown-toolbar.js`     | applyAction, createTabbedMarkdownEditor, updatePreview          |
| `src/util/tab-switcher.js`       | buildTabContainerMap, inspectObject                             |

## Entry Points

Start here when exploring this area:

- **`createTabbedMarkdownEditor`** (Function) — `src/ui/markdown-toolbar.js:124`
- **`updatePreview`** (Function) — `src/ui/markdown-toolbar.js:178`
- **`applyBold`** (Function) — `src/util/markdown-shortcuts.js:173`
- **`applyItalic`** (Function) — `src/util/markdown-shortcuts.js:182`
- **`applyCode`** (Function) — `src/util/markdown-shortcuts.js:191`

## Key Symbols

| Symbol                       | Type     | File                             | Line |
| ---------------------------- | -------- | -------------------------------- | ---- |
| `createTabbedMarkdownEditor` | Function | `src/ui/markdown-toolbar.js`     | 124  |
| `updatePreview`              | Function | `src/ui/markdown-toolbar.js`     | 178  |
| `applyBold`                  | Function | `src/util/markdown-shortcuts.js` | 173  |
| `applyItalic`                | Function | `src/util/markdown-shortcuts.js` | 182  |
| `applyCode`                  | Function | `src/util/markdown-shortcuts.js` | 191  |
| `applyLink`                  | Function | `src/util/markdown-shortcuts.js` | 200  |
| `applyHeading3`              | Function | `src/util/markdown-shortcuts.js` | 236  |
| `applyHeading4`              | Function | `src/util/markdown-shortcuts.js` | 245  |
| `applyHorizontalRule`        | Function | `src/util/markdown-shortcuts.js` | 254  |
| `attachMarkdownShortcuts`    | Function | `src/util/markdown-shortcuts.js` | 278  |
| `applyOrderedList`           | Function | `src/util/markdown-shortcuts.js` | 209  |
| `applyUnorderedList`         | Function | `src/util/markdown-shortcuts.js` | 218  |
| `applyBlockquote`            | Function | `src/util/markdown-shortcuts.js` | 227  |
| `buildTabContainerMap`       | Function | `src/util/tab-switcher.js`       | 34   |
| `inspectObject`              | Function | `src/util/tab-switcher.js`       | 62   |
| `applyAction`                | Function | `src/ui/markdown-toolbar.js`     | 68   |
| `notify`                     | Function | `src/util/markdown-shortcuts.js` | 34   |
| `wrapSelection`              | Function | `src/util/markdown-shortcuts.js` | 47   |
| `insertLink`                 | Function | `src/util/markdown-shortcuts.js` | 75   |
| `toggleLinePrefix`           | Function | `src/util/markdown-shortcuts.js` | 115  |

## Execution Flows

| Flow                                       | Type            | Steps |
| ------------------------------------------ | --------------- | ----- |
| `Render → Notify`                          | cross_community | 8     |
| `OpenMarkdownEditorDialog → Notify`        | cross_community | 6     |
| `Render → UpdatePreview`                   | cross_community | 5     |
| `OpenMarkdownEditorDialog → UpdatePreview` | cross_community | 3     |
| `ApplyOrderedList → Notify`                | cross_community | 3     |
| `ApplyUnorderedList → Notify`              | cross_community | 3     |
| `ApplyBlockquote → Notify`                 | cross_community | 3     |
| `ApplyHeading3 → Notify`                   | intra_community | 3     |
| `ApplyHeading4 → Notify`                   | intra_community | 3     |

## How to Explore

1. `gitnexus_context({name: "createTabbedMarkdownEditor"})` — see callers and callees
2. `gitnexus_query({query: "util"})` — find related execution flows
3. Read key files listed above for implementation details
