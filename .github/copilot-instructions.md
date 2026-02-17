---
applyTo: '**'
---

# copilot-instructions.md

This file provides guidance to Copilot when working with code in the Onboard.qs repository.

## Onboarding

At the start of each session, read:

1. Any `**/README.md` docs across the project
2. Any `**/docs/*.md` docs for architecture, platform, tour system, selectors, and build/deployment details

## Quality Gates

When writing code, Copilot must not finish until all of these succeed:

1. `npm run lint:fix`
2. `npm run format`

If any check fails, fix the issues and run checks again.

## Project Basics (read this before changing code)

- This repo is a **Qlik Sense extension** built with [nebula.js](https://qlik.dev/toolkits/nebulajs/) and bundled as a UMD module via Rollup.
- `"type": "module"` in `package.json` — prefer `import`/`export` and ESM patterns.
- The Supernova entry point is `src/index.js`. The property panel is defined in `src/ext.js`.
- The extension supports **both Qlik Cloud and Qlik Sense Enterprise on Windows (client-managed)**.

## How to Build & Deploy

- Install deps: `npm ci`
- Development build + zip: `npm run pack:dev` → `onboard-qs.zip`
- Production build + zip: `npm run pack:prod` → `onboard-qs.zip`
- Common scripts:
    - `npm run lint:fix`
    - `npm run format`
    - `npm run build` (build only, no zip)
    - `npm run start` (nebula serve for local dev)

## Architecture

- **Platform layer** (`src/platform/`): Detects Cloud vs client-managed, provides unified adapter interface. Both adapters are standalone modules — Cloud does NOT delegate to client-managed.
- **Theme layer** (`src/theme/`): Resolves preset defaults + per-property overrides into CSS custom properties. Four built-in presets: Default, Lean Green Machine, Corporate Blue, Corporate Gold.
- **Tour engine** (`src/tour/`): Transforms tour configs into driver.js steps, manages localStorage-based "show once" tracking.
- **UI layer** (`src/ui/`): `widget-renderer.js` renders analysis mode; `tour-editor.js` provides the full-screen modal editor in edit mode.
- **Utilities** (`src/util/`): Logger, Markdown-to-HTML converter, UUID generator.

## Important Constraints

- **No dynamic imports** — the Rollup UMD bundle must be a single file. Both platform adapters are statically imported.
- **Color picker values** use `{ color: '#hexval', index: '-1' }` format. The `#` prefix is required.
- **Font size / border radius** properties use `type: 'string'` (not `'integer'`) to avoid Qlik's integer validation showing red boxes.
- **Edit mode detection** uses `/\/edit(?:\b|$)/` regex to handle both Cloud (`/sheet/id/edit`) and client-managed (`/state/edit`).

## Linting, Formatting, and Diffs

- The repo enforces **Prettier** and **strict JSDoc rules** via ESLint.
- Do **not** do drive-by formatting/indentation changes "by hand". Keep diffs focused on the requested change.
- When you add or modify a function/method/class, include complete JSDoc:
    - Describe behavior.
    - List all params (including object param properties when feasible).
    - List return type(s), including Promises.
    - Insert an empty line between param and return sections.

## Build Output

- `onboard-qs-ext/` — unpacked extension folder (UMD bundle + .qext manifest)
- `onboard-qs.zip` — deployable package (~40 KB)
- The `scripts/post-build.mjs` script handles token replacement (`__BUILD_TYPE__`, `__PACKAGE_VERSION__`)
- The `scripts/zip-extension.mjs` script creates the zip from the extension folder

## Repo Hygiene

- Do not edit generated artifacts or dependencies (e.g. `node_modules/`, `onboard-qs-ext/`, `dist/`) unless the task explicitly requires it.
- Only runtime dependency is `driver.js`. Everything else is dev-only.
