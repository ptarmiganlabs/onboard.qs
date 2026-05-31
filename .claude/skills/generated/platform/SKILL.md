---
name: platform
description: 'Skill for the Platform area of onboard.qs. 17 symbols across 4 files.'
---

# Platform

17 symbols | 4 files | Cohesion: 81%

## When to Use

- Working with code in `src/`
- Understanding how resolveCodePath, getObjectSelector, getToolbarAnchor work
- Modifying platform-related functionality

## Key Files

| File                             | Symbols                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/platform/client-managed.js` | compareVersions, resolveCodePath, getObjectSelector, getToolbarAnchor, getVirtualProxyPrefix (+3) |
| `src/platform/cloud.js`          | getObjectSelector, getToolbarAnchor, getCurrentSheetId, getSheetObjects                           |
| `src/platform/index.js`          | getObjectSelectorSync, detectPlatformType, detectPlatform, getPlatformAdapter                     |
| `src/platform/selectors.js`      | getSelectors                                                                                      |

## Entry Points

Start here when exploring this area:

- **`resolveCodePath`** (Function) — `src/platform/client-managed.js:156`
- **`getObjectSelector`** (Function) — `src/platform/client-managed.js:346`
- **`getToolbarAnchor`** (Function) — `src/platform/client-managed.js:389`
- **`getObjectSelector`** (Function) — `src/platform/cloud.js:164`
- **`getToolbarAnchor`** (Function) — `src/platform/cloud.js:206`

## Key Symbols

| Symbol                  | Type     | File                             | Line |
| ----------------------- | -------- | -------------------------------- | ---- |
| `resolveCodePath`       | Function | `src/platform/client-managed.js` | 156  |
| `getObjectSelector`     | Function | `src/platform/client-managed.js` | 346  |
| `getToolbarAnchor`      | Function | `src/platform/client-managed.js` | 389  |
| `getObjectSelector`     | Function | `src/platform/cloud.js`          | 164  |
| `getToolbarAnchor`      | Function | `src/platform/cloud.js`          | 206  |
| `getObjectSelectorSync` | Function | `src/platform/index.js`          | 85   |
| `getSelectors`          | Function | `src/platform/selectors.js`      | 158  |
| `getVirtualProxyPrefix` | Function | `src/platform/client-managed.js` | 26   |
| `getSenseVersion`       | Function | `src/platform/client-managed.js` | 60   |
| `detectPlatformType`    | Function | `src/platform/index.js`          | 18   |
| `detectPlatform`        | Function | `src/platform/index.js`          | 36   |
| `getPlatformAdapter`    | Function | `src/platform/index.js`          | 69   |
| `getCurrentSheetId`     | Function | `src/platform/client-managed.js` | 181  |
| `getSheetObjects`       | Function | `src/platform/client-managed.js` | 229  |
| `getCurrentSheetId`     | Function | `src/platform/cloud.js`          | 18   |
| `getSheetObjects`       | Function | `src/platform/cloud.js`          | 59   |
| `compareVersions`       | Function | `src/platform/client-managed.js` | 140  |

## Execution Flows

| Flow                                     | Type            | Steps |
| ---------------------------------------- | --------------- | ----- |
| `RenderWidget → DetectPlatformType`      | cross_community | 5     |
| `ClickHandler → DetectPlatformType`      | cross_community | 5     |
| `ShowToolbarMenu → DetectPlatformType`   | cross_community | 4     |
| `HighlightStep → GetSelectors`           | cross_community | 3     |
| `OnNextClick → GetSelectors`             | cross_community | 3     |
| `OnPrevClick → GetSelectors`             | cross_community | 3     |
| `Element → GetSelectors`                 | cross_community | 3     |
| `DetectPlatform → GetVirtualProxyPrefix` | intra_community | 3     |
| `DetectPlatform → CompareVersions`       | cross_community | 3     |
| `GetObjectSelector → CompareVersions`    | intra_community | 3     |

## How to Explore

1. `gitnexus_context({name: "resolveCodePath"})` — see callers and callees
2. `gitnexus_query({query: "platform"})` — find related execution flows
3. Read key files listed above for implementation details
