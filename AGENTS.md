# AGENTS.md

## Onboarding

At the start of each session, read: `README.md` and `docs/*.md` for architecture, platform, tour system, selectors, and build details.

## Quality Gates (required before commit)

Run in order: `npm run lint:fix` → `npm run format` → verify build works

## Quick Commands

```bash
npm run lint:fix      # Fix lint errors
npm run format        # Format code
npm run pack:dev      # Dev build + zip
npm run pack:prod     # Production build + zip (CI release)
npm run start         # Local nebula dev server
```

## Project Basics

- **Qlik Sense extension** built with [nebula.js](https://qlik.dev/toolkits/nebulajs/), bundled as UMD via Rollup
- `"type": "module"` — use ESM `import`/`export`
- Entry points: `src/index.js` (Supernova), `src/ext.js` (property panel)
- Supports Qlik Cloud and Qlik Sense Enterprise (client-managed)

## Architecture

- `src/platform/` — Cloud vs client-managed detection, standalone adapters
- `src/theme/` — preset defaults + overrides → CSS custom properties; 4 presets
- `src/tour/` — driver.js step transformation, localStorage "show once" tracking
- `src/ui/` — widget-renderer (analysis), tour-editor (edit mode modal)
- `src/util/` — Logger, Markdown-to-HTML, UUID

## Constraints

- No dynamic imports — UMD bundle must be single file
- Color picker values: `{ color: '#hexval', index: '-1' }` (with `#` prefix)
- Font/border-radius props use `type: 'string'` not `'integer'`
- Edit mode regex: `/\/edit(?:\b|$)/` for Cloud and client-managed

## JSDoc

When adding/modifying functions, include complete JSDoc: describe behavior, list all params (including object properties), list return types (including Promises), empty line between params and return.

## Release Process

- CI uses [release-please](.github/workflows/ci.yaml) — automatic versioning from conventional commits
- `npm run pack:prod` produces `onboard-qs.zip` and `README.pdf`
- Release zip: `onboard-qs-v{VERSION}.zip` containing: LICENSE, readme.txt, README.pdf, onboard-qs.zip

## Build Artifacts (do not edit)

- `onboard-qs-ext/` — unpacked extension folder
- `onboard-qs.zip` — deployable package (~40 KB)
- `dist/` — Rollup output

## Repo Hygiene

- Do not edit generated artifacts (`node_modules/`, `onboard-qs-ext/`, `dist/`) unless task requires it
- Only runtime deps: `driver.js`, `dompurify`; everything else dev-only
- Keep diffs focused — avoid drive-by formatting changes
