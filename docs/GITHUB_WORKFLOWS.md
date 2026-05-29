# GitHub Workflows

This document outlines the GitHub workflows configured in `onboard.qs` under `.github/workflows` and the durable source of truth for each of them.

## Source Of Truth

All workflows in this repository are hand-authored and edited directly:

- `ci.yaml`
- `codeql-analysis.yaml`
- `copilot-setup-steps.yml`
- `virus-scan.yaml`
- `zizmor.yaml`

Some legacy gh-aw/Copilot agent guidance in the repository may still mention generated `*.lock.yml` files, but those references are historical only and are not the source of truth for the workflows above.

## Core GitHub Actions Workflows

These are the hand-authored workflows used for release automation, security checks, and Copilot agent setup.

- **`ci.yaml`** — Purpose: automate release creation, production packaging, and release artifact upload. Triggers: `workflow_dispatch` and pushes to `main`. Details: runs Release Please, builds the production package, assembles the outer release zip, generates a CycloneDX SBOM, and uploads the release artifacts.
- **`codeql-analysis.yaml`** — Purpose: run GitHub CodeQL static analysis on the JavaScript codebase. Triggers: manual runs, pushes to `main`, pull requests against `main`, and a weekly schedule. Details: initializes CodeQL, autobuilds the project, and uploads results to GitHub code scanning.
- **`copilot-setup-steps.yml`** — Purpose: prepare the GitHub Copilot Agent environment for this repository. Triggers: manual runs and pushes that modify the workflow file. Details: checks out the repository and installs the `gh-aw` CLI extension used by the configured MCP tooling.
- **`virus-scan.yaml`** — Purpose: scan published release artifacts with VirusTotal. Triggers: published GitHub releases. Details: downloads release assets, extracts the inner extension zip, scans both the outer release zip and the inner extension zip, and appends the results to the GitHub release body.
- **`zizmor.yaml`** — Purpose: scan the repository's GitHub Actions workflows for insecure patterns and risky configurations. Triggers: manual runs, pushes to `main`, and pull requests. Details: runs Zizmor, produces SARIF output, and uploads the findings to GitHub code scanning.

## Maintainer Notes

- When workflow hardening work starts, update the hand-authored YAML first, then run Zizmor against the full workflow set.
