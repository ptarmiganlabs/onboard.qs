# GitHub Workflows

This document outlines the various GitHub Workflows configured in the `onboard.qs` repository under `.github/workflows`. The repository utilizes a mix of traditional GitHub Actions and Copilot Agentic workflows (`gh-aw`).

## Standard GitHub Actions Workflows

These are standard YAML-based workflows used for continuous integration, deployment, and security checks.

- **`ci.yaml`**
  - **Purpose**: Automates the testing, building, and publishing sequence of the project.
  - **Triggers**: Manually (`workflow_dispatch`) or automatically when pushing to the `main` branch.
  - **Details**: Handles version bumping and PR management via Release Please. On successful release, it builds the production zip, injects version metadata, and uploads the artifacts to the GitHub release.

- **`codeql-analysis.yaml`**
  - **Purpose**: Checks the codebase for known vulnerabilities using GitHub's CodeQL static code analyzer.
  - **Triggers**: Scheduled execution, pushes/PRs against `main`, and manual execution.
  - **Details**: Scans JavaScript files and uploads security feedback to GitHub's code scanning alerts.

- **`virus-scan.yaml`**
  - **Purpose**: Scans published artifacts with VirusTotal to prevent distributing malware.
  - **Triggers**: Runs when a new GitHub release is published.
  - **Details**: Downloads the release artifacts, extracts the extension ZIP, uploads to VirusTotal, and appends the scan results to the release's Markdown body.

- **`agentics-maintenance.yml`**
  - **Purpose**: An auto-generated utility workflow that cleans up old/stale artifacts created by the agentic workflows.
  - **Triggers**: Runs on a cron schedule and manually.
  - **Details**: Programmatically closes expired issues, discussions, and pull requests that have passed their designated lifetime.

## Copilot Agentic Workflows

These workflows are built with the [GitHub Agent Workflows (`gh-aw`)](https://github.com/github/gh-aw) framework. Their logic is defined in Markdown files (`.md`), which compile into functional `.lock.yml` GitHub Actions definitions.

- **`code-simplifier` (`.md` / `.lock.yml`)**
  - **Purpose**: An expert code simplification agent that applies project-specific styles to enhance code clarity and readability.
  - **Triggers**: Manual execution (`workflow_dispatch`).
  - **Details**: Reads recent commits/PRs and creates a new pull request summarizing formatting and readability refinements.

- **`daily-file-diet` (`.md` / `.lock.yml`)**
  - **Purpose**: Monitors the repository for exceptionally large source files that violate size thresholds.
  - **Triggers**: Manual execution (`workflow_dispatch`).
  - **Details**: Opens a GitHub issue suggesting how to break down oversized files for better maintainability.

- **`daily-malicious-code-scan` (`.md` / `.lock.yml`)**
  - **Purpose**: A security verification agent that reviews recent code changes for suspicious patterns or known attack vectors.
  - **Triggers**: Manual execution (`workflow_dispatch`).
  - **Details**: Creates and logs GitHub code scanning alerts if threat patterns are detected.

- **`daily-secrets-analysis` (`.md` / `.lock.yml`)**
  - **Purpose**: Reviews how environment variables and secrets are handled across all compiled `.yml` workflows to detect misconfigurations.
  - **Triggers**: Manual execution (`workflow_dispatch`).
  - **Details**: Opens a GitHub discussion regarding potential issues, expiring automatically after a set duration.

- **`duplicate-code-detector` (`.md` / `.lock.yml`)**
  - **Purpose**: Scans the codebase for identically written or duplicated code blocks to reduce technical debt.
  - **Triggers**: Manual execution (`workflow_dispatch`).
  - **Details**: Creates an issue mapping specific refactoring steps to group similar logic.

- **`weekly-repo-status` (`.md` / `.lock.yml`)**
  - **Purpose**: A data aggregator that captures recent commits, PR events, and issues to highlight productivity and community status.
  - **Triggers**: Scheduled execution (Sundays) or manual triggering.
  - **Details**: Generates a comprehensive status report issue about the health and velocity of the repository.
