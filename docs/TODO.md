# Project TODO

This file tracks follow-up improvements for Onboard.qs.

## Immediate Alignment Work

- [x] Inventory durable workflow sources before hardening GitHub Actions. Confirm which files under `.github/workflows/` are hand-authored and which are generated from agentic workflow sources so fixes are applied in the right place.
- [x] Harden `.github/workflows/ci.yaml` with the same GitHub Actions security principles used in HelpButton.qs where they fit: default-deny workflow permissions, tighter job permissions, hardened checkout usage, and safer shell expression handling.
- [x] Harden `.github/workflows/codeql-analysis.yaml` with concurrency, `persist-credentials: false`, and fork-safe pull request handling for SARIF uploads.
- [x] Harden `.github/workflows/virus-scan.yaml` without losing the current dual-zip scanning behavior for the outer release package and the inner extension zip.
- [x] Add `.github/workflows/zizmor.yaml`.
- [ ] Run Zizmor against all workflow files, including generated agentic workflows, then fix findings at the durable source.
- [x] Add CycloneDX SBOM generation to the release pipeline and publish the SBOM beside the existing release artifacts.
- [x] Refresh CI action and runtime conventions where compatible, including `release-please-action`, `actions/setup-node`, and checkout hardening, while keeping Onboard.qs on stable releases from `main` only.
- [ ] Update `docs/GITHUB_WORKFLOWS.md`, `docs/BUILD-AND-DEPLOYMENT.md`, and maintainer guidance in `AGENTS.md` and `README.md` after the workflow and release changes land.
- [ ] Run end-to-end validation after the pipeline changes: `npm ci`, `npm run lint:fix`, `npm run format`, `npm run pack:prod`, release artifact inspection, and workflow validation for CodeQL, Zizmor, and VirusTotal.

## Follow-On Quality Improvements

- [ ] Add automated tests for the most critical behaviors, especially platform detection, tour transformation, import and export flows, and show-once logic.
- [ ] Add coverage reporting or another lightweight confidence signal for future test work so regressions are easier to spot.
- [ ] Add bundle-size regression checks or CI alerts using the existing bundle analysis output.
- [ ] Add automated accessibility checks for the tour editor, toolbar button, and driver.js popover flows.
- [ ] Document a repeatable local verification workflow for Qlik Cloud and client-managed testing so release validation is less dependent on memory.
- [ ] Reassess whether stronger static analysis is needed as the codebase grows, for example through stricter lint rules or gradual type-safety improvements.

## Notes

- Pre-release branch automation is intentionally out of scope for now. Keep Onboard.qs on stable, `main`-only releases unless that decision changes.
- Preserve Onboard.qs strengths while aligning upward: Husky plus gitleaks pre-commit checks, explicit Prettier config, npm plus GitHub Actions Dependabot coverage, richer root-level docs, repo-local PDF generation, and dual-zip VirusTotal reporting.
