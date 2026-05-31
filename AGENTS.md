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

## Project Todo List

**Keep a project-wide todo list** in `./docs/TODO.md` for things that need follow-up:

- Tests skipped or marked as pending (e.g., `test.skip()`)
- Security findings or vulnerabilities discovered
- Known flaky tests that need investigation
- Feature gaps or missing test coverage
- Bugs found during testing that aren't part of the test itself

Use Mermaid to explain complex flows or architecture where helpful.

When you skip a test, add a TODO item so it's not forgotten:

```markdown
- [ ] Investigate show-once behavior (test 05-tour-features spec skipped)
```

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **onboard.qs** (1133 symbols, 1818 relationships, 84 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource                                    | Use for                                  |
| ------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/onboard.qs/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/onboard.qs/clusters`       | All functional areas                     |
| `gitnexus://repo/onboard.qs/processes`      | All execution flows                      |
| `gitnexus://repo/onboard.qs/process/{name}` | Step-by-step execution trace             |

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |
| Work in the Ui area (69 symbols)             | `.claude/skills/generated/ui/SKILL.md`                      |
| Work in the Tour area (33 symbols)           | `.claude/skills/generated/tour/SKILL.md`                    |
| Work in the Util area (20 symbols)           | `.claude/skills/generated/util/SKILL.md`                    |
| Work in the Platform area (17 symbols)       | `.claude/skills/generated/platform/SKILL.md`                |
| Work in the Ext area (16 symbols)            | `.claude/skills/generated/ext/SKILL.md`                     |

<!-- gitnexus:end -->
